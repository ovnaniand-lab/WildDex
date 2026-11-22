import { describe, expect, it } from 'vitest';
import { calculateAchievementProgress } from '../utils/achievements';
import type { Achievement } from '../data/types';

const achievements: Achievement[] = [
  { id: 'first-steps', title: 'First Steps', description: 'Record your first discovery', emoji: '??', unlocked: false },
  { id: 'keen-eye', title: 'Keen Eye', description: 'Identify 10 species', emoji: '??', unlocked: false },
  { id: 'forest-friend', title: 'Forest Friend', description: 'Discover 5 mammals', emoji: '??', unlocked: false },
  { id: 'mycelium-hunter', title: 'Mycelium Hunter', description: 'Find 3 fungi', emoji: '??', unlocked: false },
];

describe('Achievement progress', () => {
  it('unlocks First Steps after the first discovery', () => {
    const result = calculateAchievementProgress(
      achievements,
      ['red-fox'],
      [],
      {},
    );

    expect(result.find((item) => item.id === 'first-steps')?.unlocked).toBe(true);
    expect(result.find((item) => item.id === 'first-steps')?.progress).toBe(1);
  });

  it('counts unique species rather than duplicate saves', () => {
    const result = calculateAchievementProgress(
      achievements,
      ['red-fox', 'gray-wolf', 'red-fox'],
      [{ speciesId: 'gray-wolf', categoryId: 'mammals' }],
      {},
    );

    expect(result.find((item) => item.id === 'keen-eye')?.progress).toBe(2);
    expect(result.find((item) => item.id === 'forest-friend')?.progress).toBe(1);
  });

  it('unlocks Forest Friend after five unique mammals', () => {
    const discoveries = ['m1', 'm2', 'm3', 'm4', 'm5'];
    const categories = Object.fromEntries(
      discoveries.map((id) => [id, 'mammals']),
    );

    const result = calculateAchievementProgress(
      achievements,
      discoveries,
      [],
      categories,
    );

    expect(result.find((item) => item.id === 'forest-friend')?.unlocked).toBe(true);
    expect(result.find((item) => item.id === 'forest-friend')?.progress).toBe(5);
  });

  it('unlocks Mycelium Hunter after three unique fungi', () => {
    const discoveries = ['f1', 'f2', 'f3'];
    const categories = Object.fromEntries(
      discoveries.map((id) => [id, 'fungi']),
    );

    const result = calculateAchievementProgress(
      achievements,
      discoveries,
      [],
      categories,
    );

    expect(result.find((item) => item.id === 'mycelium-hunter')?.unlocked).toBe(true);
  });

  it('prefers a detailed record category over the category map', () => {
    const result = calculateAchievementProgress(
      achievements,
      ['species-1'],
      [{ speciesId: 'species-1', categoryId: 'fungi' }],
      { 'species-1': 'mammals' },
    );

    expect(result.find((item) => item.id === 'forest-friend')?.progress).toBe(0);
    expect(result.find((item) => item.id === 'mycelium-hunter')?.progress).toBe(1);
  });
});
