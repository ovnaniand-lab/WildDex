/**
 * App Settings — Phase 1: region shortcut, onboarding replay and local-data
 * reset (AsyncStorage). Account/profile services arrive in Phase 2.
 */
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import { CardShadow, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { repository } from '@/data/repository';
import { useWildDex } from '@/hooks/useWildDexState';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { selectedRegionId, discoveries, setRegion } = useWildDex();
  const [resetting, setResetting] = useState(false);
  const region = repository.getRegionById(selectedRegionId);

  const resetLocalData = async () => {
    setResetting(true);
    try {
      // SDK 57 pins async-storage v2, which uses the multiRemove API
      await AsyncStorage.multiRemove([
        'wilddex.selectedRegionId',
        'wilddex.discoveries',
        'wilddex.onboarded',
      ]);
    } finally {
      setResetting(false);
      // Restart flow by going back to Home; on next cold start onboarding shows again.
      router.replace('/(tabs)/home');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title="App Settings" subtitle="Phase 1 settings are stored on this device." showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/location')}
          style={({ pressed }) => [styles.row, CardShadow, pressed && styles.pressed]}
        >
          <Ionicons name="globe-outline" size={24} color={Colors.forestGreen} />
          <View style={styles.rowTexts}>
            <Text style={styles.rowTitle}>Selected region</Text>
            <Text style={styles.rowBody}>{region ? `${region.emoji} ${region.name}, ${region.country}` : 'None'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </Pressable>

        <View style={[styles.infoCard, CardShadow]}>
          <Text style={styles.infoTitle}>Your data</Text>
          <Text style={styles.infoBody}>
            {discoveries.length} discovery record(s) saved locally. Cloud sync, accounts and privacy
            controls will be provided by the WildDex backend in Phase 2.
          </Text>
        </View>

        <PrimaryButton
          label="Replay Onboarding & Reset Local Data"
          variant="secondary"
          loading={resetting}
          onPress={resetLocalData}
          accessibilityLabel="Reset all locally stored WildDex data"
        />
        <Text style={styles.warnNote}>
          ⚠️ This clears your saved region and discoveries on this device only.
        </Text>

        <Text style={styles.version}>WildDex v0.1.0 · Expo SDK 57 · Phase 1 preview build</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmCream },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  rowTexts: { flex: 1 },
  rowTitle: { fontWeight: '800', fontSize: 15, color: Colors.textPrimary },
  rowBody: { fontSize: 13, color: Colors.textSecondary },
  pressed: { opacity: 0.9 },
  infoCard: { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, gap: 4 },
  infoTitle: { ...Typography.subtitle, fontSize: 15 },
  infoBody: { fontSize: 13, lineHeight: 19, color: Colors.textSecondary },
  warnNote: { fontSize: 12, color: Colors.danger, textAlign: 'center' },
  version: { textAlign: 'center', fontSize: 11, color: Colors.textSecondary, marginTop: Spacing.sm },
});
