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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'eatwise:recent_pair_searches';
const MAX_RECENTS = 8;

export const options = { headerShown: false };

type Filter = 'all' | 'avoid' | 'benefit';

// helper: apply styles only on web
const webOnly = (s: any) => (Platform.OS === 'web' ? s : null);

export default function PairScreen() {
  const [filter, setFilter] = useState<Filter | null>(null);
  const [inputOpen, setInputOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const [inputFocused, setInputFocused] = useState(false);

  // focus ref
  const inputRef = useRef<TextInput>(null);

  // full-height card sizing
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const FOOTER_H = 72;
  const TABS_H = 44;
  const verticalMargins = 12 + 16;
  const cardMinHeight = Math.max(
    0,
    height - insets.top - insets.bottom - FOOTER_H - TABS_H - verticalMargins
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

  const onSearch = async () => {
    const q = query.trim();
    if (!q) return;
    const effectiveFilter: Filter = filter ?? 'all';
    await addRecent(q);
    console.log('Searching for', q, 'filter', effectiveFilter);
    // TODO: hook backend
    // const apiFilter = effectiveFilter === 'benefit' ? 'beneficial' : effectiveFilter;
    // const data = await api.getIngredientCompatibility(q, apiFilter);
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
    undefined; // web/no-op

  return (
    <SafeAreaView style={styles.safe} edges={['top','left','right','bottom']}>
      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.topTabs}>
          <Pressable style={[styles.tabPill, styles.tabPillActive]} {...webOnly({ role: 'button' })}>
            <Text style={[styles.tabText, styles.tabTextActive]}>Pairing</Text>
          </Pressable>
          <Pressable style={styles.tabPill} onPress={() => router.push('/wellness')} {...webOnly({ role: 'button' })}>
            <Text style={styles.tabText}>Wellness</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView behavior={kavBehavior} style={{ flex: 1 }}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: 220, flexGrow: 1 }}
            keyboardShouldPersistTaps="always"
          >
            {/* ONE big white card fixed to screen height */}
            <View style={[styles.bigCard, { minHeight: cardMinHeight }]}>
              {/* Title */}
              <Text style={styles.headerTitle}>Help me find</Text>
              {/* <Text style={styles.helperSub}>
                Pick a filter.
              </Text> */}

              {/* Filter chips (neutral → color when selected) */}
              <View style={[styles.chipsRow, { marginTop: 12 }]}>
                <FilterChip
                  emoji="🌱"
                  label="Good"
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

              {/* Spacing */}
              <View style={{ height: 12 }} />

              {/* Arrow row — opens input */}
              <Pressable
                style={({ pressed }) => [
                  styles.arrowRow,
                  pressed && { opacity: 0.9 },
                ]}
                onPress={toggleInputOpen}
                {...webOnly({ role: 'button' })}
              >
                <Text style={styles.arrowTitle}>foods to pair with</Text>
                <Ionicons
                  name="arrow-forward"
                  size={22}
                  color="#111827"
                  style={webOnly({ userSelect: 'none', outlineStyle: 'none' })}
                />
              </Pressable>

              {/* Collapsible input + recents */}
              {inputOpen && (
                <View>
                  <View
                    style={[
                      styles.searchBox,
                      inputFocused && styles.searchBoxFocused,
                      Platform.OS === 'ios' && inputFocused && styles.searchBoxGlowIOS,
                    ]}
                    pointerEvents="box-none"
                  >
                    <TextInput
                      ref={inputRef}
                      autoFocus
                      placeholder="Enter your food (e.g., milk)"
                      value={query}
                      onChangeText={setQuery}
                      style={[styles.input, { minHeight: 44, paddingVertical: 10 }]}
                      returnKeyType="search"
                      onSubmitEditing={onSearch}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      inputMode={Platform.select({ web: 'text', default: undefined })}
                      enterKeyHint={Platform.select({ web: 'search', default: undefined })}
                    />
                  </View>

                  {/* Recent Searches header */}
                  <View style={[styles.rowBetween, { marginTop: 16 }]}>
                    <Text style={styles.sectionLabel}>Recent Searches</Text>
                    {recents.length > 0 && (
                      <Pressable onPress={clearRecents} {...webOnly({ role: 'button' })}>
                        <Text style={[styles.link, webOnly({ userSelect: 'none', outlineStyle: 'none', cursor: 'pointer' })]}>Clear</Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Recent list (pill rows) */}
                  {recents.length === 0 ? (
                    <Text style={styles.emptyText}>No search history yet</Text>
                  ) : (
                    <View style={{ marginTop: 6 }}>
                      {recents.map((item, i) => (
                        <Pressable
                          key={`${item}-${i}`}
                          style={({ pressed }) => [
                            styles.recentPillRow,
                            pressed && { opacity: 0.92 },
                          ]}
                          onPress={() => {
                            setQuery(item);
                            onSearch();
                          }}
                          {...webOnly({ role: 'button' })}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons
                              name="time-outline"
                              size={16}
                              color="#6B7280"
                              style={webOnly({ userSelect: 'none', outlineStyle: 'none', marginRight: 8 })}
                            />
                            <Text style={styles.recentPillText}>{item}</Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#9CA3AF"
                            style={webOnly({ userSelect: 'none', outlineStyle: 'none' })}
                          />
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
        <View style={styles.footer}>
          <Pressable style={styles.clearBtn} onPress={ClearAll} {...webOnly({ role: 'button' })}>
            <Text style={styles.clearText}>Clear All</Text>
          </Pressable>

          {/* Enabled/Disabled colors based on canSearch */}
          <Pressable
            style={[styles.searchBtn, canSearch ? styles.searchBtnOn : styles.searchBtnOff]}
            onPress={onSearch}
            disabled={!canSearch}
            {...webOnly({ role: 'button' })}
          >
            <Ionicons
              name="search"
              size={18}
              color={canSearch ? '#FFFFFF' : '#9CA3AF'}
              style={webOnly({ userSelect: 'none', outlineStyle: 'none' })}
            />
            <Text
              style={[
                styles.searchText,
                canSearch ? styles.searchTextOn : styles.searchTextOff,
                webOnly({ userSelect: 'none', outlineStyle: 'none' }),
              ]}
            >
              Search
            </Text>
          </Pressable>
        </View>
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

function getChipColors(variant: 'all' | 'avoid' | 'benefit', active: boolean) {
  // Neutral (inactive)
  const NEUTRAL = { bg: '#FFFFFF', border: '#E5E7EB', text: '#111827' };
  if (!active) return NEUTRAL;

  // Active colors
  switch (variant) {
    case 'benefit': // Good → green
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
  scroll: { flex: 1, paddingHorizontal: 20, paddingVertical: 10, },

  // tabs
  topTabs: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    alignSelf: 'center',
    ...webOnly({ WebkitTapHighlightColor: 'transparent' }),
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

  // one big card (full-screen stable)
  bigCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 50, 
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    ...webOnly({ WebkitTapHighlightColor: 'transparent' }),
  },

  // header
  headerTitle: { fontSize: 28, color: '#0F172A', fontFamily: 'PretendardJP-Light' },
  helperSub: { marginTop: 6, fontSize: 13.5, color: '#6B7280' },

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

  // arrow row
  arrowRow: {
    marginTop: 12,
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
  arrowTitle: { fontSize: 28, color: '#0F172A', fontFamily: 'PretendardJP-Light' },

  // search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: '#FAFAFA',
    marginTop: 10,
    ...webOnly({
      outlineStyle: 'none',
      WebkitTapHighlightColor: 'transparent',
    }),
  },
  searchBoxFocused: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    ...Platform.select({ android: { elevation: 1 } }),
  },
  searchBoxGlowIOS: {
    shadowColor: '#2563EB',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  searchIcon: { marginRight: 8, color: '#6B7280' },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    ...webOnly({
      outlineStyle: 'none',
      caretColor: '#111827',
      WebkitTapHighlightColor: 'transparent',
    }),
  },

  // recents (pill rows)
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  link: { fontWeight: '700', color: '#2563EB' },
  emptyText: { color: '#6B7280', fontSize: 14, paddingVertical: 8 },

  recentPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
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
    paddingHorizontal: 16, paddingTop: 5, paddingBottom: 5,
    backgroundColor: '#F4F5F7',
    flexDirection: 'row', gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB',
  },
  clearBtn: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#3B82F6',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF',
    ...webOnly({
      outlineStyle: 'none',
      WebkitTapHighlightColor: 'transparent',
      userSelect: 'none',
      cursor: 'pointer',
    }),
  },
  clearText: { fontSize: 16, fontWeight: '700', color: '#2563EB' },

  // conditional Search styles (enabled/disabled)
  searchBtn: {
    flex: 1.2,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...webOnly({
      outlineStyle: 'none',
      WebkitTapHighlightColor: 'transparent',
      userSelect: 'none',
      cursor: 'pointer',
    }),
  },
  searchBtnOn: {
    backgroundColor: '#2563EB',
  },
  searchBtnOff: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchText: { fontSize: 16, fontWeight: '700' },
  searchTextOn: { color: '#FFFFFF' },
  searchTextOff: { color: '#9CA3AF' },
});