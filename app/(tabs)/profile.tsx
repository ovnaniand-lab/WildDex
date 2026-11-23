
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { countryByCode } from '@/src/api/countries';
import { SPECIES } from '@/data/previewData';
import { getSpeciesByUid } from '@/src/api/encyclopedia';
import { calculateAchievementProgress } from '@/utils/achievements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

import LoadingState from '@/components/LoadingState';
import ProgressBar from '@/components/ProgressBar';
import { CardShadow, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { repository } from '@/data/repository';
import type { Achievement } from '@/data/types';
import { useRepositoryData } from '@/hooks/useRepositories';
import { useWildDex } from '@/hooks/useWildDexState';

export default function ProfileScreen() {
  const router = useRouter();

  const {
  regionMode,
  selectedCountryCode,
  gpsPoint,
  discoveries,
  discoveryRecords,
  discoveryCategories,
  saveDiscoveryCategory,
  hydrated,
  selectedRegionId,
  profile,
  updateProfile,
  saveProfileAvatar,
} = useWildDex();

  const region = repository.getRegionById(selectedRegionId);
  const selectedCountry = countryByCode(selectedCountryCode);

const displayedRegion =
  regionMode === 'gps' && gpsPoint
    ? 'Nearby area'
    : selectedCountry?.name ?? region?.name ?? 'No region selected';

  const achievementsState = useRepositoryData<Achievement[]>(
    () => repository.getAchievements(),
    [],
  );

  const [editingName, setEditingName] = useState(false);
  const [nickname, setNickname] = useState(profile.nickname);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    setNickname(profile.nickname);
  }, [profile.nickname]);

  const achievementProgress = calculateAchievementProgress(
  achievementsState.data ?? [],
  discoveries,
  discoveryRecords,
  discoveryCategories,
);

const unlockedCount = achievementProgress.filter(
  (achievement) => achievement.unlocked,
).length;

const speciesCount = new Set([
  ...discoveries,
  ...discoveryRecords.map((record) => record.speciesId),
]).size;
const nextAchievement = achievementProgress.find(
  (achievement) => !achievement.unlocked,
);

const categoryRecoveryInFlight = useRef(new Set<string>());

