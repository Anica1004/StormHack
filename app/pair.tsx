// app/(tabs)/pair.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  useWindowDimensions,
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

const BASE_URL = 'https://stormhack-backend-production.up.railway.app'; // ← deployed API
const STORAGE_KEY = 'eatwise:recent_pair_searches';
const MAX_RECENTS = 4;

export const options = { headerShown: false };

type Filter = 'all' | 'avoid' | 'benefit';
type ApiFilter = 'all' | 'avoid' | 'beneficial';

type SourceRef = { label: string; url: string | null };
type CompatibilityItem = {
  food: string;
  reason: string;
  severity: number;
  sources?: SourceRef[];
};

type CompatibilityResponse = {
  ingredient: string;
  category: string;
  avoid?: CompatibilityItem[];
  beneficial?: CompatibilityItem[];
};

// helper: apply styles only on web
const webOnly = (s: any) => (Platform.OS === 'web' ? s : null);

export default function PairScreen() {
  const [filter, setFilter] = useState<Filter | null>(null);
  const [inputOpen, setInputOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const [inputFocused, setInputFocused] = useState(false);

  // API state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompatibilityResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // NEW: segmented active state (pairing or wellness)
  const [activeSeg, setActiveSeg] = useState<'pairing' | 'wellness'>('pairing');

  // focus ref
  const inputRef = useRef<TextInput>(null);

  // layout helpers
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const FOOTER_H = 60;
  const [headerH, setHeaderH] = useState(0);

  // keep white card height stable (search state)
  const cardMinHeight = Math.max(
    0,
    height - insets.top - insets.bottom - FOOTER_H - headerH - 30
  );

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

  const onSearch = async () => {
    const q = query.trim();
    if (!q) return;

    await addRecent(q);

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const url = `${BASE_URL}/api/ingredients/${encodeURIComponent(q)}/compatibility?filter=${apiFilter(filter)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!res.ok) {
        let msg: string | undefined;
        try { msg = (await res.json())?.message; } catch {}
        throw new Error(msg || `Request failed (${res.status})`);
      }

      const data: CompatibilityResponse = await res.json();
      setResult(data); // show inline (no modal)
      setActiveSeg('pairing'); // keep "Pairing" selected like your screenshot
    } catch (err: any) {
      setErrorMsg(err?.name === 'AbortError' ? 'Request timed out' : (err?.message || 'Something went wrong'));
      // show the error inline too
      setResult(null);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const ClearAll = () => {
    setFilter(null);
    setInputOpen(false);
    setQuery('');
    setInputFocused(false);
    setErrorMsg(null);
  };

  const canSearch = query.trim().length > 0;

  // open input + focus reliably
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

  return (
    <SafeAreaView style={styles.safe} edges={['top','left','right','bottom']}>
      <View style={styles.container}>

        <View onLayout={e => setHeaderH(e.nativeEvent.layout.height)}>
          {/* Logo row */}
          <View style={styles.logoWrap}>
            <Image
              source={require('../assets/images/logo2.png')}
              style={styles.logo}
              resizeMode="contain"
              accessible
              accessibilityLabel="App logo"
            />
          </View>

          {/* Segmented toggle: Pairing / Wellness */}
          <View style={styles.segmented}>
            <Pressable
              style={[styles.segment, activeSeg === 'pairing' && styles.segmentActive]}
              disabled={activeSeg === 'pairing'}
            >
              <Text style={[styles.segmentText, activeSeg === 'pairing' && styles.segmentTextActive]}>Pairing</Text>
            </Pressable>

            <Pressable
              style={[styles.segment, activeSeg === 'wellness' && styles.segmentActive]}
              onPress={() => {
                if (activeSeg !== 'wellness') {
                  setActiveSeg('wellness');
                  router.push('/wellness');
                }
              }}
            >
              <Text style={[styles.segmentText, activeSeg === 'wellness' && styles.segmentTextActive]}>Wellness</Text>
            </Pressable>
          </View>
        </View>

        <KeyboardAvoidingView behavior={kavBehavior} style={{ flex: 1 }}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: FOOTER_H + insets.bottom + 16, flexGrow: 1 }}
            keyboardShouldPersistTaps="always"
          >
            {/* If we have results, render them inline; otherwise show the search card */}
            {result ? (
              <ResultView
                result={result}
                filter={filter}
                query={query}
                onBack={() => { setResult(null); ClearAll(); }}
              />
            ) : (
              <View style={[styles.bigCard, { minHeight: cardMinHeight }]}>
                {/* Title */}
                <Text style={styles.headerTitle}>Help me find</Text>
                <Text style={{ fontSize: 15, color: '#6B7280', marginTop: 6, fontFamily: 'PretendardJP-Light' }}>
                  Select a filter to guide your search.
                </Text>

                {/* Filter chips */}
                <View style={[styles.chipsRow, { marginTop: 10 }]}>
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

                {/* Arrow row — opens input */}
                <Pressable
                  style={({ pressed }) => [styles.arrowRow, { marginTop: 20 }, pressed && { opacity: 0.9 }]}
                  onPress={toggleInputOpen}
                  {...webOnly({ role: 'button' })}
                >
                  <Text style={styles.arrowTitle}>Choose an Ingredient</Text>
                  <Ionicons name="arrow-forward" size={22} color="#111827" />
                </Pressable>

                {/* Underline search field + recents */}
                {inputOpen && (
                  <View>
                    <View style={[styles.searchUnderline, inputFocused && styles.searchUnderlineFocused]}>
                      <TextInput
                        ref={inputRef}
                        autoFocus
                        placeholder="Search: Eggs, Milk..."
                        placeholderTextColor="#9CA3AF"
                        value={query}
                        onChangeText={setQuery}
                        style={styles.inputUnderline}
                        returnKeyType="search"
                        onSubmitEditing={onSearch}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        inputMode={Platform.select({ web: 'text', default: undefined })}
                        enterKeyHint={Platform.select({ web: 'search', default: undefined })}
                      />
                      <Ionicons name="search" size={22} color="#111827" style={styles.searchIconRight} />
                    </View>

                    {/* Recents */}
                    <View style={[styles.rowBetween, { marginTop: 30 }]}>
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
                  </View>
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
            disabled={!canSearch}
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

/** ===== Helpers for results rendering (inline) ===== */

function getHeaderTone(res: CompatibilityResponse, filter: Filter | null) {
  if (filter === 'avoid' && (res.avoid?.length ?? 0) > 0) return 'bad';
  if ((res.beneficial?.length ?? 0) > 0) return 'good';
  if ((res.avoid?.length ?? 0) > 0) return 'bad';
  return 'neutral';
}

type Row = CompatibilityItem & { _kind: 'good' | 'bad' };

function rowsFromResult(res: CompatibilityResponse, filter: Filter | null): Row[] {
  const goods: Row[] = (res.beneficial ?? []).map(x => ({ ...x, _kind: 'good' as const }));
  const bads:  Row[] = (res.avoid ?? []).map(x => ({ ...x, _kind: 'bad'  as const }));

  // sort each bucket: severity desc, then name asc (stable & predictable)
  const bySeverity = (a: CompatibilityItem, b: CompatibilityItem) =>
    (b.severity ?? 0) - (a.severity ?? 0) || (a.food || '').localeCompare(b.food || '', undefined, { sensitivity: 'base' });

  goods.sort(bySeverity);
  bads.sort(bySeverity);

  // return according to filter
  if (filter === 'benefit') return goods;
  if (filter === 'avoid')   return bads;

  // 'all' (or null): Good group first, then Bad group
  return [...goods, ...bads];
}

function ResultView({
  result,
  filter,
  query,
  onBack,
}: {
  result: CompatibilityResponse;
  filter: Filter | null;
  query: string;
  onBack: () => void;
}) {
  const rows = rowsFromResult(result, filter);

  const tone = getHeaderTone(result, filter);
  const showBadge = tone !== 'neutral';
  const isGood = tone === 'good';

  return (
    <View style={[styles.bigCard, { paddingBottom: 16, minHeight: undefined }]}>
      {/* Back chip */}
      <Pressable
        onPress={onBack}
        style={{ alignSelf: 'flex-start', padding: 8, borderRadius: 999, backgroundColor: '#F3F4F6', marginBottom: 8 }}
      >
        <Ionicons name="chevron-back" size={20} color="#111827" />
      </Pressable>

      {(filter === 'all' || filter == null) ? (
  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
    {!!(result.beneficial?.length) && (
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 12,
          borderWidth: 1,
          backgroundColor: '#ECFDF5',
          borderColor: '#16A34A',
        }}
      >
        <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
        <Text style={{ color: '#16A34A', textAlign: 'center' }}>
          Recommended
        </Text>
      </View>
    )}
    {!!(result.avoid?.length) && (
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 12,
          borderWidth: 1,
          backgroundColor: '#FEF2F2',
          borderColor: '#DC2626',
        }}
      >
        <Ionicons name="close-circle" size={16} color="#DC2626" />
        <Text style={{ color: '#DC2626',  textAlign: 'center' }}>
          Avoid
        </Text>
      </View>
    )}
  </View>
) : (
  showBadge && (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: isGood ? '#ECFDF5' : '#FEF2F2',
        borderColor: isGood ? '#16A34A' : '#DC2626',
        marginBottom: 10,
      }}
    >
      <Ionicons
        name={isGood ? 'checkmark-circle' : 'close-circle'}
        size={16}
        color={isGood ? '#16A34A' : '#DC2626'}
      />
      <Text style={{ color: isGood ? '#16A34A' : '#DC2626', textAlign: 'center' }}>
        {isGood ? 'Recommended' : 'Avoid'}
      </Text>
    </View>
  )
)}




      

      {/* Title */}
      <Text style={[styles.headerTitle, { textAlign: 'center' }]}>
        pairings with{'\n'}
        <Text style={{ textDecorationLine: 'underline' }}>{result.ingredient || query}</Text>
      </Text>

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
        const icon   = r._kind === 'good' ? 'checkmark-circle' : 'close-circle';
        return (
          <View key={`${r.food}-${idx}`} style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' }}>
            <Pressable
              onPress={() => setOpen(isOpen ? null : idx)}
              style={{ paddingHorizontal: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={icon as any} size={18} color={color} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>{r.food}</Text>
              </View>
              <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
            </Pressable>

            {isOpen && (
              <View style={{ paddingHorizontal: 12, paddingBottom: 14 }}>
                <Text style={{ fontSize: 14, color: '#374151' }}>{r.reason}</Text>
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

/** Neutral-by-default chip; colors only when selected */
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

function Badge({ color, bg, label }: { color: string; bg: string; label: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.sectionHeading}>{title}</Text>
      <View style={{ marginTop: 6 }}>{children}</View>
    </View>
  );
}

function FoodRow({ item, tone }: { item: CompatibilityItem; tone: 'good' | 'bad' }) {
  const color = tone === 'good' ? '#16A34A' : '#DC2626';
  const icon = tone === 'good' ? 'checkmark-circle' : 'close-circle';
  const badgeBg = tone === 'good' ? '#ECFDF5' : '#FEF2F2';

  return (
    <View style={styles.foodRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name={icon as any} size={18} color={color} />
        <Text style={styles.foodName}>{item.food}</Text>
      </View>

      {/* Reason */}
      <Text style={styles.foodReason}>{item.reason}</Text>

      {/* Severity */}
      <View style={[styles.badge, { backgroundColor: badgeBg, borderColor: color, alignSelf: 'flex-start', marginTop: 6 }]}>
        <Text style={[styles.badgeText, { color }]}>{`Severity: ${item.severity}`}</Text>
      </View>

      {/* Sources */}
      {Array.isArray(item.sources) && item.sources.length > 0 && (
        <View style={{ marginTop: 6, gap: 4 }}>
          {item.sources.map((s, i) => (
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
  );
}

function getChipColors(variant: 'all' | 'avoid' | 'benefit', active: boolean) {
  // Neutral (inactive)
  const NEUTRAL = { bg: '#FFFFFF', border: '#E5E7EB', text: '#111827' };
  if (!active) return NEUTRAL;

  // Active colors
  switch (variant) {
    case 'benefit': // Recommended → green
      return { bg: '#F2FFF6', border: '#009632', text: '#009632' };
    case 'avoid':  // Avoid → orange/red
      return { bg: '#FFFAF7', border: '#F55A00', text: '#FF5E00' };
    case 'all':    // All → blue
      return { bg: '#F7FBFF', border: '#0054D1', text: '#0054D1' };
  }
}

/* Styles */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F5F7' },
  container: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 20 },

  // tabs
  segmented: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#E9EBEF',
    padding: 4,
    borderRadius: 16,
    gap: 6,
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  segmentTextActive: {
    color: '#111827',
  },

  // one big card
  bigCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 60,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    ...webOnly({ WebkitTapHighlightColor: 'transparent' }),
  },

  // header
  headerTitle: { fontSize: 30, color: '#0F172A', fontFamily: 'PretendardJP-Light' },

  // chips
  chipsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
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
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 44,
    paddingBottom: 20,
  },
  logo: {
    width: 60,
    height: 68,
    alignSelf: 'center',
  },

  // arrow row
  arrowRow: {
    marginTop: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...webOnly({
      outlineStyle: 'none',
      WebkitTapHighlightColor: 'transparent',
      userSelect: 'none',
      cursor: 'pointer',
    }),
  },
  arrowTitle: { fontSize: 30, color: '#0F172A', fontFamily: 'PretendardJP-Light' },

  /** Underline search field */
  searchUnderline: {
    position: 'relative',
    paddingTop: 2,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#9CA3AF',
    backgroundColor: 'transparent',
    marginTop: 8,
  },
  searchUnderlineFocused: { borderBottomColor: '#111827' },
  inputUnderline: {
    fontSize: 18,
    lineHeight: 34,
    color: '#111827',
    paddingRight: 36,
    paddingLeft: 0,
    paddingVertical: 0,
    ...Platform.select({ web: { outlineStyle: 'none', caretColor: '#111827' } }),
  },
  searchIconRight: {
    position: 'absolute',
    right: 0,
    top: 6,
    ...Platform.select({ web: { userSelect: 'none', pointerEvents: 'none' } }),
  },

  // recents (pill rows)
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 16, fontWeight: '500', color: '#0F172A' },
  link: { fontWeight: '700', color: '#2563EB' },
  emptyText: { color: '#6B7280', fontSize: 14, paddingVertical: 8 },

  recentPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 8,
    ...webOnly({
      outlineStyle: 'none',
      WebkitTapHighlightColor: 'transparent',
      userSelect: 'none',
      cursor: 'pointer',
    }),
  },
  recentPillText: { fontSize: 15, color: '#111827', fontWeight: '600' },

  // footer
  footer: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: '#F4F5F7',
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  clearBtn: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#3B82F6',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF',
    ...webOnly({ outlineStyle: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none', cursor: 'pointer' }),
  },
  clearText: { fontSize: 16, fontWeight: '700', color: '#2563EB' },

  // conditional Search styles
  searchBtn: {
    flex: 1.2,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...webOnly({ outlineStyle: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none', cursor: 'pointer' }),
  },
  searchBtnOn: { backgroundColor: '#2563EB' },
  searchBtnOff: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  searchText: { fontSize: 16, fontWeight: '700' },
  searchTextOn: { color: '#FFFFFF' },
  searchTextOff: { color: '#9CA3AF' },

  // Modal badge/shared
  badge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1 },
  badgeText: { fontSize: 13, fontWeight: '700' },

  sectionHeading: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 6 },
  foodRow: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  foodName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  foodReason: { fontSize: 14, color: '#374151', marginTop: 6 },
  sourceLine: { fontSize: 13, color: '#2563EB' },
});
