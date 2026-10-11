/**
 * Global client state for Phase 1: selected region + user discoveries,
 * persisted locally with AsyncStorage. In Phase 2 this becomes the cache
 * layer in front of real account & region APIs.
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

const DEFAULT_REGION_ID = 'western-europe';

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
}

const WildDexContext = createContext<WildDexState | null>(null);

export function WildDexProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [onboarded, setOnboarded] = useState(true);
  const [selectedRegionId, setSelectedRegionId] = useState(DEFAULT_REGION_ID);
  const [discoveries, setDiscoveries] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [region, disc, ob] = await Promise.all([
          AsyncStorage.getItem(REGION_KEY),
          AsyncStorage.getItem(DISCOVERIES_KEY),
          AsyncStorage.getItem(ONBOARDED_KEY),
        ]);
        if (region) setSelectedRegionId(region);
        if (disc) setDiscoveries(JSON.parse(disc) as string[]);
        if (ob === 'true') setOnboarded(true);
        else setOnboarded(false);
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

  const value = useMemo<WildDexState>(
    () => ({ hydrated, onboarded, selectedRegionId, discoveries, setRegion, saveDiscovery, hasDiscovery, completeOnboarding }),
    [hydrated, onboarded, selectedRegionId, discoveries, setRegion, saveDiscovery, hasDiscovery, completeOnboarding],
  );

  return <WildDexContext.Provider value={value}>{children}</WildDexContext.Provider>;
}

export function useWildDex(): WildDexState {
  const ctx = useContext(WildDexContext);
  if (!ctx) throw new Error('useWildDex must be used inside WildDexProvider');
  return ctx;
}
