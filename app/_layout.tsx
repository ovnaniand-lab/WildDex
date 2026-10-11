import { Colors } from '@/constants/theme';
import { WildDexProvider } from '@/hooks/useWildDexState';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <WildDexProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.warmCream },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
  name="species/live"
  options={{
    animation: 'slide_from_right',
    contentStyle: { backgroundColor: Colors.white },
  }}
/>
        <Stack.Screen
          name="(onboarding)"
          options={{ presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="location"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="species/[id]" />
        <Stack.Screen
          name="settings"
          options={{ presentation: 'modal' }}
        />
      </Stack>
    </WildDexProvider>
  );
}