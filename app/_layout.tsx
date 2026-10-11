import { Colors } from '@/constants/theme';
import { WildDexProvider, useWildDex } from '@/hooks/useWildDexState';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import LoadingState from '@/components/LoadingState';

function RootNavigator() {
  const { hydrated, onboarded } = useWildDex();
  if (!hydrated) return <LoadingState message="Preparing your field guideâ€¦" />;
  // Phase-1 onboarding gate: first launch shows the welcome flow.
  if (!onboarded) return <Redirect href="/(onboarding)" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.warmCream },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(onboarding)" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="location" options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="species/[id]"
        options={{
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: Colors.white },
        }}
      />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <WildDexProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </WildDexProvider>
  );
}

