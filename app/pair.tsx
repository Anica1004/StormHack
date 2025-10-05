// app/(tabs)/pair.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'eatwise:recent_pair_searches';
const MAX_RECENTS = 8;

export const options = { headerShown: false };

export default function PairScreen() {
  // sequential state
  const [filter, setFilter] = useState<'all' | 'avoid' | 'benefit' | null>(null);
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const [inputFocused, setInputFocused] = useState(false);

  const showInput = !!filter;
  const showRecentsAndFooter = query.trim().length > 0;

  // animations
  const fadeInput = useRef(new Animated.Value(0)).current;
  const slideInput = useRef(new Animated.Value(10)).current;
  const fadeRecents = useRef(new Animated.Value(0)).current;
  const slideRecents = useRef(new Animated.Value(10)).current;
  const fadeFooter = useRef(new Animated.Value(0)).current;
  const slideFooter = useRef(new Animated.Value(10)).current;

  const animateIn = (fade: Animated.Value, slide: Animated.Value) => {
    fade.setValue(0);
    slide.setValue(10);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setRecents(JSON.parse(raw));
      } catch (e) {
        console.warn('Failed to load recents', e);
      }
    })();
  }, []);

  useEffect(() => {
    if (showInput) animateIn(fadeInput, slideInput);
  }, [showInput]);

  useEffect(() => {
    if (showRecentsAndFooter) {
      animateIn(fadeRecents, slideRecents);
      animateIn(fadeFooter, slideFooter);
    }
  }, [showRecentsAndFooter]);

  const persistRecents = async (next: string[]) => {
    setRecents(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Failed to save recents', e);
    }
  };

  const addRecent = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    const next = [t, ...recents.filter(r => r.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENTS);
    await persistRecents(next);
  };

  const clearRecents = async () => {
    await persistRecents([]);
  };

  const apiFilter = useMemo(() => (filter === 'benefit' ? 'beneficial' : filter || 'all'), [filter]);

  const onSearch = async () => {
    const q = query.trim();
    if (!q) return;
    await addRecent(q);
    // TODO: connect to backend
    // const data = await api.getIngredientCompatibility(q, apiFilter);
    console.log('Searching for', q, 'filter', apiFilter);
  };

  const ResetAll = () => {
    setQuery('');
    setFilter(null);
    setInputFocused(false);
  };

  const canSearch = showRecentsAndFooter;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        {/* Top pills */}
        <View style={styles.topTabs}>
          <Pressable style={[styles.tabPill, styles.tabPillActive]}>
            <Text style={[styles.tabText, styles.tabTextActive]}>Pairing</Text>
          </Pressable>
          <Pressable style={styles.tabPill} onPress={() => router.push('/wellness')}>
            <Text style={styles.tabText}>Wellness</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 168 }}>
          {/* STEP 1: Filter */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Help me find</Text>
            <Text style={styles.helperText}>Pick a filter to focus your results.</Text>
            <View style={[styles.chipsRow, { marginTop: 12 }]}>
              <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label="⚠️ Avoid" active={filter === 'avoid'} onPress={() => setFilter('avoid')} />
              <Chip label="🌿 Recommended" active={filter === 'benefit'} onPress={() => setFilter('benefit')} />
            </View>
          </View>

          {/* STEP 2: Ingredient input */}
          {showInput && (
            <Animated.View style={[styles.card, { opacity: fadeInput, transform: [{ translateY: slideInput }] }]}>
              <Text style={styles.cardTitle}>Find what pairs with</Text>
              <View
                style={[
                  styles.searchBox,
                  inputFocused && styles.searchBoxFocused,
                  Platform.OS === 'ios' && inputFocused && styles.searchBoxGlowIOS,
                ]}
              >
                <Ionicons name="search" size={18} style={styles.searchIcon} />
                <TextInput
                  placeholder="Enter your food (e.g., milk)"
                  value={query}
                  onChangeText={setQuery}
                  style={styles.input}
                  returnKeyType="search"
                  onSubmitEditing={onSearch}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  autoFocus
                />
                <Pressable hitSlop={10}>
                  <Ionicons name="mic-outline" size={20} color="#6B7280" />
                </Pressable>
              </View>

              <View style={styles.rowBetween}>
                <Text style={styles.sectionLabel}>Recent Searches</Text>
                {recents.length > 0 && (
                  <Pressable onPress={clearRecents} hitSlop={8}>
                    <Text style={styles.link}>Clear</Text>
                  </Pressable>
                )}
              </View>

              {recents.length === 0 ? (
                <Text style={styles.emptyText}>No search history yet</Text>
              ) : (
                recents.map((item, i) => (
                  <Pressable
                    key={`${item}-${i}`}
                    style={({ pressed }) => [styles.recentRow, pressed && styles.rowPressed]}
                    onPress={() => setQuery(item)}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                  >
                    <Text style={styles.recentText}>{item}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#6B7280" />
                  </Pressable>
                ))
              )}
            </Animated.View>
          )}
        </ScrollView>

        {/* Footer */}
        {showRecentsAndFooter && (
          <Animated.View style={[styles.footer, { opacity: fadeFooter, transform: [{ translateY: slideFooter }] }]}>
            <Pressable style={styles.clearBtn} onPress={ResetAll} hitSlop={8}>
              <Text style={styles.clearText}>Reset</Text>
            </Pressable>
            <Pressable
              style={[styles.searchBtn, !canSearch && { opacity: 0.5 }]}
              onPress={onSearch}
              disabled={!canSearch}
              android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
            >
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={styles.searchText}>Search</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

/* Bits */
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
      hitSlop={6}
      android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function LabelPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

/* Styles */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7F9' },
  container: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 16 },

  /* top tabs */
  topTabs: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    alignSelf: 'center',
  },
  tabPill: {
    backgroundColor: '#E9EBEF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  tabPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    ...Platform.select({ android: { elevation: 3 } }),
  },
  tabText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#111827' },

  /* cards */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    ...Platform.select({ android: { elevation: 3 } }),
  },
  cardTitle: { fontSize: 19, fontWeight: '800', marginBottom: 6, color: '#0F172A' },
  helperText: { fontSize: 13.5, color: '#6B7280' },

  /* search */
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
  },
  searchBoxFocused: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    ...Platform.select({ android: { elevation: 1 } }),
  },
  searchBoxGlowIOS: {
    shadowColor: '#2563EB',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  searchIcon: { marginRight: 8, color: '#6B7280' },
  input: { flex: 1, fontSize: 16, color: '#111827' },

  /* chips */
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#EFF2F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  chipText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  chipTextActive: { color: '#FFFFFF' },

  /* recents */
  sectionLabel: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 16, marginBottom: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  rowPressed: { opacity: 0.9 },
  recentText: { fontSize: 15, color: '#111827', fontWeight: '600' },
  emptyText: { color: '#6B7280', fontSize: 14.5, paddingVertical: 10 },
  link: { fontWeight: '700', color: '#2563EB' },

  /* inline pills (unused now but kept) */
  pill: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10, marginTop: 8 },
  pillLabel: { fontSize: 11, color: '#6B7280' },
  pillValue: { fontSize: 13, fontWeight: '800', color: '#111827' },

  /* footer */
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#F6F7F9',
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    ...Platform.select({ android: { elevation: 12 } }),
  },
  clearBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  clearText: { fontSize: 16, fontWeight: '800', color: '#374151' },
  searchBtn: {
    flex: 1.2,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({ ios: { shadowColor: '#2563EB', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } } }),
  },
  searchText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});
