// app/(tabs)/pair.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ← add
const STORAGE_KEY = 'eatwise:recent_pair_searches';
const MAX_RECENTS = 8;

export const options = { headerShown: false };

export default function PairScreen() {
  const [filter, setFilter] = useState<'all' | 'avoid' | 'benefit'>('all');
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<string[]>([]); 

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
    // de-dupe (case-insensitive), most-recent-first, cap length
    const next = [t, ...recents.filter(r => r.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENTS);
    await persistRecents(next);
  };

  const clearRecents = async () => {
    await persistRecents([]);
  };

  const onSearch = async () => {
    const q = query.trim();
    if (!q) return;
    await addRecent(q);
    console.log('Searching for', query, 'filter', filter);
  };

  const ClearAll = () => {
    setQuery('');
    setFilter('all');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top','left','right','bottom']}>
      <View style={styles.container}>
        <View style={styles.topTabs}>
          <Pressable style={[styles.tabPill, styles.tabPillActive]}>
            <Text style={[styles.tabText, styles.tabTextActive]}>Pairing</Text>
          </Pressable>
          <Pressable
            style={styles.tabPill}
            onPress={() => router.push('/wellness')}
          >
            <Text style={styles.tabText}>Wellness</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 120 }}>
         
         
          <View style={styles.card}>
            
            <Text style={styles.cardTitle}>Find what pairs with</Text>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} style={styles.searchIcon} />
              <TextInput
                placeholder="Enter your food"
                value={query}
                onChangeText={setQuery}
                style={styles.input}
                returnKeyType="search"
                onSubmitEditing={onSearch}
              />
              <Pressable>
                <Ionicons name="mic-outline" size={20} />
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Filter</Text>
            <View style={styles.chipsRow}>
              <Chip label="All" active={filter==='all'} onPress={() => setFilter('all')} />
              <Chip label="⚠️ Avoid" active={filter==='avoid'} onPress={() => setFilter('avoid')} />
              <Chip label="🌿 Recommended" active={filter==='benefit'} onPress={() => setFilter('benefit')} />

            </View>
          </View>

          {/* Filter */}
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionLabel}>Recent</Text>
              {recents.length > 0 && (
                <Pressable onPress={clearRecents}>
                  <Text style={{ fontWeight: '600', color: '#2563EB' }}>Clear</Text>
                </Pressable>
              )}
            </View>

            {(recents.length ? recents : ["Try: Milk"]).map((item, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [styles.recentRow, pressed && styles.rowPressed]}
                onPress={() => { setQuery(item); /* optionally auto-search */ onSearch(); }}
              >
                <Text style={styles.recentText}>{item}</Text>
                <Ionicons name="chevron-forward" size={18} />
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable style={styles.clearBtn} onPress={ClearAll}>
            <Text style={styles.clearText}>Clear All</Text>
          </Pressable>
          <Pressable style={styles.searchBtn} onPress={onSearch}>
            <Ionicons name="search" size={18} color="#fff" />
            <Text style={styles.searchText}>Search</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* Chip component */
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && { opacity: 0.9 },
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F5F7' },
  container: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  topTabs: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8, alignSelf: "center", },
  tabPill: { backgroundColor: '#E9EBEF', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
  tabPillActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  tabText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#111827' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginTop: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, height: 44, backgroundColor: '#FAFAFA' },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16 },
  sectionLabel: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  chipsRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#EEF1F4' },
  chipActive: { backgroundColor: '#1D4ED8' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#FFFFFF' },
  recentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F1F3F5' },
  rowPressed: { opacity: 0.85 },
  recentText: { fontSize: 15, color: '#111827' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: '#F4F5F7', flexDirection: 'row', gap: 12 },
  clearBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  clearText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  searchBtn: { flex: 1.2, height: 48, borderRadius: 12, backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  searchText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
