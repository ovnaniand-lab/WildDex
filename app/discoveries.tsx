
import { Colors, Radius, Spacing, Typography, CardShadow } from '@/constants/theme';
import { useWildDex } from '@/hooks/useWildDexState';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'mammals', label: 'Mammals' },
  { id: 'birds', label: 'Birds' },
  { id: 'plants', label: 'Plants' },
  { id: 'fungi', label: 'Fungi' },
  { id: 'reptiles', label: 'Reptiles' },
  { id: 'amphibians', label: 'Amphibians' },
  { id: 'fish', label: 'Fish' },
  { id: 'ants', label: 'Ants' },
  { id: 'other-insects', label: 'Other insects' },
];

export default function DiscoveriesScreen() {
  const router = useRouter();
  const { discoveryRecords, discoveryCategories } = useWildDex();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...discoveryRecords]
      .filter((record) => {
        const category =
          record.categoryId ?? discoveryCategories[record.speciesId];

        const matchesCategory =
          selectedCategory === 'all' || category === selectedCategory;

        const matchesSearch =
          !query ||
          (record.commonName ?? '').toLowerCase().includes(query) ||
          record.scientificName.toLowerCase().includes(query);

        return matchesCategory && matchesSearch;
      })
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
  }, [discoveryRecords, discoveryCategories, search, selectedCategory]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.replace('/(tabs)/collections')}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹  Collections</Text>
        </Pressable>

        <Text style={styles.eyebrow}>YOUR FIELD JOURNAL</Text>
        <Text style={styles.title}>My Discoveries</Text>
        <Text style={styles.subtitle}>
          Every species you've recorded, gathered in one place.
        </Text>

        <View style={styles.summary}>
          <Text style={styles.summaryNumber}>
            {discoveryRecords.length}
          </Text>
          <Text style={styles.summaryLabel}>
            {discoveryRecords.length === 1 ? 'species saved' : 'species saved'}
          </Text>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by common or scientific name"
          placeholderTextColor={Colors.textSecondary}
          style={styles.search}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {CATEGORIES.map((category) => {
            const active = selectedCategory === category.id;

            return (
              <Pressable
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                style={[
                  styles.filter,
                  active && styles.filterActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filteredRecords.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>
              {discoveryRecords.length === 0 ? '🌱' : '🔎'}
            </Text>
            <Text style={styles.emptyTitle}>
              {discoveryRecords.length === 0
                ? 'Your journal is waiting'
                : 'No discoveries found'}
            </Text>
            <Text style={styles.emptyText}>
              {discoveryRecords.length === 0
                ? 'Identify a species and save it to start building your field journal.'
                : 'Try another search or choose a different category.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredRecords.map((record) => (
              <Pressable
                key={record.speciesId}
                onPress={() =>
                  router.push({
                    pathname: '/discovery/[id]',
                    params: { id: record.speciesId },
                  })
                }
                style={({ pressed }) => [
                  styles.recordCard,
                  CardShadow,
                  pressed && styles.pressed,
                ]}
              >
                {record.photoUri ? (
                  <Image
                    source={{ uri: record.photoUri }}
                    style={styles.recordImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderEmoji}>🌿</Text>
                  </View>
                )}

                <View style={styles.recordInfo}>
                  <Text style={styles.recordName} numberOfLines={2}>
                    {record.commonName ?? record.scientificName}
                  </Text>
                  <Text style={styles.scientificName} numberOfLines={1}>
                    {record.scientificName}
                  </Text>
                  <Text style={styles.recordDate}>
                    {new Date(record.date).toLocaleDateString()}
                  </Text>
                </View>

                <Text style={styles.arrow}>›</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.warmCream,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  backText: {
    color: Colors.forestGreen,
    fontSize: 15,
    fontWeight: '600',
  },
  eyebrow: {
    ...Typography.overline,
    marginTop: Spacing.sm,
  },
  title: {
    ...Typography.display,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  summaryNumber: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.forestGreen,
  },
  summaryLabel: {
    ...Typography.caption,
  },
  search: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filters: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  filter: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterActive: {
    backgroundColor: Colors.forestGreen,
    borderColor: Colors.forestGreen,
  },
  filterText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Colors.white,
  },
  list: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: Spacing.md,
  },
  recordImage: {
    width: 88,
    height: 88,
    borderRadius: Radius.md,
    backgroundColor: Colors.leafTint,
  },
  imagePlaceholder: {
    width: 88,
    height: 88,
    borderRadius: Radius.md,
    backgroundColor: Colors.leafTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 28,
  },
  recordInfo: {
    flex: 1,
    gap: 4,
  },
  recordName: {
    ...Typography.subtitle,
    fontSize: 15,
  },
  scientificName: {
    ...Typography.caption,
    fontStyle: 'italic',
  },
  recordDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  arrow: {
    fontSize: 26,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.xs,
  },
  empty: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  emptyEmoji: {
    fontSize: 38,
  },
  emptyTitle: {
    ...Typography.subtitle,
    textAlign: 'center',
  },
  emptyText: {
    ...Typography.caption,
    textAlign: 'center',
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.85,
  },
});
