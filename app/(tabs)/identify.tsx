/**
 * Identify Screen — camera/gallery and live Pl@ntNet plant identification.
 * Photos are uploaded only after the user taps Identify Plant.
 */
import { countryByCode } from '@/src/api/countries';
import EmptyState from '@/components/EmptyState';
import PrimaryButton from '@/components/PrimaryButton';
import PlantIdentificationResults, { type PlantSuggestion } from '@/components/PlantIdentificationResults';
import { CardShadow, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useWildDex } from '@/hooks/useWildDexState';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { identifyPlant } from '@/src/api/plantIdentification';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const REGION_BY_CONTINENT: Record<string, string> = {
  Europe: 'western-europe',
  'South America': 'amazon-basin',
  Africa: 'east-african-savanna',
  'North America': 'boreal-canada',
  Asia: 'southeast-asia',
  Oceania: 'australian-bush',
};

interface Step {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
  icon: 'bookmark-outline',
  title: 'Save your discovery',
  body: 'Choose a species match and save it with your photo, date and optional location.',
},
  { icon: 'flash-outline', title: 'Get close, get light', body: 'Fill the frame with the animal or plant and use natural daylight where possible.' },
  { icon: 'albums-outline', title: 'Capture one subject', body: 'Clear photos of a single species identify best — avoid busy backgrounds.' },
  { icon: 'leaf-outline', title: 'Add context', body: 'Note habitat (forest floor, pond, sky) — it helps narrow candidates.' },
  { icon: 'bookmark-outline', title: 'Review your match', body: 'Check the suggested species carefully. Saving discoveries will be added next.' },
];
function createPlantNetSpeciesId(scientificName: string): string {
  return `plantnet:${scientificName.trim().toLowerCase().replace(/\s+/g, '_')}`;
}
export default function IdentifyScreen() {
  const {
  saveDiscoveryRecord,
  discoveryRecords,
  selectedCountryCode,
  selectedRegionId,
  regionMode,
} = useWildDex();

const selectedCountry =
  regionMode === 'manual' && selectedCountryCode
    ? countryByCode(selectedCountryCode)
    : undefined;

const discoveryRegionId = selectedCountry
  ? REGION_BY_CONTINENT[selectedCountry.continent]
  : selectedRegionId;

const [saving, setSaving] = useState(false);
const [saveMessage, setSaveMessage] = useState<string | null>(null);
const [saveError, setSaveError] = useState<string | null>(null);
  const { recoveredPhoto } = useLocalSearchParams<{
    recoveredPhoto?: string;
  }>();

  const [imageUri, setImageUri] = useState<string | null>(
    recoveredPhoto ?? null
  );
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [suggestions, setSuggestions] = useState<PlantSuggestion[]>([]);
  const [hasIdentification, setHasIdentification] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [identificationError, setIdentificationError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);

  useEffect(() => () => {
    generationRef.current += 1;
    requestRef.current?.abort();
  }, []);

  const resetResults = () => {
    setSaveMessage(null);
    setSaveError(null);
    generationRef.current += 1;
    requestRef.current?.abort();
    requestRef.current = null;
    setIdentifying(false);
    setSuggestions([]);
    setHasIdentification(false);
    setSelectedName(null);
    setIdentificationError(null);
    setPhotoError(null);
  };

  const removePhoto = () => {
    resetResults();
    setImageUri(null);
  };

  const runIdentification = async () => {
    const selectedSuggestion = suggestions.find(
  (suggestion) => suggestion.scientificName === selectedName,
);

const saveSelectedDiscovery = async (includeLocation: boolean) => {
  if (!selectedSuggestion || !imageUri || saving) return;

  setSaving(true);
  setSaveMessage(null);
  setSaveError(null);

  const speciesId = createPlantNetSpeciesId(
    selectedSuggestion.scientificName,
  );

  const alreadySaved = discoveryRecords.some(
    (record) => record.speciesId === speciesId,
  );

  let location:
    | { lat: number; lon: number }
    | undefined;

  if (includeLocation) {
    try {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status === 'granted') {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
      }
    } catch {
      // Location is optional. Continue saving without a new location.
    }
  }

  try {
    await saveDiscoveryRecord({
      speciesId,
      scientificName: selectedSuggestion.scientificName,
      commonName: selectedSuggestion.commonNames[0] ?? null,
      photoUri: imageUri,
      date: new Date().toISOString(),
      location,
      source: 'plantnet',
      categoryId: 'plants',
      countryCode: regionMode === 'manual' ? selectedCountryCode : undefined,
      regionId: discoveryRegionId,
    });

    setSaveMessage(
      alreadySaved
        ? 'Discovery updated! Your latest photo and date have been saved.'
        : 'Discovery saved to your collection!',
    );
  } catch (error) {
    setSaveError(
      error instanceof Error
        ? error.message
        : 'Could not save this discovery. Please try again.',
    );
  } finally {
    setSaving(false);
  }
};

const handleSaveDiscovery = () => {
  if (!selectedSuggestion || !imageUri || saving) return;

  Alert.alert(
    'Add location to this discovery?',
    'You can save the discovery with or without your current location.',
    [
      {
        text: 'Save without location',
        onPress: () => {
          void saveSelectedDiscovery(false);
        },
      },
      {
        text: 'Add location',
        onPress: () => {
          void saveSelectedDiscovery(true);
        },
      },
    ],
  );
};
    if (!imageUri || identifying || busy) return;
    const generation = ++generationRef.current;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setIdentifying(true);
    setSuggestions([]);
    setSelectedName(null);
    setHasIdentification(false);
    setIdentificationError(null);
    try {
      const matches = await identifyPlant(imageUri, controller.signal);
      if (generation !== generationRef.current) return;
      setSuggestions(matches);
      setHasIdentification(true);
    } catch (error) {
      if (generation !== generationRef.current) return;
      setIdentificationError(error instanceof Error ? error.message : 'Could not identify this photo.');
    } finally {
      if (generation === generationRef.current) {
        requestRef.current = null;
        setIdentifying(false);
      }
    }
  };

