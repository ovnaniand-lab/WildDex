/**
 * Identify Screen — introduces camera-based identification.
 *
 * ⚠️ Phase 1: no AI recognition is implemented and no backend is connected.
 * The buttons below pick/launch a real image source via expo-image-picker so
 * the UX flow is genuine; in Phase 2 the chosen image will be uploaded to the
 * WildDex identification service.
 */
import EmptyState from '@/components/EmptyState';
import PrimaryButton from '@/components/PrimaryButton';
import { CardShadow, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Step {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  { icon: 'flash-outline', title: 'Get close, get light', body: 'Fill the frame with the animal or plant and use natural daylight where possible.' },
  { icon: 'albums-outline', title: 'Capture one subject', body: 'Clear photos of a single species identify best — avoid busy backgrounds.' },
  { icon: 'leaf-outline', title: 'Add context', body: 'Note habitat (forest floor, pond, sky) — it helps narrow candidates.' },
  { icon: 'bookmark-outline', title: 'Save your discovery', body: 'Confirm the match and it lands in your regional collection automatically.' },
];

export default function IdentifyScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  const pickImage = async (source: 'camera' | 'library') => {
    setBusy(true);
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setPermissionDenied(true);
          return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          allowsEditing: true,
          aspect: [4, 3],
        });
        if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
      }
      setPermissionDenied(false);
    } catch {
      setPermissionDenied(false);
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
            🚧 Identification service arrives in Phase 2 — this screen demonstrates the capture flow only.
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
            <Text style={styles.previewText}>Photo ready ✓ — matching will run once the Phase 2 service is connected.</Text>
            <PrimaryButton label="Remove photo" variant="ghost" onPress={() => setImageUri(null)} />
          </View>
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