useEffect(() => {
  if (!hydrated) return;

  const recordsWithCategories = new Set(
    discoveryRecords
      .filter((record) => record.categoryId)
      .map((record) => record.speciesId),
  );

  const missingCategories = [...new Set([
    ...discoveries,
    ...discoveryRecords.map((record) => record.speciesId),
  ])].filter(
    (id) =>
      !discoveryCategories[id] &&
      !recordsWithCategories.has(id) &&
      !categoryRecoveryInFlight.current.has(id),
  );

  for (const id of missingCategories) {
    const localSpecies = SPECIES.find((species) => species.id === id);

    if (localSpecies) {
      categoryRecoveryInFlight.current.add(id);

      void saveDiscoveryCategory(id, localSpecies.categoryId)
        .finally(() => categoryRecoveryInFlight.current.delete(id));

      continue;
    }

    if (!id.startsWith('inat:') && !id.startsWith('gbif:')) {
      continue;
    }

    categoryRecoveryInFlight.current.add(id);
  }

  const remoteIds = missingCategories.filter(
    (id) => id.startsWith('inat:') || id.startsWith('gbif:'),
  );

  let cancelled = false;

  const recoverRemoteCategories = async () => {
    const concurrency = 3;

    for (let index = 0; index < remoteIds.length; index += concurrency) {
      const batch = remoteIds.slice(index, index + concurrency);

      await Promise.all(
        batch.map(async (id) => {
          try {
            const species = await getSpeciesByUid(id);

            if (!cancelled && species) {
              await saveDiscoveryCategory(id, species.categoryId);
            }
          } catch {
            // Leave the category unknown; a later visit can retry.
          } finally {
            categoryRecoveryInFlight.current.delete(id);
          }
        }),
      );
    }
  };

  void recoverRemoteCategories();

  return () => {
    cancelled = true;
  };
}, [
  hydrated,
  discoveries,
  discoveryRecords,
  discoveryCategories,
  saveDiscoveryCategory,
]);

  const handleSaveNickname = async () => {
    const cleanedName = nickname.trim();

    if (!cleanedName) {
      Alert.alert('Nickname required', 'Please enter a nickname.');
      return;
    }

    if (cleanedName.length > 24) {
      Alert.alert('Name too long', 'Your nickname must be 24 characters or fewer.');
      return;
    }

    try {
      await updateProfile({ nickname: cleanedName });
      setEditingName(false);
    } catch {
      Alert.alert('Could not save', 'Your nickname could not be saved. Please try again.');
    }
  };

  const handleChooseAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      setSavingAvatar(true);
      await saveProfileAvatar(result.assets[0].uri);
    } catch {
      Alert.alert('Avatar error', 'The selected photo could not be saved.');
    } finally {
      setSavingAvatar(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>My Profile</Text>

        {/* Profile identity */}
        <View style={[styles.headerCard, CardShadow]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change profile picture"
            onPress={handleChooseAvatar}
            disabled={savingAvatar}
            style={styles.avatarButton}
          >
            {profile.avatarUri ? (
              <Image
                source={{ uri: profile.avatarUri }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons
                  name="person"
                  size={40}
                  color={Colors.goldenAmber}
                />
              </View>
            )}

            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={15} color={Colors.white} />
            </View>
          </Pressable>

          <View style={styles.identity}>
            {editingName ? (
              <>
                <TextInput
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="Your nickname"
                  placeholderTextColor={Colors.textSecondary}
                  maxLength={24}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveNickname}
                  style={styles.nicknameInput}
                />

                <View style={styles.editActions}>
                  <Pressable onPress={handleSaveNickname}>
                    <Text style={styles.saveText}>Save</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setNickname(profile.nickname);
                      setEditingName(false);
                    }}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={styles.nameRow}>
                  <Text style={styles.displayName} numberOfLines={1}>
                    {profile.nickname}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Edit nickname"
                    onPress={() => setEditingName(true)}
                    hitSlop={10}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={18}
                      color={Colors.forestGreen}
                    />
                  </Pressable>
                </View>

                <Text style={styles.memberNote}>
                  Nature Explorer
                </Text>
                <Text style={styles.regionNote}>
                  <Ionicons name="location-outline" size={13} />
                  {' '}{displayedRegion}
                </Text>
              </>
            )}

            {savingAvatar && (
              <Text style={styles.memberNote}>Saving picture...</Text>
            )}
          </View>
        </View>

        {/* Statistics */}
        <Text style={styles.sectionTitle}>Your Journey</Text>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, CardShadow]}>
            <Text style={styles.statValue}>{discoveries.length}</Text>
            <Text style={styles.statLabel}>Discoveries</Text>
          </View>

          <View style={[styles.statCard, CardShadow]}>
            <Text style={styles.statValue}>{speciesCount}</Text>
            <Text style={styles.statLabel}>Species</Text>
          </View>

          <View style={[styles.statCard, CardShadow]}>
            <Text style={styles.statValue}>{unlockedCount}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>

        <Text style={styles.smallNote}>
          {discoveryRecords.length} detailed saved species
        </Text>

                {/* Achievements */}
        <Text style={styles.sectionTitle}>Achievements</Text>

        {achievementsState.loading ? (
          <LoadingState message="Checking your badges..." />
        ) : (
          <View style={styles.achievementGrid}>
            {achievementProgress.map((achievement) => {
              const unit =
                achievement.id === 'forest-friend'
                  ? 'mammals'
                  : achievement.id === 'mycelium-hunter'
                    ? 'fungi'
                    : 'species';

              return (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    CardShadow,
                    !achievement.unlocked && styles.locked,
                  ]}
                  accessibilityLabel={`${achievement.title}, ${
                    achievement.unlocked ? 'unlocked' : 'locked'
                  }, ${achievement.progress} of ${achievement.goal} ${unit}`}
                >
                  <Text style={styles.achievementEmoji}>
                    {achievement.unlocked ? achievement.emoji : '🔒'}
                  </Text>

                  <Text style={styles.achievementTitle} numberOfLines={1}>
                    {achievement.title}
                  </Text>

                  <Text style={styles.achievementDesc} numberOfLines={2}>
                    {achievement.description}
                  </Text>

                  <Text style={styles.achievementDesc}>
                    {achievement.progress} / {achievement.goal} {unit}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Next milestone */}
        <View style={[styles.milestoneCard, CardShadow]}>
          {nextAchievement ? (
            <>
              <Text style={styles.milestoneTitle}>
                Next badge: {nextAchievement.title}
              </Text>

              <ProgressBar
                progress={Math.min(
                  nextAchievement.progress / nextAchievement.goal,
                  1,
                )}
                accessibleLabel={`${nextAchievement.progress} of ${nextAchievement.goal} toward ${nextAchievement.title}`}
              />

              <Text style={styles.milestoneNote}>
                {nextAchievement.goal - nextAchievement.progress} more{' '}
                {nextAchievement.id === 'forest-friend'
                  ? 'mammals'
                  : nextAchievement.id === 'mycelium-hunter'
                    ? 'fungi'
                    : 'species'}{' '}
                to earn it.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.milestoneTitle}>
                All badges earned!
              </Text>
              <Text style={styles.milestoneNote}>
                Congratulations! You have unlocked every achievement.
              </Text>
            </>
          )}
        </View>

        {/* Next milestone */}
        <View style={[styles.milestoneCard, CardShadow]}>
          <Text style={styles.milestoneTitle}>
            Next badge: Keen Eye
          </Text>

          <ProgressBar
            progress={Math.min(speciesCount / 10, 1)}
            accessibleLabel={`${speciesCount} of 10 species toward Keen Eye`}
          />

          <Text style={styles.milestoneNote}>
            Identify {Math.max(10 - speciesCount, 0)} more species to earn it.
          </Text>
        </View>

        {/* Settings */}
        <Text style={styles.sectionTitle}>Settings</Text>

        <View style={styles.settingsCard}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/location')}
            style={({ pressed }) => [
              styles.settingsRow,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="globe-outline"
              size={22}
              color={Colors.forestGreen}
            />
            <Text style={styles.settingsLabel}>Region</Text>
            <Text style={styles.settingsValue}>
              {region?.name ?? 'Choose'}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.textSecondary}
            />
          </Pressable>

          <View style={styles.settingsDivider} />

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [
              styles.settingsRow,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color={Colors.forestGreen}
            />
            <Text style={styles.settingsLabel}>App settings</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.textSecondary}
            />
          </Pressable>
        </View>

        <Text style={styles.previewNote}>
          WildDex v0.1.0 · Personal Explorer Profile
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.warmCream,
  },
  scroll: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  pageTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  avatarButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    position: 'relative',
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.leafTint,
  },
  avatarPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.deepForest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  identity: {
    flex: 1,
    gap: 5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  displayName: {
    flexShrink: 1,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  nicknameInput: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.forestGreen,
    paddingVertical: 5,
    fontSize: 17,
    color: Colors.textPrimary,
  },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  saveText: {
    color: Colors.forestGreen,
    fontWeight: '800',
  },
  cancelText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  memberNote: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  regionNote: {
    fontSize: 12,
    color: Colors.forestGreen,
  },
  sectionTitle: {
    ...Typography.subtitle,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.forestGreen,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  smallNote: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: -Spacing.sm,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  achievementCard: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 150,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
  },
  locked: {
    opacity: 0.6,
  },
  achievementEmoji: {
    fontSize: 26,
  },
  achievementTitle: {
    fontWeight: '800',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  achievementDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  milestoneCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  milestoneTitle: {
    fontWeight: '800',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  milestoneNote: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...CardShadow,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  settingsValue: {
    fontSize: 13,
    color: Colors.textSecondary,
    maxWidth: 130,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 50,
  },
  pressed: {
    backgroundColor: Colors.leafTint,
  },
  previewNote: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});
