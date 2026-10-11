/**
 * Location Selection — Phase 2.
 *
 * Two modes:
 *  • GPS mode ("Explore nearby"): one-shot permission request + current
 *    coordinates, visible & configurable radius. Never continuously tracked;
 *    declining permission keeps manual mode fully working.
 *  • Manual mode: worldwide country picker (ISO 3166-1 codes) persisted in
 *    the WildDex state hook and used by GBIF/iNaturalist geographic filters.
 *
 * Results shown from these settings are always labelled as species *recorded*
 * in the area, not guaranteed present.
 */
import EmptyState from '@/components/EmptyState';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import { CardShadow, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useWildDex, DEFAULT_RADIUS_KM } from '@/hooks/useWildDexState';
import { COUNTRIES, countryByCode } from '@/src/api/countries';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RADIUS_OPTIONS = [10, 25, 50, 100, 200];

export default function LocationScreen() {
  const router = useRouter();
  const {
    selectedCountryCode,
    setSelectedCountry,
    gpsPoint,
    setGpsPoint,
    clearGpsPoint,
    radiusKm,
    setRadiusKm,
  } = useWildDex();

  const [pickedCountry, setPickedCountry] = useState<string | undefined>(selectedCountryCode);
  const [search, setSearch] = useState('');
  const [radius, setRadius] = useState<number>(radiusKm ?? DEFAULT_RADIUS_KM);
  const [customRadius, setCustomRadius] = useState<string>('');
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q);
  }, [search]);

  /** One-shot GPS fix — permission asked only when the button is pressed. */
  const useMyLocation = async () => {
    setLocating(true);
    setError(null);
    setMessage(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(
          'Location permission was denied — no problem. Pick a country below and everything still works.',
        );
        return;
      }
      // getCurrentPositionAsync = single fix; we never subscribe to watchPosition.
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await setGpsPoint({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      setPickedCountry(undefined);
      setMessage(
        `📍 Nearby mode active at ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}. Tap Save to explore wildlife recorded around you.`,
      );
    } catch {
      setError('Could not read your location right now. Choose a country manually below.');
    } finally {
      setLocating(false);
    }
  };

  const pickCountry = (code: string) => {
    setPickedCountry(code);
    setMessage(null);
    setError(null);
  };

  const applyRadius = (km: number) => {
    const clamped = Math.min(Math.max(km, 5), 500);
    setRadius(clamped);
    setCustomRadius('');
  };

  const save = async () => {
    setSaving(true);
    try {
      await setRadiusKm(radius);
      if (pickedCountry) {
        await setSelectedCountry(pickedCountry); // switches to manual mode
      }
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const disableNearby = async () => {
    await clearGpsPoint();
    setMessage(null);
  };

  const selectedCountry = countryByCode(pickedCountry);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Choose your region"
        subtitle="Explore species recorded near you or anywhere on Earth."
        showBack
      />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* GPS / nearby card */}
        <View style={[styles.locateCard, CardShadow]}>
          <View style={styles.locateIcon}>
            <Ionicons name="navigate" size={26} color={Colors.deepForest} />
          </View>
          <View style={styles.locateTexts}>
            <Text style={styles.locateTitle}>Explore nearby (GPS)</Text>
            <Text style={styles.locateBody}>
              WildDex asks for your location only when you tap Detect, takes a single fix and never
              tracks you. Declining still lets you pick any country below.
            </Text>
          </View>
          {gpsPoint ? (
            <View style={styles.nearbyActive}>
              <Text style={styles.nearbyText}>
                📍 Nearby mode: {gpsPoint.lat.toFixed(2)}, {gpsPoint.lon.toFixed(2)} · {radius} km
              </Text>
              <Pressable accessibilityRole="button" onPress={disableNearby}>
                <Text style={styles.nearbyOff}>Turn off</Text>
              </Pressable>
            </View>
          ) : (
            <PrimaryButton
              label="Detect My Location"
              loading={locating}
              onPress={useMyLocation}
              accessibilityLabel="Detect my location for nearby exploration"
            />
          )}
        </View>
        {message ? <Text style={styles.messageOk}>{message}</Text> : null}
        {error ? <Text style={styles.messageErr}>{error}</Text> : null}

        {/* Radius selector */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Search radius</Text>
          <View style={styles.chipRow}>
            {RADIUS_OPTIONS.map((km) => (
              <Pressable
                key={km}
                accessibilityRole="button"
                accessibilityState={{ selected: radius === km }}
                onPress={() => applyRadius(km)}
                style={[styles.chip, radius === km && styles.chipActive]}
              >
                <Text style={[styles.chipText, radius === km && styles.chipTextActive]}>{km} km</Text>
              </Pressable>
            ))}
            <TextInput
              value={customRadius}
              onChangeText={(t) => {
                setCustomRadius(t);
                const n = parseInt(t, 10);
                if (Number.isFinite(n)) applyRadius(n);
              }}
              keyboardType="number-pad"
              placeholder="Custom"
              placeholderTextColor={Colors.textSecondary}
              style={styles.customRadius}
              accessibilityLabel="Custom radius in kilometres"
            />
          </View>
        </View>

        {/* Worldwide country picker */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Or choose a country ({COUNTRIES.length} available)</Text>
          <View style={[styles.searchBox, CardShadow]}>
            <Ionicons name="search" size={18} color={Colors.leafGreen} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Type a country name…"
              placeholderTextColor={Colors.textSecondary}
              style={styles.searchInput}
              accessibilityLabel="Search countries"
              autoCorrect={false}
            />
          </View>
          <View style={styles.countryGrid}>
            {filtered.map((c) => {
              const active = pickedCountry === c.code;
              return (
                <Pressable
                  key={c.code}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => pickCountry(c.code)}
                  style={({ pressed }) => [styles.countryCell, active && styles.countryActive, pressed && styles.pressed]}
                >
                  <Text style={styles.countryEmoji}>{c.emoji}</Text>
                  <Text style={[styles.countryName, active && styles.countryNameActive]} numberOfLines={1}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
            {filtered.length === 0 ? (
              <EmptyState emoji="🗺️" title="No country matches" message="Try a different spelling." />
            ) : null}
          </View>
        </View>

        <PrimaryButton
          label={
            gpsPoint
              ? 'Save Nearby Exploration 🌿'
              : selectedCountry
                ? `Save ${selectedCountry.name} 🌿`
                : 'Save Selected Region 🌿'
          }
          size="lg"
          loading={saving}
          onPress={save}
          disabled={!pickedCountry && !gpsPoint}
        />
        <Text style={styles.note}>
          Results are species recorded by GBIF / iNaturalist contributors in your chosen area — they do
          not guarantee the animal is there right now.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmCream },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  locateCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm },
  locateIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.amberTint, alignItems: 'center', justifyContent: 'center',
  },
  locateTexts: { gap: 3 },
  locateTitle: { ...Typography.subtitle },
  locateBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  nearbyActive: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  nearbyText: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.forestGreen },
  nearbyOff: { fontSize: 13, fontWeight: '800', color: Colors.danger },
  messageOk: { fontSize: 13, fontWeight: '600', color: Colors.forestGreen },
  messageErr: { fontSize: 13, fontWeight: '600', color: Colors.danger },
  group: { gap: Spacing.sm },
  groupTitle: { ...Typography.overline, color: Colors.earthBrown },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'center' },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.pill,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.forestGreen, borderColor: Colors.forestGreen },
  chipText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  chipTextActive: { color: Colors.textOnDark },
  customRadius: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md, paddingVertical: 7, fontSize: 13, fontWeight: '700',
    color: Colors.textPrimary, backgroundColor: Colors.white, minWidth: 74,
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, padding: 0 },
  countryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  countryCell: {
    flexGrow: 1, flexBasis: '30%', minWidth: 100,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.sm,
  },
  countryActive: { borderColor: Colors.forestGreen, backgroundColor: Colors.leafTint },
  pressed: { opacity: 0.9 },
  countryEmoji: { fontSize: 18 },
  countryName: { fontWeight: '700', fontSize: 13, color: Colors.textPrimary, flexShrink: 1 },
  countryNameActive: { color: Colors.forestGreen },
  note: { textAlign: 'center', fontSize: 11, color: Colors.textSecondary, lineHeight: 15 },
});
