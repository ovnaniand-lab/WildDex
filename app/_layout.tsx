
import { Colors } from '@/constants/theme';
import { WildDexProvider } from '@/hooks/useWildDexState';
import {
  Lora_400Regular,
  Lora_700Bold,
} from '@expo-google-fonts/lora';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Lora_400Regular,
    Lora_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <WildDexProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.warmCream },
        }}
      >
        <Stack.Screen
          name="discovery/[id]"
          options={{
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: Colors.warmCream },
          }}
        />
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
