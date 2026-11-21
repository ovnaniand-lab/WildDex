
/**
 * Global client state for WildDex.
 * Region settings and discoveries are persisted locally.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const REGION_KEY = 'wilddex.selectedRegionId';
const DISCOVERIES_KEY = 'wilddex.discoveries';
const DISCOVERY_RECORDS_KEY = 'wilddex.discoveryRecords';
const PROFILE_KEY = 'wilddex.profile';
const PROFILE_PHOTO_FOLDER = 'profile';
const ONBOARDED_KEY = 'wilddex.onboarded';

const COUNTRY_KEY = 'wilddex.countryCode';
const GPS_KEY = 'wilddex.gpsPoint';
const RADIUS_KEY = 'wilddex.radiusKm';

const DEFAULT_REGION_ID = 'western-europe';
export const DEFAULT_RADIUS_KM = 50;

const DISCOVERY_PHOTO_FOLDER = 'discoveries';

export interface GpsPoint {
  lat: number;
  lon: number;
}

export interface DiscoveryRecord {
  id: string;
  speciesId: string;
  scientificName: string;
  commonName: string | null;
  photoUri?: string;
  date: string;
  location?: GpsPoint;
  source: 'plantnet' | 'encyclopedia';
  categoryId?: string;
}

export interface PersonalProfile {
  nickname: string;
  avatarUri?: string;
}

export interface SaveDiscoveryRecordInput {
  speciesId: string;
  scientificName: string;
  commonName?: string | null;
  photoUri?: string;
  date?: string;
  location?: GpsPoint;
  source: 'plantnet' | 'encyclopedia';
  categoryId?: string;
}

interface WildDexState {
  profile: PersonalProfile;
  updateProfile: (updates: Partial<PersonalProfile>) => Promise<void>;
  saveProfileAvatar: (sourceUri: string) => Promise<void>;
  hydrated: boolean;
  onboarded: boolean;
  selectedRegionId: string;
  discoveries: string[];
  discoveryRecords: DiscoveryRecord[];
  setRegion: (regionId: string) => Promise<void>;
  saveDiscovery: (speciesId: string) => Promise<boolean>;
  saveDiscoveryRecord: (
    input: SaveDiscoveryRecordInput,
  ) => Promise<DiscoveryRecord>;
  hasDiscovery: (speciesId: string) => boolean;
  completeOnboarding: () => Promise<void>;

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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isDiscoveryRecordArray(value: unknown): value is DiscoveryRecord[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.speciesId === 'string' &&
        typeof item.scientificName === 'string' &&
        typeof item.date === 'string',
    )
  );
}

function isManagedPhoto(uri?: string): boolean {
  if (!uri) return false;
  const directory = new Directory(Paths.document, DISCOVERY_PHOTO_FOLDER);
  return uri.startsWith(directory.uri);
}

async function copyDiscoveryPhoto(
  sourceUri: string,
  speciesId: string,
): Promise<string> {
  const source = new File(sourceUri);

  if (!source.exists) {
    throw new Error('The selected photo is no longer available. Please choose it again.');
  }

  const directory = new Directory(Paths.document, DISCOVERY_PHOTO_FOLDER);
  directory.create({ intermediates: true, idempotent: true });

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const extension = allowedExtensions.includes(source.extension.toLowerCase())
    ? source.extension.toLowerCase()
    : '.jpg';

  const safeSpeciesId = speciesId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeSpeciesId}-${Date.now()}${extension}`;
  const destination = new File(directory, filename);

  await source.copy(destination);
  return destination.uri;
}

export function WildDexProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [onboarded, setOnboarded] = useState(true);
  const [selectedRegionId, setSelectedRegionId] = useState(DEFAULT_REGION_ID);
  const [discoveries, setDiscoveries] = useState<string[]>([]);
  const [discoveryRecords, setDiscoveryRecords] = useState<DiscoveryRecord[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | undefined>();
  const [gpsPoint, setGpsPointState] = useState<GpsPoint | undefined>();
  const [radiusKm, setRadiusKmState] = useState<number>(DEFAULT_RADIUS_KM);
  const [profile, setProfile] = useState<PersonalProfile>({
  nickname: 'Nature Explorer',
});
  const discoveriesRef = useRef<string[]>([]);
  const recordsRef = useRef<DiscoveryRecord[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [region, disc, records, ob, country, gps, radius, savedProfile] =
  await Promise.all([
    AsyncStorage.getItem(REGION_KEY),
    AsyncStorage.getItem(DISCOVERIES_KEY),
    AsyncStorage.getItem(DISCOVERY_RECORDS_KEY),
    AsyncStorage.getItem(ONBOARDED_KEY),
    AsyncStorage.getItem(COUNTRY_KEY),
    AsyncStorage.getItem(GPS_KEY),
    AsyncStorage.getItem(RADIUS_KEY),
    AsyncStorage.getItem(PROFILE_KEY),
  ]);

        if (region) setSelectedRegionId(region);

        if (disc) {
          const parsed: unknown = JSON.parse(disc);
          if (isStringArray(parsed)) {
            discoveriesRef.current = parsed;
            setDiscoveries(parsed);
          }
        }

        if (records) {
          const parsed: unknown = JSON.parse(records);
          if (isDiscoveryRecordArray(parsed)) {
            recordsRef.current = parsed;
            setDiscoveryRecords(parsed);
          }
        }

        setOnboarded(ob === 'true');

        if (country) setSelectedCountryCode(country);
        if (gps) setGpsPointState(JSON.parse(gps) as GpsPoint);
        if (radius) setRadiusKmState(Number(radius) || DEFAULT_RADIUS_KM);
                if (savedProfile) {
          const parsed: unknown = JSON.parse(savedProfile);

          if (
            parsed &&
            typeof parsed === 'object' &&
            'nickname' in parsed &&
            typeof parsed.nickname === 'string'
          ) {
            setProfile(parsed as PersonalProfile);
          }
        }
      } catch {
        // Corrupt storage: fall back to defaults rather than crash.
      } finally {
        setHydrated(true);
      }
    })();
  }, []);
const updateProfile = useCallback(
  async (updates: Partial<PersonalProfile>) => {
    const nextProfile = { ...profile, ...updates };

    await AsyncStorage.setItem(
      PROFILE_KEY,
      JSON.stringify(nextProfile),
    );

    setProfile(nextProfile);
  },
  [profile],
);

const saveProfileAvatar = useCallback(
  async (sourceUri: string) => {
    const source = new File(sourceUri);

    if (!source.exists) {
      throw new Error('The selected photo is no longer available.');
    }

    const directory = new Directory(
      Paths.document,
      PROFILE_PHOTO_FOLDER,
    );

    directory.create({ intermediates: true, idempotent: true });

    const extension = ['.jpg', '.jpeg', '.png', '.webp'].includes(
      source.extension.toLowerCase(),
    )
      ? source.extension.toLowerCase()
      : '.jpg';

    const destination = new File(
      directory,
      `avatar-${Date.now()}${extension}`,
    );

    await source.copy(destination);

    try {
      await updateProfile({ avatarUri: destination.uri });

      if (profile.avatarUri?.startsWith(directory.uri)) {
        const oldAvatar = new File(profile.avatarUri);

        if (oldAvatar.exists) {
          oldAvatar.delete();
        }
      }
    } catch (error) {
      if (destination.exists) {
        destination.delete();
      }

      throw error;
    }
  },
  [profile.avatarUri, updateProfile],
);
  const setRegion = useCallback(async (regionId: string) => {
    setSelectedRegionId(regionId);
    await AsyncStorage.setItem(REGION_KEY, regionId);
  }, []);

  // Retained for existing encyclopedia discovery saves.
  const saveDiscovery = useCallback(async (speciesId: string): Promise<boolean> => {
    const current = discoveriesRef.current;

    if (current.includes(speciesId)) return false;

    const next = [...current, speciesId];

    await AsyncStorage.setItem(DISCOVERIES_KEY, JSON.stringify(next));

    discoveriesRef.current = next;
    setDiscoveries(next);
    return true;
  }, []);

  // Saves a detailed record, updating the existing record for the same species.
  const saveDiscoveryRecord = useCallback(
    async (input: SaveDiscoveryRecordInput): Promise<DiscoveryRecord> => {
      const previousRecords = recordsRef.current;
      const previous = previousRecords.find(
        (record) => record.speciesId === input.speciesId,
      );

      let newPhotoUri: string | undefined;

      try {
        if (input.photoUri) {
          newPhotoUri = await copyDiscoveryPhoto(
            input.photoUri,
            input.speciesId,
          );
        }

        const record: DiscoveryRecord = {
          id: input.speciesId,
          speciesId: input.speciesId,
          scientificName: input.scientificName,
          commonName: input.commonName ?? previous?.commonName ?? null,
          photoUri: newPhotoUri ?? previous?.photoUri,
          date: input.date ?? new Date().toISOString(),
          location: input.location ?? previous?.location,
          source: input.source,
          categoryId: input.categoryId ?? previous?.categoryId,
        };

        const nextRecords = previous
          ? previousRecords.map((item) =>
              item.speciesId === input.speciesId ? record : item,
            )
          : [...previousRecords, record];

        const currentDiscoveries = discoveriesRef.current;
        const nextDiscoveries = currentDiscoveries.includes(input.speciesId)
          ? currentDiscoveries
          : [...currentDiscoveries, input.speciesId];

        await AsyncStorage.multiSet([
          [DISCOVERY_RECORDS_KEY, JSON.stringify(nextRecords)],
          [DISCOVERIES_KEY, JSON.stringify(nextDiscoveries)],
        ]);

        recordsRef.current = nextRecords;
        discoveriesRef.current = nextDiscoveries;
        setDiscoveryRecords(nextRecords);
        setDiscoveries(nextDiscoveries);

        // Remove the previous app-managed photo only after the new record
        // has been saved successfully.
        if (
          newPhotoUri &&
          previous?.photoUri &&
          previous.photoUri !== newPhotoUri &&
          isManagedPhoto(previous.photoUri)
        ) {
          try {
            const oldPhoto = new File(previous.photoUri);
            if (oldPhoto.exists) oldPhoto.delete();
          } catch {
            // An unused old photo is preferable to failing a successful save.
          }
        }

        return record;
      } catch (error) {
        // Clean up a newly copied photo if saving its record failed.
        if (newPhotoUri) {
          try {
            const copiedPhoto = new File(newPhotoUri);
            if (copiedPhoto.exists) copiedPhoto.delete();
          } catch {
            // Ignore cleanup errors; preserve the original save error.
          }
        }

        throw error;
      }
    },
    [],
  );

  const discoverySet = useMemo(
    () => new Set(discoveries),
    [discoveries],
  );

  const hasDiscovery = useCallback(
    (speciesId: string) => discoverySet.has(speciesId),
    [discoverySet],
  );

  const completeOnboarding = useCallback(async () => {
    setOnboarded(true);
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
  }, []);

  const setSelectedCountry = useCallback(async (code: string) => {
    setSelectedCountryCode(code);
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
      profile,
      updateProfile,
      saveProfileAvatar,
      hydrated,
      onboarded,
      selectedRegionId,
      discoveries,
      discoveryRecords,
      setRegion,
      saveDiscovery,
      saveDiscoveryRecord,
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
      profile,
      updateProfile,
      saveProfileAvatar,
      hydrated,
      onboarded,
      selectedRegionId,
      discoveries,
      discoveryRecords,
      setRegion,
      saveDiscovery,
      saveDiscoveryRecord,
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

  return (
  <WildDexContext.Provider value={value}>
    {children}
  </WildDexContext.Provider>
);
}

export function useWildDex(): WildDexState {
  const ctx = useContext(WildDexContext);
  if (!ctx) throw new Error('useWildDex must be used inside <WildDexProvider>');
  return ctx;
}
