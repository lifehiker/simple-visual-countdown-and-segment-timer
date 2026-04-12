import { create } from 'zustand';
import { AppSettings, DEFAULT_SETTINGS, ThemeMode } from './types';
import { storage } from './storage';

interface SettingsState extends AppSettings {
  isPremium: boolean;
  completionCount: number;
  hydrated: boolean;
  hydrate: () => void;
  toggleSound: () => void;
  toggleVibration: () => void;
  toggleHalfwayAlert: () => void;
  toggleFinalCountdownTick: () => void;
  toggleKeepScreenAwake: () => void;
  setTheme: (theme: ThemeMode) => void;
  setPremium: (unlocked: boolean) => void;
  incrementCompletions: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  isPremium: false,
  completionCount: 0,
  hydrated: false,

  hydrate: () => {
    const settings = storage.getSettings();
    const isPremium = storage.getPremium();
    const completionCount = storage.getCompletions();
    set({ ...settings, isPremium, completionCount, hydrated: true });
  },

  toggleSound: () => {
    const next = !get().soundEnabled;
    set({ soundEnabled: next });
    storage.setSettings({ ...storage.getSettings(), soundEnabled: next });
  },
  toggleVibration: () => {
    const next = !get().vibrationEnabled;
    set({ vibrationEnabled: next });
    storage.setSettings({ ...storage.getSettings(), vibrationEnabled: next });
  },
  toggleHalfwayAlert: () => {
    const next = !get().halfwayAlert;
    set({ halfwayAlert: next });
    storage.setSettings({ ...storage.getSettings(), halfwayAlert: next });
  },
  toggleFinalCountdownTick: () => {
    const next = !get().finalCountdownTick;
    set({ finalCountdownTick: next });
    storage.setSettings({ ...storage.getSettings(), finalCountdownTick: next });
  },
  toggleKeepScreenAwake: () => {
    const next = !get().keepScreenAwake;
    set({ keepScreenAwake: next });
    storage.setSettings({ ...storage.getSettings(), keepScreenAwake: next });
  },
  setTheme: (theme: ThemeMode) => {
    set({ theme });
    storage.setSettings({ ...storage.getSettings(), theme });
  },
  setPremium: (unlocked: boolean) => {
    set({ isPremium: unlocked });
    storage.setPremium(unlocked);
  },
  incrementCompletions: () => {
    const next = get().completionCount + 1;
    set({ completionCount: next });
    storage.setCompletions(next);
  },
}));
