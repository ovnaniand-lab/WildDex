/**
 * Profile Screen — avatar placeholder, stats, achievements and settings
 * navigation. User account data is Phase-2; achievements use preview data.
 */
import LoadingState from '@/components/LoadingState';
import ProgressBar from '@/components/ProgressBar';
import { CardShadow, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { repository } from '@/data/repository';
import type { Achievement } from '@/data/types';
import { useRepositoryData } from '@/hooks/useRepositories';
import { useWildDex } from '@/hooks/useWildDexState';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { discoveries, selectedRegionId } = useWildDex();
  const region = repository.getRegionById(selectedRegionId);
  const achievementsState = useRepositoryData<Achievement[]>(() => repository.getAchievements(), []);

  const unlockedCount = (achievementsState.data ?? []).filter((a) => a.unlocked).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header card with avatar placeholder + display name */}
        <View style={[styles.headerCard, CardShadow]}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={Colors.goldenAmber} />
          </View>
          <View style={styles.identity}>
            <Text style={styles.displayName}>Nature Explorer</Text>
            <Text style={styles.memberNote}>
              🌍 {region?.name ?? 'No region'} · Accounts &amp; avatars arrive in Phase 2
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, CardShadow]}>
            <Text style={styles.statValue}>{discoveries.length}</Text>
            <Text style={styles.statLabel}>Total discoveries</Text>
          </View>
          <View style={[styles.statCard, CardShadow]}>
            <Text style={styles.statValue}>{new Set(discoveries).size}</Text>
            <Text style={styles.statLabel}>Species discovered</Text>
          </View>
          <View style={[styles.statCard, CardShadow]}>
            <Text style={styles.statValue}>{unlockedCount}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>

        {/* Achievements */}
        <Text style={styles.sectionTitle}>Achievements</Text>
        {achievementsState.loading ? (
          <LoadingState message="Checking your badges…" />
        ) : (
          <View style={styles.achievementGrid}>
            {(achievementsState.data ?? []).map((a) => (
              <View
                key={a.id}
                style={[styles.achievementCard, CardShadow, !a.unlocked && styles.locked]}
                accessibilityLabel={`${a.title}, ${a.unlocked ? 'unlocked' : 'locked'}`}
              >
                <Text style={styles.achievementEmoji}>{a.unlocked ? a.emoji : '🔒'}</Text>
                <Text style={styles.achievementTitle} numberOfLines={1}>
                  {a.title}
                </Text>
                <Text style={styles.achievementDesc} numberOfLines={2}>
                  {a.description}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Next milestone */}
        <View style={[styles.milestoneCard, CardShadow]}>
          <Text style={styles.milestoneTitle}>Next badge: Keen Eye 🔍</Text>
          <ProgressBar progress={Math.min(discoveries.length / 10, 1)} accessibleLabel={`${discoveries.length} of 10 species toward Keen Eye`} />
          <Text style={styles.milestoneNote}>Identify {Math.max(10 - discoveries.length, 0)} more species to earn it.</Text>
        </View>

        {/* Settings navigation */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingsCard}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/location')}
            style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
          >
            <Ionicons name="globe-outline" size={22} color={Colors.forestGreen} />
            <Text style={styles.settingsLabel}>Region</Text>
            <Text style={styles.settingsValue}>{region?.name ?? 'Choose'}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </Pressable>
          <View style={styles.settingsDivider} />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
          >
            <Ionicons name="settings-outline" size={22} color={Colors.forestGreen} />
            <Text style={styles.settingsLabel}>App settings</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </Pressable>
        </View>

        <Text style={styles.previewNote}>WildDex v0.1.0 · Phase 1 preview build</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmCream },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.deepForest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: { flex: 1, gap: 3 },
  displayName: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  memberNote: { fontSize: 12, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.forestGreen },
  statLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },
  sectionTitle: { ...Typography.subtitle },
  achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  achievementCard: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 150,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
  },
  locked: { opacity: 0.6 },
  achievementEmoji: { fontSize: 26 },
  achievementTitle: { fontWeight: '800', fontSize: 14, color: Colors.textPrimary },
  achievementDesc: { fontSize: 12, color: Colors.textSecondary },
  milestoneCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm },
  milestoneTitle: { fontWeight: '800', fontSize: 15, color: Colors.textPrimary },
  milestoneNote: { fontSize: 12, color: Colors.textSecondary },
  settingsCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: 'hidden', ...CardShadow },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  settingsLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  settingsValue: { fontSize: 13, color: Colors.textSecondary, maxWidth: 130 },
  settingsDivider: { height: 1, backgroundColor: Colors.border, marginLeft: 50 },
  pressed: { backgroundColor: Colors.leafTint },
  previewNote: { textAlign: 'center', fontSize: 11, color: Colors.textSecondary, marginTop: Spacing.sm },
});
