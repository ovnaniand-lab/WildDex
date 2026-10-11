/**
 * Onboarding flow — five swipeable slides:
 * Welcome → Explore Your Region → Identify Wildlife → Collect Discoveries → Start Exploring
 */
import PrimaryButton from '@/components/PrimaryButton';
import { CardShadow, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useWildDex } from '@/hooks/useWildDexState';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

interface Slide {
  emoji: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '🌿',
    title: 'Welcome to WildDex',
    body: 'Your worldwide nature encyclopedia. Carry the wild in your pocket and get to know every creature and plant around you.',
  },
  {
    emoji: '🗺️',
    title: 'Explore Your Region',
    body: 'Pick the part of the world you call home — or anywhere you dream of visiting — and browse the wildlife that lives there.',
  },
  {
    emoji: '📸',
    title: 'Identify Wildlife',
    body: 'Snap a photo of an animal, insect or mushroom and WildDex will help you work out what you found.',
  },
  {
    emoji: '📚',
    title: 'Collect Discoveries',
    body: 'Every species you record fills your personal collection and unlocks regional and category collections.',
  },
  {
    emoji: '🧭',
    title: 'Start Exploring',
    body: 'Choose your region and begin your nature adventure. The wild is waiting!',
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const { completeOnboarding } = useWildDex();
  const { width } = useWindowDimensions();
  const last = index === SLIDES.length - 1;

  const finish = async () => {
    await completeOnboarding();
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip onboarding"
        onPress={finish}
        hitSlop={12}
        style={styles.skip}
      >
        <Text style={styles.skipLink}>Skip</Text>
      </Pressable>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width)))
        }
      >
        {SLIDES.map((s) => (
          <View key={s.title} style={[styles.slide, { width }]}>
            <View style={styles.emojiCircle}>
              <Text style={styles.emoji}>{s.emoji}</Text>
            </View>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View key={s.title} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        {last ? (
          <PrimaryButton
            label="Start Exploring 🌍"
            size="lg"
            onPress={finish}
            style={styles.amberCta}
          />
        ) : (
          <PrimaryButton
            label="Next"
            variant="secondary"
            onPress={() => setIndex((v) => Math.min(v + 1, SLIDES.length - 1))}
            style={styles.nextCta}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.deepForest },
  skip: { position: 'absolute', top: Spacing.lg, right: Spacing.lg, zIndex: 2 },
  skipLink: { color: Colors.textOnDarkSecondary, fontWeight: '600', textDecorationLine: 'underline' },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  emojiCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    ...CardShadow,
  },
  emoji: { fontSize: 64 },
  title: { ...Typography.display, color: Colors.textOnDark, textAlign: 'center', marginTop: Spacing.lg },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textOnDarkSecondary,
    textAlign: 'center',
    maxWidth: 340,
  },
  footer: { padding: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(248,245,234,0.3)' },
  dotActive: { backgroundColor: Colors.goldenAmber, width: 22 },
  amberCta: { alignSelf: 'stretch', backgroundColor: Colors.goldenAmber, borderRadius: Radius.md },
  nextCta: { alignSelf: 'stretch' },
});
