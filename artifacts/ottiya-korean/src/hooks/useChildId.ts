import { useProfilesContext } from "@/contexts/ProfilesContext";

/** Returns the active child's unique ID (used as the API childId). */
export function useChildId() {
  const { activeProfileId } = useProfilesContext();
  return activeProfileId;
}
