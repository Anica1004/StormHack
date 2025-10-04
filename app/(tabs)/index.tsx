// app/(tabs)/index.tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { router } from 'expo-router';

export const options = { headerShown: false };

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>EatWise</Text>

        <View style={styles.cardRow}>
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push('/pair')}>
            <Text style={styles.cardText}>Food{'\n'}Pairing</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push('/wellness')}>
            <Text style={styles.cardText}>Wellness</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    paddingBottom: 20, 
  },
  cardRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  card: {
    width: 150,
    height: 236,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    padding: 16, 
    gap: 8, 
    flexShrink: 0,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  cardText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
