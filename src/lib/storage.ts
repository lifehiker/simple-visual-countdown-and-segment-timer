import { SavedTimer, AppSettings, DEFAULT_SETTINGS } from './types';

const KEYS = {
  SAVED_TIMERS: 'bigTimer_savedTimers',
  RECENT_TIMERS: 'bigTimer_recentTimers',
  SETTINGS: 'bigTimer_settings',
  PREMIUM: 'bigTimer_premium',
  COMPLETIONS: 'bigTimer_completions',
} as const;

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

export const storage = {
  getSavedTimers: (): SavedTimer[] => getItem(KEYS.SAVED_TIMERS, []),
  setSavedTimers: (timers: SavedTimer[]) => setItem(KEYS.SAVED_TIMERS, timers),
  getRecentTimers: (): SavedTimer[] => getItem(KEYS.RECENT_TIMERS, []),
  setRecentTimers: (timers: SavedTimer[]) => setItem(KEYS.RECENT_TIMERS, timers),
  getSettings: (): AppSettings => getItem(KEYS.SETTINGS, DEFAULT_SETTINGS),
  setSettings: (settings: AppSettings) => setItem(KEYS.SETTINGS, settings),
  getPremium: (): boolean => getItem(KEYS.PREMIUM, false),
  setPremium: (unlocked: boolean) => setItem(KEYS.PREMIUM, unlocked),
  getCompletions: (): number => getItem(KEYS.COMPLETIONS, 0),
  setCompletions: (count: number) => setItem(KEYS.COMPLETIONS, count),
};
