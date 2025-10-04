// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,  // 👈 hides the top bar (the one showing "index")
        tabBarStyle: { display: 'none' },  // 👈 optional: hides the bottom tab bar
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'EatWise' }} />
      <Tabs.Screen name="pair" options={{ title: 'Food Pairing' }} />
      <Tabs.Screen name="wellness" options={{ title: 'Welless' }} />
    </Tabs>
  );
}
