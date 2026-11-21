
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useWildDex } from '@/hooks/useWildDexState';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiscoveryDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const goBack = () => {
  router.replace('/(tabs)/collections');
};

  const { discoveryRecords } = useWildDex();

  const record = discoveryRecords.find(
    (item) => item.speciesId === id,
  );

  if (!record) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.forestGreen} />
          <Text style={styles.backText}>Back to Collections</Text>
        </Pressable>

        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Discovery not found</Text>
          <Text style={styles.notFoundText}>
            This discovery may have been removed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const formattedDate = new Date(record.date).toLocaleDateString(
    undefined,
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
  onPress={goBack}
  style={styles.backButton}
  accessibilityRole="button"
  accessibilityLabel="Back to Collections"
>
            <Ionicons name="arrow-back" size={23} color={Colors.forestGreen} />
          </Pressable>

          <Text style={styles.headerTitle}>Discovery Details</Text>
        </View>

        {record.photoUri ? (
          <Image
            source={{ uri: record.photoUri }}
            style={styles.mainImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderEmoji}>🌿</Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.eyebrow}>MY DISCOVERY</Text>

          <Text style={styles.commonName}>
            {record.commonName ?? record.scientificName}
          </Text>

          {record.commonName ? (
            <Text style={styles.scientificName}>
              {record.scientificName}
            </Text>
          ) : null}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Observation information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar-outline" size={21} color={Colors.forestGreen} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Date discovered</Text>
                <Text style={styles.infoValue}>{formattedDate}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="leaf-outline" size={21} color={Colors.forestGreen} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Identification source</Text>
                <Text style={styles.infoValue}>
                  {record.source === 'plantnet' ? 'Pl@ntNet' : 'WildDex Encyclopedia'}
                </Text>
              </View>
            </View>

            {record.location ? (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="location-outline" size={21} color={Colors.forestGreen} />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>
                    {record.location.lat.toFixed(5)}, {record.location.lon.toFixed(5)}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="location-outline" size={21} color={Colors.textSecondary} />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>Not recorded</Text>
                </View>
              </View>
            )}
          </View>

          <Text style={styles.footer}>
            This discovery is saved locally on your device.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.warmCream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: Colors.forestGreen,
    fontWeight: '700',
  },
  headerTitle: {
    ...Typography.subtitle,
    fontSize: 18,
  },
  mainImage: {
    width: '100%',
    height: 330,
    backgroundColor: Colors.leafTint,
  },
  imagePlaceholder: {
    height: 260,
    backgroundColor: Colors.leafTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 70,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  eyebrow: {
    color: Colors.forestGreen,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  commonName: {
    ...Typography.display,
    fontSize: 27,
    color: Colors.textPrimary,
  },
  scientificName: {
    fontSize: 15,
    fontStyle: 'italic',
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.subtitle,
    fontSize: 18,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.leafTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    gap: 3,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  footer: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  notFoundText: {
    color: Colors.textSecondary,
  },
});
