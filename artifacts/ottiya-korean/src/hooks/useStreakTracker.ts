import { useCallback } from "react";

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getStoredDates(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

/** Pass the active profileId so each child has their own streak. */
export function useStreakTracker(profileId?: string) {
  const key = profileId ? `ottiya-streak-${profileId}` : "ottiya-streak-dates";

  const markToday = useCallback(() => {
    const today = getTodayStr();
    const dates = getStoredDates(key);
    if (!dates.has(today)) {
      dates.add(today);
      localStorage.setItem(key, JSON.stringify([...dates]));
    }
  }, [key]);

  const storedDates = getStoredDates(key);
  const today = new Date();

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const labels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    return { label: labels[d.getDay()], dateStr, active: storedDates.has(dateStr) };
  });

  let streakCount = 0;
  const checkDate = new Date(today);
  while (storedDates.has(checkDate.toISOString().slice(0, 10))) {
    streakCount++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return { markToday, weekDays, streakCount };
}
