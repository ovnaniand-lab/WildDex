import type { Achievement, SpeciesCategoryId } from '../data/types';

export interface AchievementProgress extends Achievement {
  progress: number;
  goal: number;
}

interface DiscoveryRecordInput {
  speciesId: string;
  categoryId?: string;
}

const ACHIEVEMENT_RULES: Record<
  string,
  { goal: number; category?: SpeciesCategoryId }
> = {
  'first-steps': { goal: 1 },
  'keen-eye': { goal: 10 },
  'forest-friend': { goal: 5, category: 'mammals' },
  'mycelium-hunter': { goal: 3, category: 'fungi' },
};

export function calculateAchievementProgress(
  achievements: Achievement[],
  discoveries: string[],
  records: DiscoveryRecordInput[],
  categoryMap: Record<string, string>,
): AchievementProgress[] {
  const speciesIds = new Set([
    ...discoveries,
    ...records.map((record) => record.speciesId),
  ]);

  const categories = new Map<string, string>();

  for (const speciesId of speciesIds) {
    if (categoryMap[speciesId]) {
      categories.set(speciesId, categoryMap[speciesId]);
    }
  }

  for (const record of records) {
    if (record.categoryId) {
      categories.set(record.speciesId, record.categoryId);
    }
  }

  const totalSpecies = speciesIds.size;

  const categoryCounts = new Map<string, number>();

  for (const categoryId of categories.values()) {
    categoryCounts.set(
      categoryId,
      (categoryCounts.get(categoryId) ?? 0) + 1,
    );
  }

  return achievements.map((achievement) => {
    const rule = ACHIEVEMENT_RULES[achievement.id];

    if (!rule) {
      return {
        ...achievement,
        progress: achievement.unlocked ? 1 : 0,
        goal: 1,
      };
    }

    const count = rule.category
      ? categoryCounts.get(rule.category) ?? 0
      : totalSpecies;

    return {
      ...achievement,
      unlocked: count >= rule.goal,
      progress: count,
      goal: rule.goal,
    };
  });
}
