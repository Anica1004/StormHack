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
  Modal,
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
const MAX_RECENTS = 8;

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
  const [modalVisible, setModalVisible] = useState(false);
  const [result, setResult] = useState<CompatibilityResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // focus ref
  const inputRef = useRef<TextInput>(null);

  // layout helpers
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const FOOTER_H = 60;
  const TABS_H = 44;

  // keep white card height stable
  const cardMinHeight = Math.max(
    0,
    height - insets.top - insets.bottom - FOOTER_H - TABS_H - 16
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
      setResult(data);
      setModalVisible(true);
    } catch (err: any) {
      setErrorMsg(err?.name === 'AbortError' ? 'Request timed out' : (err?.message || 'Something went wrong'));
      setModalVisible(true);
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





        {/* Tabs */}
        {/* Segmented toggle: Pairing / Wellness */}
<View style={styles.segmented}>
  <Pressable
    style={[styles.segment, styles.segmentActive]}
    // you're already on this screen
    disabled
  >
    <Text style={[styles.segmentText, styles.segmentTextActive]}>Pairing</Text>
  </Pressable>

  <Pressable
    style={styles.segment}
    onPress={() => router.push('/wellness')}
  >
    <Text style={styles.segmentText}>Wellness</Text>
  </Pressable>
</View>


        <KeyboardAvoidingView behavior={kavBehavior} style={{ flex: 1 }}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: FOOTER_H + insets.bottom + 12, flexGrow: 1 }}
            keyboardShouldPersistTaps="always"
          >
            {/* ONE big white card fixed to screen height */}
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
                style={({ pressed }) => [styles.arrowRow, pressed && { opacity: 0.9 }]}
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
            </View>
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

        {/* Result/Error Modal — NOW SHOWS EVERYTHING */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              {errorMsg ? (
                <>
                  <Text style={styles.modalTitle}>Hmm…</Text>
                  <Text style={styles.modalText}>{errorMsg}</Text>
                </>
              ) : result ? (
                <>
                  <Text style={styles.modalTitle}>{result.ingredient || query}</Text>
                  <Text style={styles.modalSub}>
                    {result.category ? `Category: ${result.category}` : 'Category: —'}
                  </Text>

                  {/* Counts */}
                  <View style={styles.modalRow}>
                    <Badge color="#16A34A" bg="#ECFDF5" label={`Recommended: ${result.beneficial?.length ?? 0}`} />
                    <Badge color="#DC2626" bg="#FEF2F2" label={`Avoid: ${result.avoid?.length ?? 0}`} />
                  </View>

                  {/* Scrollable detail list */}
                  <View style={{ maxHeight: 380, marginTop: 12 }}>
                    <ScrollView
                      style={{ paddingRight: 2 }}
                      contentContainerStyle={{ paddingBottom: 8 }}
                      showsVerticalScrollIndicator
                    >
                      {/* Recommended section (if present) */}
                      {Array.isArray(result.beneficial) && result.beneficial.length > 0 && (
                        <Section title="Recommended">
                          {result.beneficial.map((item, idx) => (
                            <FoodRow key={`b-${idx}`} item={item} tone="good" />
                          ))}
                        </Section>
                      )}

                      {/* Avoid section (if present) */}
                      {Array.isArray(result.avoid) && result.avoid.length > 0 && (
                        <Section title="Avoid">
                          {result.avoid.map((item, idx) => (
                            <FoodRow key={`a-${idx}`} item={item} tone="bad" />
                          ))}
                        </Section>
                      )}

                      {/* No items fallback */}
                      {!result.avoid?.length && !result.beneficial?.length && (
                        <Text style={styles.modalText}>No detailed items returned.</Text>
                      )}
                    </ScrollView>
                  </View>
                </>
              ) : (
                <Text style={styles.modalText}>No data.</Text>
              )}

              <View style={{ height: 10 }} />
              <Pressable style={styles.modalBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
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
  tabPill: { backgroundColor: '#E9EBEF', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
  tabPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tabText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#111827' },

  // one big card
  bigCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 60,
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

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  modalText: { fontSize: 15, color: '#111827' },
  modalRow: { flexDirection: 'row', gap: 8, marginTop: 12 },

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

  modalBtn: {
    marginTop: 14,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
