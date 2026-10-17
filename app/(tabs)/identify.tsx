/**
 * Identify Screen — camera/gallery and Phase 3B.3 results UI.
 * The example results are explicitly marked as samples.
 * Live photo uploads are not enabled until backend authentication is ready.
 */
import EmptyState from '@/components/EmptyState';
import PrimaryButton from '@/components/PrimaryButton';
import PlantIdentificationResults, { type PlantSuggestion } from '@/components/PlantIdentificationResults';
import { CardShadow, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Step {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

const SAMPLE_RESULTS: PlantSuggestion[] = [
  { scientificName: 'Dahlia pinnata', commonNames: ['Dahlia', 'Garden dahlia'], family: 'Asteraceae', score: 0.61585 },
  { scientificName: 'Dahlia tenuicaulis', commonNames: ['Dahlia', 'Tree dahlia'], family: 'Asteraceae', score: 0.09844 },
  { scientificName: 'Dahlia × hortensis', commonNames: ['Garden dahlia', 'Hybrid dahlia'], family: 'Asteraceae', score: 0.09366 },
  { scientificName: 'Dahlia merckii', commonNames: ['Bedding Dahlia'], family: 'Asteraceae', score: 0.04269 },
  { scientificName: 'Tanacetum coccineum', commonNames: ['Persian daisy'], family: 'Asteraceae', score: 0.01897 },
];

const STEPS: Step[] = [
  { icon: 'flash-outline', title: 'Get close, get light', body: 'Fill the frame with the animal or plant and use natural daylight where possible.' },
  { icon: 'albums-outline', title: 'Capture one subject', body: 'Clear photos of a single species identify best — avoid busy backgrounds.' },
  { icon: 'leaf-outline', title: 'Add context', body: 'Note habitat (forest floor, pond, sky) — it helps narrow candidates.' },
  { icon: 'bookmark-outline', title: 'Save your discovery', body: 'Confirm the match and it lands in your regional collection automatically.' },
];

export default function IdentifyScreen() {
  const { recoveredPhoto } = useLocalSearchParams<{
    recoveredPhoto?: string;
  }>();

  const [imageUri, setImageUri] = useState<string | null>(
    recoveredPhoto ?? null
  );
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showSampleResults, setShowSampleResults] = useState(false);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const resetResults = () => {
    setShowSampleResults(false);
    setSelectedSample(null);
    setPhotoError(null);
  };

  const removePhoto = () => {
    setImageUri(null);
    resetResults();
  };

  const pickImage = async (source: 'camera' | 'library') => {
    setBusy(true);
    setPhotoError(null);
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setPermissionDenied(true);
          return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (!result.canceled && result.assets[0]) {
          resetResults();
          setImageUri(result.assets[0].uri);
        }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          allowsEditing: true,
          aspect: [4, 3],
        });
        if (!result.canceled && result.assets[0]) {
          resetResults();
          setImageUri(result.assets[0].uri);
        }
      }
      setPermissionDenied(false);
    } catch {
      setPhotoError('Could not open the photo source. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Identify Wildlife</Text>
        <Text style={styles.subtitle}>
          Photograph any creature or plant and WildDex will help you find out what it is.
        </Text>

        {/* Hero illustration card */}
        <View style={[styles.heroCard, CardShadow]}>
          <View style={styles.heroIcon}>
            <Ionicons name="camera" size={40} color={Colors.goldenAmber} />
          </View>
          <Text style={styles.heroTitle}>Your pocket field expert</Text>
          <Text style={styles.heroBody}>
            Point your camera at wildlife and get candidate matches with photos, habitat notes and
            conservation status.
          </Text>
          <Text style={styles.phaseBadge}>
            Phase 3B.3: Results preview is available. Live mobile identification is not enabled yet.
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <PrimaryButton
            label="Take Photo"
            icon="📷"
            size="lg"
            loading={busy}
            onPress={() => pickImage('camera')}
            accessibilityLabel="Take a photo to identify"
          />
          <PrimaryButton
            label="Choose Photo"
            icon="🖼️"
            variant="secondary"
            size="lg"
            loading={busy}
            onPress={() => pickImage('library')}
            accessibilityLabel="Choose a photo from your library"
          />
        </View>

        {/* Selected preview */}
        {imageUri ? (
          <View style={[styles.previewCard, CardShadow]}>
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              contentFit="cover"
              accessibilityLabel="Selected photograph ready for identification"
            />
            <Text style={styles.previewText}>Photo ready. The preview below uses a previous Dahlia API response; this photo has NOT been analyzed.</Text>
            <PrimaryButton
              label={showSampleResults ? 'Hide sample results' : 'Preview identification results (sample)'}
              onPress={() => { setShowSampleResults((value) => !value); setSelectedSample(null); }}
            />
            <PrimaryButton label="Remove photo" variant="ghost" onPress={removePhoto} />
          </View>
        ) : null}

        {photoError ? <Text style={styles.errorText}>{photoError}</Text> : null}

        {imageUri && showSampleResults ? (
          <PlantIdentificationResults
            suggestions={SAMPLE_RESULTS}
            selectedName={selectedSample}
            onSelect={(suggestion) => setSelectedSample(suggestion.scientificName)}
            demo
          />
        ) : null}

        {/* Permission explanation */}
        <View style={styles.permissionCard}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.forestGreen} />
          <Text style={styles.permissionText}>
            WildDex only uses your camera and photo library when you tap the buttons above. Photos stay
            on your device until you choose to identify them, and permissions can be revoked anytime in
            system settings.
          </Text>
        </View>
        {permissionDenied ? (
          <EmptyState
            emoji="🚫"
            title="Camera permission needed"
            message="WildDex cannot open the camera without your permission. Enable it in Settings → Apps → WildDex → Camera, then try again."
            actionLabel="Try again"
            onAction={() => pickImage('camera')}
          />
        ) : null}

        {/* Instructions */}
        <Text style={styles.sectionTitle}>How to get great identifications</Text>
        {STEPS.map((s, i) => (
          <View key={s.title} style={[styles.stepRow, CardShadow]}>
            <View style={styles.stepIcon}>
              <Ionicons name={s.icon} size={20} color={Colors.forestGreen} />
            </View>
            <View style={styles.stepTexts}>
              <Text style={styles.stepTitle}>
                {i + 1}. {s.title}
              </Text>
              <Text style={styles.stepBody}>{s.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmCream },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  title: { ...Typography.display, fontSize: 26 },
  subtitle: { ...Typography.caption, fontSize: 14 },
  heroCard: {
    backgroundColor: Colors.deepForest,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: Colors.textOnDark },
  heroBody: { fontSize: 14, lineHeight: 20, color: Colors.textOnDarkSecondary, textAlign: 'center' },
  phaseBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.deepForest,
    backgroundColor: Colors.goldenAmber,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    textAlign: 'center',
    overflow: 'hidden',
  },
  actions: { gap: Spacing.sm },
  previewCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.sm, gap: Spacing.sm },
  previewImage: { width: '100%', height: 220, borderRadius: Radius.md, backgroundColor: Colors.leafTint },
  previewText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  errorText: { color: '#A12B2B', fontSize: 13, fontWeight: '600' },
  permissionCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.leafTint,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'flex-start',
  },
  permissionText: { flex: 1, fontSize: 13, lineHeight: 19, color: Colors.textPrimary },
  sectionTitle: { ...Typography.subtitle, marginTop: Spacing.sm },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'flex-start',
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.leafTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTexts: { flex: 1, gap: 2 },
  stepTitle: { fontWeight: '800', fontSize: 15, color: Colors.textPrimary },
  stepBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
});
