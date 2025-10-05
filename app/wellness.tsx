// app/(tabs)/wellness.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  InteractionManager,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const options = { headerShown: false };

const BASE_URL = 'https://stormhack-backend-production.up.railway.app'; // same as Pairing
const STORAGE_KEY = 'eatwise:recent_wellness_searches';
const MAX_RECENTS = 4;

type Filter = 'all' | 'avoid' | 'benefit';
type ApiFilter = 'all' | 'avoid' | 'beneficial';
type Mode = 'daily' | 'chronic';

type SourceRef = { label: string; url: string | null };

type DiseaseItem = {
  food?: string;              // API uses "food"
  ingredient?: string;        // just in case
  reason: string;
  severity: number;
  affectedDiseases?: string[];
  sources?: SourceRef[];
};

type DiseaseGuide = {
  diseases: string[];
  avoid?: DiseaseItem[];
  beneficial?: DiseaseItem[];
};

const webOnly = (s: any) => (Platform.OS === 'web' ? s : null);

export default function WellnessScreen() {
  // segmented tabs
  const [activeSeg, setActiveSeg] = useState<'pairing' | 'wellness'>('wellness');

  // demo mode (doesn't affect API, only placeholder/prompt)
  const [mode, setMode] = useState<Mode>();

  // filter & search
  const [filter, setFilter] = useState<Filter | null>('all');
  const [inputOpen, setInputOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const [inputFocused, setInputFocused] = useState(false);

  // API state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseGuide | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // layout
  const insets = useSafeAreaInsets();
  const FOOTER_H = 60;

  // focus ref
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setRecents(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  const persistRecents = async (next: string[]) => {
    setRecents(next);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const addRecent = async (text: string) => {
    const t = text.trim(); if (!t) return;
    const next = [t, ...recents.filter(r => r.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENTS);
    await persistRecents(next);
  };

  const clearRecents = async () => { await persistRecents([]); };

  const apiFilter = (f: Filter | null): ApiFilter =>
    f === 'benefit' ? 'beneficial' : (f ?? 'all');

  // split on commas or whitespace, trim, dedupe, keep order
  function parseDiseases(input: string): string[] {
    const parts = input
      .split(/[,\s]+/)
      .map(s => s.trim())
      .filter(Boolean);
    const seen = new Set<string>();
    const list: string[] = [];
    for (const p of parts) {
      const lower = p.toLowerCase();
      if (!seen.has(lower)) { seen.add(lower); list.push(p); }
    }
    return list;
  }

  const onSearch = async () => {
    const q = query.trim();
    if (!q) return;
    const diseases = parseDiseases(q);
    if (diseases.length === 0) return;

    await addRecent(q);
    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(`${BASE_URL}/api/diseases/guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ diseases, filter: apiFilter(filter) }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let msg: string | undefined;
        try { msg = (await res.json())?.message; } catch {}
        throw new Error(msg || `Request failed (${res.status})`);
      }

      const data: DiseaseGuide = await res.json();
      setResult(data);
      setActiveSeg('wellness'); // keep this tab active
    } catch (err: any) {
      setErrorMsg(err?.name === 'AbortError' ? 'Request timed out' : (err?.message || 'Something went wrong'));
      setResult(null);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const ClearAll = () => {
    setFilter('all');
    setInputOpen(false);
    setQuery('');
    setInputFocused(false);
    setErrorMsg(null);
    setResult(null);
  };

  const canSearch = query.trim().length > 0;

  // open input + focus reliably (match Pairing behavior)
  const toggleInputOpen = () => {
    setInputOpen(prev => {
      const next = !prev;
      if (next) {
        requestAnimationFrame(() => inputRef.current?.focus());
        InteractionManager.runAfterInteractions(() => inputRef.current?.focus());
        setTimeout(() => inputRef.current?.focus(), 10);
      }
      return next;
    });
  };

  const kavBehavior =
    Platform.OS === 'ios' ? 'padding' :
    Platform.OS === 'android' ? 'height' :
    undefined;

  // dynamic placeholder + prompt text based on mode
  const placeholder =
    mode === 'daily'
      ? 'Search: period, fatigue, digestion…'
      : 'Search: diabetes, hypertension…';

      const promptCopy =
      mode === 'daily'
        ? 'find ingredients for daily wellness'
        : mode === 'chronic'
          ? 'find ingredients for chronic care'
          : 'find ingredients for...';
    


  return (
    <SafeAreaView style={styles.safe} edges={['top','left','right','bottom']}>
      <View style={{ flex: 1 }}>
        {/* Header (logo + segmented tabs) */}
        <View>
          <View style={styles.logoWrap}>
            <Image
              source={require('../assets/images/logo2.png')}
              style={styles.logo}
              resizeMode="contain"
              accessible
              accessibilityLabel="App logo"
            />
          </View>

          <View style={styles.segmented}>
            <Pressable
              style={[styles.segment, activeSeg === 'pairing' && styles.segmentActive]}
              onPress={() => {
                if (activeSeg !== 'pairing') {
                  setActiveSeg('pairing');
                  router.push('/pair');
                }
              }}
              {...webOnly({ role: 'button' })}
            >
              <Text style={[styles.segmentText, activeSeg === 'pairing' && styles.segmentTextActive]}>
                Pairing
              </Text>
            </Pressable>

            <Pressable
              style={[styles.segment, activeSeg === 'wellness' && styles.segmentActive]}
              onPress={() => {
                if (activeSeg !== 'wellness') {
                  setActiveSeg('wellness');
                  router.push('/wellness');
                }
              }}
              disabled={activeSeg === 'wellness'}
              {...webOnly({ role: 'button' })}
            >
              <Text style={[styles.segmentText, activeSeg === 'wellness' && styles.segmentTextActive]}>
                Wellness
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Body */}
        <KeyboardAvoidingView behavior={kavBehavior} style={{ flex: 1 }}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: FOOTER_H + insets.bottom + 16, paddingTop: 8 }}
            keyboardShouldPersistTaps="always"
          >
            {/* If we have results, render like Pairing; else show search card */}
            {result ? (
              <ResultView
                result={result}
                filter={filter}
                query={query}
                onBack={() => { setResult(null); ClearAll(); }}
              />
            ) : (
              <View style={styles.card}>
                <Text style={styles.kicker}>For my</Text>

                {/* Demo-only mode row (doesn't affect API; controls placeholder/prompt) */}
                <View style={[styles.modeRow, { marginBottom: 0 }]}>
                  <ModeChip
                    emoji="️️🌤️"
                    label="Daily Wellness"
                    active={mode === 'daily'}
                    onPress={() => setMode('daily')}
                  />
                  <ModeChip
                    emoji="🩺"
                    label="Chronic care"
                    active={mode === 'chronic'}
                    onPress={() => setMode('chronic')}
                  />
                </View>

                <Text style={[styles.kicker, { marginTop: 14 }]}>Filter</Text>

                <View style={[styles.modeRow, { marginBottom: 0 }]}>
                  <FilterChip
                    emoji="🌱"
                    label="Recommended"
                    variant="benefit"
                    active={filter === 'benefit'}
                    onPress={() => setFilter('benefit')}
                  />
                  <FilterChip
                    emoji="⚠️"
                    label="Avoid"
                    variant="avoid"
                    active={filter === 'avoid'}
                    onPress={() => setFilter('avoid')}
                  />
                  <FilterChip
                    emoji="🗂️"
                    label="All"
                    variant="all"
                    active={filter === 'all'}
                    onPress={() => setFilter('all')}
                  />
                </View>

                {/* Prompt row */}
                <Pressable
                  style={({ pressed }) => [styles.bigPrompt, pressed && { opacity: 0.95 }]}
                  onPress={toggleInputOpen}
                  {...webOnly({ role: 'button' })}
                >
                  <Text style={styles.bigPromptText}>{promptCopy}</Text>
                  <Ionicons name="arrow-forward" size={22} color="#111827" />
            
                </Pressable>

                {/* Rounded search input */}
                {inputOpen && (
                  <View style={styles.roundSearchWrap}>
                    <Ionicons name="search" size={18} color="#6B7280" />
                    <TextInput
                      ref={inputRef}
                      placeholder={placeholder}
                      placeholderTextColor="#9CA3AF"
                      value={query}
                      onChangeText={setQuery}
                      style={styles.roundInput}
                      returnKeyType="search"
                      onSubmitEditing={onSearch}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      inputMode={Platform.select({ web: 'text', default: undefined })}
                      enterKeyHint={Platform.select({ web: 'search', default: undefined })}
                    />
                  </View>
                )}

               {/* Recents — only show when input is open */}
{inputOpen && (
  <>
    <View style={[styles.rowBetween, { marginTop: 26 }]}>
      <Text style={styles.sectionLabel}>Recent Searches</Text>
      {recents.length > 0 && (
        <Pressable onPress={clearRecents} {...webOnly({ role: 'button' })}>
          <Text style={[styles.link, webOnly({ cursor: 'pointer' })]}>Clear</Text>
        </Pressable>
      )}
    </View>

    {recents.length === 0 ? (
      <Text style={styles.emptyText}>No search history yet</Text>
    ) : (
      <View style={{ marginTop: 6 }}>
        {recents.map((item, i) => (
          <Pressable
            key={`${item}-${i}`}
            style={({ pressed }) => [styles.recentPillRow, pressed && { opacity: 0.95 }]}
            onPress={() => { setQuery(item); onSearch(); }}
            {...webOnly({ role: 'button' })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={16} color="#6B7280" style={webOnly({ marginRight: 8 })} />
              <Text style={styles.recentPillText}>{item}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>
        ))}
      </View>
    )}
  </>
)}


                {!!errorMsg && <Text style={{ color: '#DC2626', marginTop: 10 }}>{errorMsg}</Text>}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer */}
        <View style={[styles.footer, { height: FOOTER_H }]}>
          <Pressable style={styles.clearBtn} onPress={ClearAll} {...webOnly({ role: 'button' })}>
            <Text style={styles.clearText}>Clear All</Text>
          </Pressable>

          <Pressable
            style={[styles.searchBtn, canSearch ? styles.searchBtnOn : styles.searchBtnOff]}
            onPress={onSearch}
            disabled={!canSearch || loading}
            {...webOnly({ role: 'button' })}
          >
            {loading ? (
              <ActivityIndicator size="small" color={canSearch ? '#FFFFFF' : '#9CA3AF'} />
            ) : (
              <Ionicons name="search" size={18} color={canSearch ? '#FFFFFF' : '#9CA3AF'} />
            )}
            <Text style={[styles.searchText, canSearch ? styles.searchTextOn : styles.searchTextOff]}>
              Search
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

/** ===== Helpers for results rendering (inline), mirroring Pairing ===== */

type Row = DiseaseItem & { _kind: 'good' | 'bad', _name: string };

function rowsFromResult(res: DiseaseGuide, filter: Filter | null): Row[] {
  const nameOf = (x: DiseaseItem) => (x.food || x.ingredient || '').trim();
  const goods: Row[] = (res.beneficial ?? []).map(x => ({ ...x, _kind: 'good' as const, _name: nameOf(x) }));
  const bads:  Row[] = (res.avoid ?? []).map(x => ({ ...x, _kind: 'bad'  as const, _name: nameOf(x) }));

  const bySeverity = (a: DiseaseItem, b: DiseaseItem) =>
    (b.severity ?? 0) - (a.severity ?? 0) || (nameOf(a)).localeCompare(nameOf(b), undefined, { sensitivity: 'base' });

  goods.sort(bySeverity);
  bads.sort(bySeverity);

  if (filter === 'benefit') return goods;
  if (filter === 'avoid')   return bads;
  return [...goods, ...bads];
}

function getHeaderTone(res: DiseaseGuide, filter: Filter | null) {
  if (filter === 'avoid' && (res.avoid?.length ?? 0) > 0) return 'bad';
  if ((res.beneficial?.length ?? 0) > 0) return 'good';
  if ((res.avoid?.length ?? 0) > 0) return 'bad';
  return 'neutral';
}

function ResultView({
  result,
  filter,
  query,
  onBack,
}: {
  result: DiseaseGuide;
  filter: Filter | null;
  query: string;
  onBack: () => void;
}) {
  const rows = rowsFromResult(result, filter);
  const tone = getHeaderTone(result, filter);
  const showBadge = tone !== 'neutral';
  const isGood = tone === 'good';

  return (
    <View style={[styles.card, { paddingTop: 60, paddingBottom: 16 }]}>
      {/* Back chip */}
      <Pressable
        onPress={onBack}
        style={{ alignSelf: 'flex-start', padding: 8, borderRadius: 999, backgroundColor: '#F3F4F6', marginBottom: 8 }}
      >
        <Ionicons name="chevron-back" size={20} color="#111827" />
      </Pressable>

      {/* Title */}
      <Text style={[styles.title, { textAlign: 'center' }]}>
        ingredients for{'\n'}
        <Text style={{ textDecorationLine: 'underline' }}>
          {(result.diseases && result.diseases.length > 0) ? result.diseases.join(', ') : query}
        </Text>
      </Text>

      {/* Badges */}
      {(filter === 'all' || filter == null) ? (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          {!!(result.beneficial?.length) && (
            <View
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1,
                backgroundColor: '#ECFDF5', borderColor: '#16A34A',
              }}
            >
              <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
              <Text style={{ color: '#16A34A', textAlign: 'center' }}>Recommended</Text>
            </View>
          )}
          {!!(result.avoid?.length) && (
            <View
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1,
                backgroundColor: '#FEF2F2', borderColor: '#DC2626',
              }}
            >
              <Ionicons name="close-circle" size={16} color="#DC2626" />
              <Text style={{ color: '#DC2626', textAlign: 'center' }}>Avoid</Text>
            </View>
          )}
        </View>
      ) : (
        showBadge && (
          <View
            style={{
              alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1,
              backgroundColor: isGood ? '#ECFDF5' : '#FEF2F2',
              borderColor: isGood ? '#16A34A' : '#DC2626',
              marginBottom: 10,
            }}
          >
            <Ionicons name={isGood ? 'checkmark-circle' : 'close-circle'} size={16} color={isGood ? '#16A34A' : '#DC2626'} />
            <Text style={{ color: isGood ? '#16A34A' : '#DC2626', textAlign: 'center' }}>
              {isGood ? 'Recommended' : 'Avoid'}
            </Text>
          </View>
        )
      )}

      {/* Accordion list */}
      <ResultAccordion rows={rows} />
    </View>
  );
}

function ResultAccordion({ rows }: { rows: Row[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <View style={{ marginTop: 16 }}>
      {rows.map((r, idx) => {
        const isOpen = open === idx;
        const color  = r._kind === 'good' ? '#16A34A' : '#DC2626';
        const icon   = r._kind === 'good'
          ? (isOpen ? 'checkmark-circle' : 'checkmark-circle-outline')
          : (isOpen ? 'close-circle' : 'close-circle-outline');

        return (
          <View
            key={`${r._name}-${idx}`}
            style={{
              borderRadius: 12, overflow: 'hidden', marginBottom: 10,
              backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB'
            }}
          >
            <Pressable
              onPress={() => setOpen(isOpen ? null : idx)}
              style={{ paddingHorizontal: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={icon as any} size={18} color={color} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>{r._name}</Text>
              </View>
              <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
            </Pressable>

            {isOpen && (
              <View style={{ paddingHorizontal: 12, paddingBottom: 14 }}>
                <Text style={{ fontSize: 14, color: '#374151' }}>{r.reason}</Text>

                {/* Affected diseases */}
                {!!(r.affectedDiseases?.length) && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {r.affectedDiseases!.map((d, i) => (
                      <View
                        key={`${d}-${i}`}
                        style={{
                          paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999,
                          backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB'
                        }}
                      >
                        <Text style={{ fontSize: 12, color: '#111827' }}>{d}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Severity */}
                <View style={[styles.badge, { backgroundColor: r._kind === 'good' ? '#ECFDF5' : '#FEF2F2', borderColor: color, alignSelf: 'flex-start', marginTop: 8 }]}>
                  <Text style={[styles.badgeText, { color }]}>{`Severity: ${r.severity}`}</Text>
                </View>

                {/* Sources */}
                {Array.isArray(r.sources) && r.sources.length > 0 && (
                  <View style={{ marginTop: 8, gap: 4 }}>
                    {r.sources.map((s, i) => (
                      <Pressable
                        key={`${s.label}-${i}`}
                        onPress={() => s.url && Linking.openURL(s.url)}
                        disabled={!s.url}
                        style={({ pressed }) => pressed && s.url ? { opacity: 0.85 } : undefined}
                      >
                        <Text style={[styles.sourceLine, !s.url && { color: '#6B7280' }]}>
                          • {s.label}{s.url ? '  ↗' : ''}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

/** ===== Small UI atoms ===== */
function ModeChip({
    emoji,
    label,
    active,
    onPress,
  }: {
    emoji: string;
    label: string;
    active: boolean;
    onPress: () => void;
  }) {
    const isDaily = label.toLowerCase().includes('daily');
    const bgColor = active
      ? isDaily
        ? '#FFF4E5' 
        : '#E5E7EB' 
      : '#FFFFFF';
    const borderColor = active
      ? isDaily
        ? '#F97316'
        : '#9CA3AF'
      : '#E5E7EB';
    const textColor = active
      ? isDaily
        ? '#C2410C' 
        : '#374151' 
      : '#6B7280'; 
  
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.modeChip,
          { backgroundColor: bgColor, borderColor: borderColor },
        ]}
        android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
        {...webOnly({ role: 'button' })}
      >
        <Text style={[styles.modeChipText, { color: textColor }]}>
          {emoji} {label}
        </Text>
      </Pressable>
    );
  }

function FilterChip({
  emoji,
  label,
  variant,
  active,
  onPress,
}: {
  emoji: string;
  label: string;
  variant: 'all' | 'avoid' | 'benefit';
  active: boolean;
  onPress: () => void;
}) {
  const { bg, border, text } = getChipColors(variant, active);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: bg, borderColor: border },
        pressed && { opacity: 0.9 },
      ]}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      {...webOnly({ role: 'button' })}
    >
      <Text style={[styles.chipText, { color: text }]}>{emoji} {label}</Text>
    </Pressable>
  );
}

function getChipColors(variant: 'all' | 'avoid' | 'benefit', active: boolean) {
  const NEUTRAL = { bg: '#FFFFFF', border: '#E5E7EB', text: '#111827' };
  if (!active) return NEUTRAL;
  switch (variant) {
    case 'benefit': return { bg: '#F2FFF6', border: '#009632', text: '#009632' };
    case 'avoid':   return { bg: '#FFFAF7', border: '#F55A00', text: '#FF5E00' };
    case 'all':     return { bg: '#F7FBFF', border: '#0054D1', text: '#0054D1' };
  }
}

/** ===== Styles (borrowed from Pairing + small additions) ===== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F5F7' },
  scroll: { flex: 1, paddingHorizontal: 20 },

  // logo / tabs
  logoWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 44, paddingBottom: 12 },
  logo: { width: 60, height: 68, alignSelf: 'center' },
  segmented: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#E9EBEF',
    padding: 4,
    borderRadius: 16,
    gap: 6,
    marginBottom: 12,
  },
  segment: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  segmentTextActive: { color: '#111827' },

  // card container (same vibe as Pairing big card)
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#EDF0F4',
    marginTop: 8,
  },

  // “For my”
  kicker: {
    fontSize: 28,
    color: '#0F172A',
    fontFamily: 'PretendardJP-Light',
    textAlign: 'left',
    marginBottom: 12,
  },

  // mode chips row
  modeRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  modeChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  modeChipOn: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  modeChipOff: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  modeChipText: { fontSize: 15 },
  modeChipTextOn: { color: '#0F172A' },
  modeChipTextOff: { color: '#6B7280' },

  // filter chips
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    ...webOnly({
      outlineStyle: 'none',
      WebkitTapHighlightColor: 'transparent',
      userSelect: 'none',
      cursor: 'pointer',
    }),
  },
  chipText: { fontSize: 14 },

  // prompt row
  bigPrompt: {
    marginTop: 4,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bigPromptText: {
    fontSize: 28,
    color: '#0F172A',
    fontFamily: 'PretendardJP-Light',
  },

  // round search
  roundSearchWrap: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 12, android: 8, default: 10 }),
  },
  roundInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
    ...Platform.select({
      web: { outlineWidth: 0, outlineColor: 'transparent', caretColor: '#111827' },
    }),
  },

  // recents
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 16, fontWeight: '500', color: '#0F172A' },
  link: { fontWeight: '700', color: '#2563EB' },
  emptyText: { color: '#6B7280', fontSize: 14, paddingVertical: 8 },

  recentPillRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, marginTop: 8,
    ...webOnly({ outlineStyle: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none', cursor: 'pointer' }),
  },
  recentPillText: { fontSize: 15, color: '#111827', fontWeight: '600' },

  // footer (same as Pairing)
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6,
    backgroundColor: '#F4F5F7', flexDirection: 'row', gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB',
  },
  clearBtn: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#3B82F6',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF',
    ...webOnly({ outlineStyle: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none', cursor: 'pointer' }),
  },
  clearText: { fontSize: 16, fontWeight: '700', color: '#2563EB' },
  searchBtn: {
    flex: 1.2, height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    ...webOnly({ outlineStyle: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none', cursor: 'pointer' }),
  },
  searchBtnOn: { backgroundColor: '#2563EB' },
  searchBtnOff: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  searchText: { fontSize: 16, fontWeight: '700' },
  searchTextOn: { color: '#FFFFFF' },
  searchTextOff: { color: '#9CA3AF' },

  // misc
  badge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1 },
  badgeText: { fontSize: 13, fontWeight: '700' },

  // titles
  title: { fontSize: 30, color: '#0F172A', fontFamily: 'PretendardJP-Light', marginBottom: 25 },
  sourceLine: { fontSize: 13, color: '#2563EB' },
});
