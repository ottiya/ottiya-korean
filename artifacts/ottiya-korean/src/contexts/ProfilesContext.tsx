import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { customFetch } from "@workspace/api-client-react";
import type { FavoriteChar, ChildProfile } from "@/hooks/useChildProfile";

export interface StoredProfile {
  id: string;
  name: string;
  favorite: FavoriteChar;
  yearOfBirth?: number;
  createdAt: number;
}

export const MAX_PROFILES = 3;
const PROFILES_KEY = "ottiya-profiles";
const ACTIVE_ID_KEY = "ottiya-active-profile-id";
const LEGACY_PROFILE_KEY = "ottiya-child-profile";
const LEGACY_ID_KEY = "ottiya-child-id";
const VALID_CHARS: FavoriteChar[] = ["koala", "lion", "llama", "panda", "rabbit"];

function genId(): string {
  return `child-${crypto.randomUUID()}`;
}

function readProfiles(): { profiles: StoredProfile[]; activeId: string | null } {
  const raw = localStorage.getItem(PROFILES_KEY);
  if (raw) {
    try {
      const profiles = JSON.parse(raw) as StoredProfile[];
      const activeId = localStorage.getItem(ACTIVE_ID_KEY);
      const validId = profiles.find(p => p.id === activeId)?.id ?? profiles[0]?.id ?? null;
      return { profiles, activeId: validId };
    } catch { return { profiles: [], activeId: null }; }
  }

  // Migrate from legacy single-profile storage
  const legacyRaw = localStorage.getItem(LEGACY_PROFILE_KEY);
  if (legacyRaw) {
    try {
      const lp = JSON.parse(legacyRaw) as ChildProfile;
      const id = localStorage.getItem(LEGACY_ID_KEY) ?? genId();
      const profiles: StoredProfile[] = [{
        id,
        name: lp.name,
        favorite: VALID_CHARS.includes(lp.favorite) ? lp.favorite : "rabbit",
        yearOfBirth: lp.yearOfBirth,
        createdAt: Date.now(),
      }];
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
      localStorage.setItem(ACTIVE_ID_KEY, id);
      return { profiles, activeId: id };
    } catch { return { profiles: [], activeId: null }; }
  }

  return { profiles: [], activeId: null };
}

function persist(profiles: StoredProfile[]) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

function getAuthHeaders(): Record<string, string> {
  const sid = sessionStorage.getItem("ottiya-sid");
  return sid ? { Authorization: `Bearer ${sid}` } : {};
}

// Fire-and-forget: sync a profile to the server so analytics can use birth year
function syncProfileToServer(profile: StoredProfile) {
  customFetch(`/api/children/${profile.id}/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    credentials: "include",
    body: JSON.stringify({
      name: profile.name,
      birthYear: profile.yearOfBirth,
      favoriteChar: profile.favorite,
    }),
  }).catch(() => {
    // Non-critical — localStorage is still source of truth
  });
}

interface ProfilesContextValue {
  profiles: StoredProfile[];
  activeProfile: StoredProfile | null;
  activeProfileId: string;
  isLoaded: boolean;
  canAddMore: boolean;
  addProfile: (p: { name: string; favorite: FavoriteChar; yearOfBirth?: number }) => void;
  switchProfile: (id: string) => void;
  updateActiveProfile: (changes: Partial<Pick<StoredProfile, "name" | "favorite" | "yearOfBirth">>) => void;
}

const ProfilesContext = createContext<ProfilesContextValue | null>(null);

export function ProfilesProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<StoredProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const { profiles: loaded, activeId: id } = readProfiles();
    setProfiles(loaded);
    setActiveId(id);
    if (id) localStorage.setItem(ACTIVE_ID_KEY, id);
    setIsLoaded(true);

    // Sync existing profiles to server on mount (catches returning users)
    loaded.forEach(syncProfileToServer);
  }, []);

  const activeProfile = profiles.find(p => p.id === activeId) ?? null;
  const activeProfileId = activeId ?? "child-default";

  const addProfile = useCallback((p: { name: string; favorite: FavoriteChar; yearOfBirth?: number }) => {
    setProfiles(prev => {
      if (prev.length >= MAX_PROFILES) return prev;
      const newProfile: StoredProfile = { ...p, id: genId(), createdAt: Date.now() };
      const updated = [...prev, newProfile];
      persist(updated);
      setActiveId(newProfile.id);
      localStorage.setItem(ACTIVE_ID_KEY, newProfile.id);
      syncProfileToServer(newProfile);
      return updated;
    });
  }, []);

  const switchProfile = useCallback((id: string) => {
    setActiveId(id);
    localStorage.setItem(ACTIVE_ID_KEY, id);
  }, []);

  const updateActiveProfile = useCallback(
    (changes: Partial<Pick<StoredProfile, "name" | "favorite" | "yearOfBirth">>) => {
      setProfiles(prev => {
        const updated = prev.map(p => (p.id === activeId ? { ...p, ...changes } : p));
        persist(updated);
        const updatedProfile = updated.find(p => p.id === activeId);
        if (updatedProfile) syncProfileToServer(updatedProfile);
        return updated;
      });
    },
    [activeId],
  );

  const value: ProfilesContextValue = {
    profiles,
    activeProfile,
    activeProfileId,
    isLoaded,
    canAddMore: profiles.length < MAX_PROFILES,
    addProfile,
    switchProfile,
    updateActiveProfile,
  };

  return <ProfilesContext.Provider value={value}>{children}</ProfilesContext.Provider>;
}

export function useProfilesContext() {
  const ctx = useContext(ProfilesContext);
  if (!ctx) throw new Error("useProfilesContext must be used within ProfilesProvider");
  return ctx;
}
