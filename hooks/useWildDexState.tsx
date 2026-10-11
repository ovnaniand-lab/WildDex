/**
 * Global client state for WildDex: selected region + user discoveries,
 * persisted locally with AsyncStorage.
 *
 * Phase 2 additions (region mode): manual country selection (ISO code),
 * one-shot GPS point (never continuously tracked) and a configurable search
 * radius — all persisted so Explore/Collections can filter live data.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const REGION_KEY = 'wilddex.selectedRegionId';
const DISCOVERIES_KEY = 'wilddex.discoveries';
const ONBOARDED_KEY = 'wilddex.onboarded';

// Phase 2 region keys
const COUNTRY_KEY = 'wilddex.countryCode';
const GPS_KEY = 'wilddex.gpsPoint';
const RADIUS_KEY = 'wilddex.radiusKm';

const DEFAULT_REGION_ID = 'western-europe';
export const DEFAULT_RADIUS_KM = 50;

export interface GpsPoint {
  lat: number;
  lon: number;
}

interface WildDexState {
  /** false while stored values are being restored */
  hydrated: boolean;
  onboarded: boolean;
  selectedRegionId: string;
  discoveries: string[];
  setRegion: (regionId: string) => Promise<void>;
  saveDiscovery: (speciesId: string) => Promise<boolean>;
  hasDiscovery: (speciesId: string) => boolean;
  completeOnboarding: () => Promise<void>;

  /* ---- Phase 2: geographic exploration ---- */
  /** 'gps' when a one-shot location is active, otherwise manual country. */
  regionMode: 'gps' | 'manual';
  selectedCountryCode?: string;
  gpsPoint?: GpsPoint;
  radiusKm: number;
  setSelectedCountry: (code: string, name?: string) => Promise<void>;
  setGpsPoint: (point: GpsPoint) => Promise<void>;
  clearGpsPoint: () => Promise<void>;
  setRadiusKm: (km: number) => Promise<void>;
}

const WildDexContext = createContext<WildDexState | null>(null);

export function WildDexProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [onboarded, setOnboarded] = useState(true);
  const [selectedRegionId, setSelectedRegionId] = useState(DEFAULT_REGION_ID);
  const [discoveries, setDiscoveries] = useState<string[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | undefined>();
  const [gpsPoint, setGpsPointState] = useState<GpsPoint | undefined>();
  const [radiusKm, setRadiusKmState] = useState<number>(DEFAULT_RADIUS_KM);

  useEffect(() => {
    (async () => {
      try {
        const [region, disc, ob, country, gps, radius] = await Promise.all([
          AsyncStorage.getItem(REGION_KEY),
          AsyncStorage.getItem(DISCOVERIES_KEY),
          AsyncStorage.getItem(ONBOARDED_KEY),
          AsyncStorage.getItem(COUNTRY_KEY),
          AsyncStorage.getItem(GPS_KEY),
          AsyncStorage.getItem(RADIUS_KEY),
        ]);
        if (region) setSelectedRegionId(region);
        if (disc) setDiscoveries(JSON.parse(disc) as string[]);
        if (ob === 'true') setOnboarded(true);
        else setOnboarded(false);
        if (country) setSelectedCountryCode(country);
        if (gps) setGpsPointState(JSON.parse(gps) as GpsPoint);
        if (radius) setRadiusKmState(Number(radius) || DEFAULT_RADIUS_KM);
      } catch {
        // Corrupt storage: fall back to defaults rather than crash.
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const setRegion = useCallback(async (regionId: string) => {
    setSelectedRegionId(regionId);
    await AsyncStorage.setItem(REGION_KEY, regionId);
  }, []);

  const saveDiscovery = useCallback(
    async (speciesId: string): Promise<boolean> => {
      let added = false;
      setDiscoveries((prev) => {
        if (prev.includes(speciesId)) return prev;
        added = true;
        const next = [...prev, speciesId];
        void AsyncStorage.setItem(DISCOVERIES_KEY, JSON.stringify(next));
        return next;
      });
      return added;
    },
    [],
  );

  const hasDiscovery = useCallback(
    (speciesId: string) => discoveries.includes(speciesId),
    [discoveries],
  );

  const completeOnboarding = useCallback(async () => {
    setOnboarded(true);
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
  }, []);

  /* ---- Phase 2 setters ---- */

  const setSelectedCountry = useCallback(async (code: string) => {
    setSelectedCountryCode(code);
    // Choosing a country explicitly switches to manual mode.
    setGpsPointState(undefined);
    await AsyncStorage.removeItem(GPS_KEY);
    await AsyncStorage.setItem(COUNTRY_KEY, code);
  }, []);

  const setGpsPoint = useCallback(async (point: GpsPoint) => {
    setGpsPointState(point);
    await AsyncStorage.setItem(GPS_KEY, JSON.stringify(point));
  }, []);

  const clearGpsPoint = useCallback(async () => {
    setGpsPointState(undefined);
    await AsyncStorage.removeItem(GPS_KEY);
  }, []);

  const setRadiusKm = useCallback(async (km: number) => {
    const clamped = Math.min(Math.max(Math.round(km), 5), 500);
    setRadiusKmState(clamped);
    await AsyncStorage.setItem(RADIUS_KEY, String(clamped));
  }, []);

  const regionMode: 'gps' | 'manual' = gpsPoint ? 'gps' : 'manual';

  const value = useMemo<WildDexState>(
    () => ({
      hydrated,
      onboarded,
      selectedRegionId,
      discoveries,
      setRegion,
      saveDiscovery,
      hasDiscovery,
      completeOnboarding,
      regionMode,
      selectedCountryCode,
      gpsPoint,
      radiusKm,
      setSelectedCountry,
      setGpsPoint,
      clearGpsPoint,
      setRadiusKm,
    }),
    [
      hydrated,
      onboarded,
      selectedRegionId,
      discoveries,
      setRegion,
      saveDiscovery,
      hasDiscovery,
      completeOnboarding,
      regionMode,
      selectedCountryCode,
      gpsPoint,
      radiusKm,
      setSelectedCountry,
      setGpsPoint,
      clearGpsPoint,
      setRadiusKm,
    ],
  );

  return <WildDexContext.Provider value={value}>{children}</WildDexContext.Provider>;
}

export function useWildDex(): WildDexState {
  const ctx = useContext(WildDexContext);
  if (!ctx) throw new Error('useWildDex must be used inside <WildDexProvider>');
  return ctx;
}