const selectedSuggestion = suggestions.find(
  (suggestion) => suggestion.scientificName === selectedName,
);

const saveSelectedDiscovery = async (includeLocation: boolean) => {
  if (!selectedSuggestion || !imageUri || saving) return;

  setSaving(true);
  setSaveMessage(null);
  setSaveError(null);

  const speciesId = createPlantNetSpeciesId(
    selectedSuggestion.scientificName,
  );

  const alreadySaved = discoveryRecords.some(
    (record) => record.speciesId === speciesId,
  );

  let location: { lat: number; lon: number } | undefined;

  if (includeLocation) {
    try {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status === 'granted') {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
      }
    } catch {
      // Location is optional. Continue saving without it.
    }
  }

  try {
    await saveDiscoveryRecord({
      speciesId,
      scientificName: selectedSuggestion.scientificName,
      commonName: selectedSuggestion.commonNames[0] ?? null,
      photoUri: imageUri,
      date: new Date().toISOString(),
      location,
      source: 'plantnet',
      categoryId: 'plants',
      countryCode: regionMode === 'manual' ? selectedCountryCode : undefined,
      regionId: discoveryRegionId,
    });

    setSaveMessage(
      alreadySaved
        ? 'Discovery updated! Your latest photo and date have been saved.'
        : 'Discovery saved to your collection!',
    );
  } catch (error) {
    setSaveError(
      error instanceof Error
        ? error.message
        : 'Could not save this discovery. Please try again.',
    );
  } finally {
    setSaving(false);
  }
};

const handleSaveDiscovery = () => {
  if (!selectedSuggestion || !imageUri || saving) return;

  Alert.alert(
    'Add location to this discovery?',
    'You can save the discovery with or without your current location.',
    [
      {
        text: 'Save without location',
        onPress: () => {
          void saveSelectedDiscovery(false);
        },
      },
      {
        text: 'Add location',
        onPress: () => {
          void saveSelectedDiscovery(true);
        },
      },
    ],
  );
};


  const pickImage = async (source: 'camera' | 'library') => {
    resetResults();
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
            Photograph a plant, then tap Identify Plant to get possible species matches.
            Animal identification is coming later.
          </Text>
          <Text style={styles.phaseBadge}>
            Live plant identification is available. Please check suggestions before trusting a match.
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
            <Text style={styles.previewText}>Photo ready. Tap Identify Plant to upload it securely for analysis.</Text>
            <PrimaryButton
              label="Identify Plant"
              loading={identifying}
              onPress={() => { void runIdentification(); }}
            />
            <PrimaryButton label="Remove photo" variant="ghost" onPress={removePhoto} />
          </View>
        ) : null}

        {photoError ? <Text style={styles.errorText}>{photoError}</Text> : null}

        {imageUri && (identifying || identificationError || hasIdentification) ? (
  <PlantIdentificationResults
    suggestions={suggestions}
    loading={identifying}
    error={identificationError}
    onRetry={() => { void runIdentification(); }}
    selectedName={selectedName}
    onSelect={(suggestion) => {
      setSelectedName(suggestion.scientificName);
      setSaveMessage(null);
      setSaveError(null);
    }}
  />
) : null}

{selectedSuggestion && imageUri && hasIdentification ? (
  <View style={styles.saveSection}>
    <PrimaryButton
      label={
        discoveryRecords.some(
          (record) =>
            record.speciesId ===
            createPlantNetSpeciesId(selectedSuggestion.scientificName),
        )
          ? 'Update Discovery'
          : 'Save Discovery'
      }
      icon="🔖"
      loading={saving}
      onPress={handleSaveDiscovery}
      accessibilityLabel="Save selected plant discovery"
    />

    {saveMessage ? (
      <Text style={styles.saveSuccess}>{saveMessage}</Text>
    ) : null}

    {saveError ? (
      <Text style={styles.errorText}>{saveError}</Text>
    ) : null}
  </View>
) : null}

        {/* Permission explanation */}
        <View style={styles.permissionCard}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.forestGreen} />
          <Text style={styles.permissionText}>
            WildDex accesses your camera or gallery only when you choose. Your photo stays on your device
            until you tap Identify Plant; then it is sent to the WildDex backend and Pl@ntNet for analysis.
            Camera permissions can be revoked in system settings.
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
  saveSection: {
  gap: Spacing.sm,
},
saveSuccess: {
  color: Colors.forestGreen,
  fontSize: 13,
  fontWeight: '700',
  textAlign: 'center',
},
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
