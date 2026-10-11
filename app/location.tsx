/**
 * Location Selection — "Use My Location" (device geolocation, offline-safe)
 * plus manual country/region picking. The chosen region id is persisted with
 * AsyncStorage via the WildDex state hook.
 *
 * ⚠️ Phase 1: reverse geocoding to a WildDex region is a clearly-labelled
 * local heuristic over coarse bounding boxes; Phase 2 replaces it with the
 * backend regions API.
 */
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import { CardShadow, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { repository } from '@/data/repository';
import type { Region } from '@/data/types';
import { useRepositoryData } from '@/hooks/useRepositories';
import { useWildDex } from '@/hooks/useWildDexState';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Box {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

/** Very coarse continent boxes for the offline Phase-1 guesser. */
const REGION_BOXES: Record<string, Box[]> = {
  'western-europe': [{ minLat: 36, maxLat: 71, minLon: -11, maxLon: 30 }],
  'amazon-basin': [{ minLat: -20, maxLat: 6, minLon: -80, maxLon: -45 }],
  'east-african-savanna': [{ minLat: -12, maxLat: 20, minLon: 25, maxLon: 52 }],
  'boreal-canada': [{ minLat: 42, maxLat: 83, minLon: -141, maxLon: -52 }],
  'southeast-asia': [{ minLat: -11, maxLat: 29, minLon: 90, maxLon: 142 }],
  'australian-bush': [{ minLat: -45, maxLat: -10, minLon: 110, maxLon: 155 }],
};

function guessRegionFromCoords(lat: number, lon: number): string | null {
  for (const [regionId, boxes] of Object.entries(REGION_BOXES)) {
    if (boxes.some((b) => lat >= b.minLat && lat <= b.maxLat && lon >= b.minLon && lon <= b.maxLon)) {
      return regionId;
    }
  }
  return null;
}

export default function LocationScreen() {
  const router = useRouter();
  const { selectedRegionId, setRegion } = useWildDex();
  const regionsState = useRepositoryData<Region[]>(() => repository.getRegions(), []);

  const [picked, setPicked] = useState<string>(selectedRegionId);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const continents = useMemo(() => {
    const map = new Map<string, Region[]>();
    for (const r of regionsState.data ?? []) {
      map.set(r.continent, [...(map.get(r.continent) ?? []), r]);
    }
    return Array.from(map.entries());
  }, [regionsState.data]);

  const useMyLocation = async () => {
    setLocating(true);
    setLocationError(null);
    setLocationMessage(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission was denied. You can still pick your region manually below.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const guessed = guessRegionFromCoords(pos.coords.latitude, pos.coords.longitude);
      if (guessed) {
        setPicked(guessed);
        const region = repository.getRegionById(guessed);
        setLocationMessage(`📍 Detected you are in ${region?.name ?? 'a nearby region'} — tap Save to confirm.`);
      } else {
        setLocationMessage('📍 We got your coordinates but no preview region matches yet. Pick one manually below.');
      }
    } catch {
      setLocationError('Could not read your location right now. Choose a region manually below.');
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await setRegion(picked);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Choose your region"
        subtitle="Collections and challenges adapt to your corner of the world."
        showBack
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Use my location */}
        <View style={[styles.locateCard, CardShadow]}>
          <View style={styles.locateIcon}>
            <Ionicons name="navigate" size={26} color={Colors.deepForest} />
          </View>
          <View style={styles.locateTexts}>
            <Text style={styles.locateTitle}>Use My Location</Text>
            <Text style={styles.locateBody}>
              Let WildDex suggest the closest region from your GPS position. Location is used on-device
              only and never uploaded in this phase.
            </Text>
          </View>
          <PrimaryButton label="Detect" loading={locating} onPress={useMyLocation} accessibilityLabel="Detect my region from location" />
        </View>
        {locationMessage ? <Text style={styles.messageOk}>{locationMessage}</Text> : null}
        {locationError ? <Text style={styles.messageErr}>{locationError}</Text> : null}

        {/* Manual selection grouped by continent */}
        {regionsState.loading ? (
          <LoadingState message="Loading regions…" />
        ) : regionsState.error ? (
          <EmptyState emoji="🗺️" title="Regions unavailable" message={regionsState.error} actionLabel="Retry" onAction={regionsState.refetch} />
        ) : (
          continents.map(([continent, regions]) => (
            <View key={continent} style={styles.group}>
              <Text style={styles.groupTitle}>{continent}</Text>
              {regions.map((r) => {
                const active = picked === r.id;
                return (
                  <Pressable
                    key={r.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setPicked(r.id)}
                    style={({ pressed }) => [styles.regionRow, active && styles.regionActive, pressed && styles.pressed]}
                  >
                    <Text style={styles.regionEmoji}>{r.emoji}</Text>
                    <View style={styles.regionTexts}>
                      <Text style={[styles.regionName, active && styles.regionNameActive]}>{r.name}</Text>
                      <Text style={styles.regionCountry}>{r.country}</Text>
                    </View>
                    <Ionicons
                      name={active ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={active ? Colors.goldenAmber : Colors.textSecondary}
                    />
                  </Pressable>
                );
              })}
            </View>
          ))
        )}

        <PrimaryButton label="Save Selected Region 🌿" size="lg" loading={saving} onPress={save} disabled={!picked} />
        <Text style={styles.previewNote}>
          Region list is preview data; global coverage arrives with the Phase 2 backend.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmCream },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  locateCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  locateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.amberTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateTexts: { gap: 3 },
  locateTitle: { ...Typography.subtitle },
  locateBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  messageOk: { fontSize: 13, fontWeight: '600', color: Colors.forestGreen },
  messageErr: { fontSize: 13, fontWeight: '600', color: Colors.danger },
  group: { gap: Spacing.sm },
  groupTitle: { ...Typography.overline, color: Colors.earthBrown },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  regionActive: { borderColor: Colors.forestGreen, backgroundColor: Colors.leafTint },
  pressed: { opacity: 0.9 },
  regionEmoji: { fontSize: 24 },
  regionTexts: { flex: 1 },
  regionName: { fontWeight: '800', fontSize: 15, color: Colors.textPrimary },
  regionNameActive: { color: Colors.forestGreen },
  regionCountry: { fontSize: 12, color: Colors.textSecondary },
  previewNote: { textAlign: 'center', fontSize: 11, color: Colors.textSecondary },
});
