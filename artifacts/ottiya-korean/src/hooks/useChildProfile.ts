import { useProfilesContext } from "@/contexts/ProfilesContext";

export type FavoriteChar = "koala" | "lion" | "llama" | "panda" | "rabbit";

export interface ChildProfile {
  name: string;
  favorite: FavoriteChar;
  yearOfBirth?: number;
}

/** Thin wrapper — delegates to the shared ProfilesContext. */
export function useChildProfile() {
  const { activeProfile, isLoaded, updateActiveProfile } = useProfilesContext();

  const profile: ChildProfile | null = activeProfile
    ? { name: activeProfile.name, favorite: activeProfile.favorite, yearOfBirth: activeProfile.yearOfBirth }
    : null;

  const saveProfile = (p: ChildProfile) => updateActiveProfile(p);

  return { profile, isLoaded, saveProfile };
}
