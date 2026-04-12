import { create } from 'zustand';
import { SavedTimer, MAX_FREE_SAVED_TIMERS } from './types';
import { storage } from './storage';

interface LibraryState {
  savedTimers: SavedTimer[];
  recentTimers: SavedTimer[];
  hydrated: boolean;
  hydrate: () => void;
  saveTimer: (timer: SavedTimer, isPremium: boolean) => boolean;
  deleteTimer: (id: string) => void;
  updateTimer: (timer: SavedTimer) => void;
  addRecent: (timer: SavedTimer) => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  savedTimers: [],
  recentTimers: [],
  hydrated: false,

  hydrate: () => {
    set({
      savedTimers: storage.getSavedTimers(),
      recentTimers: storage.getRecentTimers(),
      hydrated: true,
    });
  },

  saveTimer: (timer: SavedTimer, isPremium: boolean) => {
    const { savedTimers } = get();
    if (!isPremium && savedTimers.length >= MAX_FREE_SAVED_TIMERS) return false;
    const updated = [...savedTimers, timer];
    set({ savedTimers: updated });
    storage.setSavedTimers(updated);
    return true;
  },

  deleteTimer: (id: string) => {
    const updated = get().savedTimers.filter((t) => t.id !== id);
    set({ savedTimers: updated });
    storage.setSavedTimers(updated);
  },

  updateTimer: (timer: SavedTimer) => {
    const updated = get().savedTimers.map((t) => (t.id === timer.id ? timer : t));
    set({ savedTimers: updated });
    storage.setSavedTimers(updated);
  },

  addRecent: (timer: SavedTimer) => {
    const { recentTimers } = get();
    const filtered = recentTimers.filter((t) => t.id !== timer.id);
    const updated = [timer, ...filtered].slice(0, 5);
    set({ recentTimers: updated });
    storage.setRecentTimers(updated);
  },
}));
