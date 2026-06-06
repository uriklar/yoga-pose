import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="index" options={{ title: 'Yoga Pose Coach' }} />
      <Stack.Screen name="analyze" options={{ title: 'Analyze' }} />
      <Stack.Screen name="result" options={{ title: 'Result' }} />
      <Stack.Screen name="record" options={{ title: 'Record' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
