/** Reusable results display for Phase 3B.3. No network requests or storage. */
import { CardShadow, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export interface PlantSuggestion {
  scientificName: string;
  commonNames: string[];
  family: string | null;
  score: number;
}

interface Props {
  suggestions: PlantSuggestion[];
  loading?: boolean;
  error?: string | null;
  selectedName?: string | null;
  onSelect?: (suggestion: PlantSuggestion) => void;
  onRetry?: () => void;
  demo?: boolean;
}

export default function PlantIdentificationResults({
  suggestions, loading = false, error, selectedName, onSelect, onRetry, demo = false,
}: Props) {
  if (loading) return (
    <View style={[styles.card, CardShadow]}>
      <ActivityIndicator color={Colors.forestGreen} />
      <Text style={styles.subtle}>Identifying plant…</Text>
    </View>
  );
  if (error) return (
    <View style={[styles.card, CardShadow]}>
      <Text style={styles.title}>Identification unavailable</Text>
      <Text style={styles.subtle}>{error}</Text>
      {onRetry ? <Pressable accessibilityRole="button" onPress={onRetry}><Text style={styles.action}>Try again</Text></Pressable> : null}
    </View>
  );
  if (suggestions.length === 0) return (
    <View style={[styles.card, CardShadow]}>
      <Text style={styles.title}>No matches found</Text>
      <Text style={styles.subtle}>Try a clearer image showing one plant.</Text>
    </View>
  );

  return (
    <View style={[styles.card, CardShadow]}>
      <Text style={styles.title}>{demo ? 'Sample identification results' : 'Possible plant matches'}</Text>
      {demo ? <Text style={styles.notice}>DEMO — these are results from an earlier Dahlia test, not from your selected photo.</Text> : null}
      <Text style={styles.subtle}>Scores reflect model ranking, not certainty. Check several characteristics before confirming a species.</Text>
      {suggestions.map((suggestion, index) => {
        const pct = Math.max(0, Math.min(100, suggestion.score * 100));
        const selected = selectedName === suggestion.scientificName;
        return (
          <Pressable
            key={`${suggestion.scientificName}-${index}`}
            accessibilityRole="button"
            accessibilityLabel={`Select ${suggestion.scientificName}`}
            accessibilityState={{ selected }}
            disabled={!onSelect}
            onPress={() => onSelect?.(suggestion)}
            style={[styles.match, selected && styles.selected]}
          >
            <View style={styles.line}>
              <Text style={styles.name}>{index + 1}. {suggestion.scientificName}</Text>
              <Text style={styles.score}>{pct.toFixed(1)}%</Text>
            </View>
            <Text style={styles.subtle}>{suggestion.commonNames.join(', ') || 'Common name unavailable'}</Text>
            {suggestion.family ? <Text style={styles.subtle}>Family: {suggestion.family}</Text> : null}
            <View style={styles.track}><View style={[styles.fill, { width: `${pct}%` }]} /></View>
            {selected ? <Text style={styles.action}>{demo ? 'Selected for preview only — not saved' : 'Selected — not yet saved'}</Text> : null}
          </Pressable>
        );
      })}
      <Text style={styles.subtle}>No discoveries are saved automatically. Confirmation and encyclopedia linking come next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.md, backgroundColor: Colors.white, borderRadius: Radius.lg, gap: Spacing.sm },
  title: { ...Typography.subtitle, color: Colors.deepForest },
  subtle: { fontSize: 12, lineHeight: 18, color: Colors.textSecondary },
  notice: { fontSize: 12, fontWeight: '700', color: Colors.earthBrown, backgroundColor: Colors.amberTint, borderRadius: Radius.md, padding: Spacing.sm },
  match: { borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.sm, gap: 5 },
  selected: { borderColor: Colors.forestGreen, backgroundColor: Colors.leafTint },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  name: { flex: 1, fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  score: { fontSize: 14, fontWeight: '800', color: Colors.forestGreen },
  track: { height: 6, backgroundColor: Colors.leafTint, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Colors.leafGreen, borderRadius: 4 },
  action: { fontSize: 12, fontWeight: '700', color: Colors.forestGreen },
});
