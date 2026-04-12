import { create } from 'zustand';
import { TimerStatus } from './types';

interface TimerState {
  status: TimerStatus;
  totalSeconds: number;
  remainingSeconds: number;
  endTime: number | null;
  pausedRemaining: number | null;
  setDuration: (seconds: number) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  tick: () => void;
  complete: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  status: 'idle',
  totalSeconds: 0,
  remainingSeconds: 0,
  endTime: null,
  pausedRemaining: null,

  setDuration: (seconds: number) => {
    set({ status: 'idle', totalSeconds: seconds, remainingSeconds: seconds, endTime: null, pausedRemaining: null });
  },

  start: () => {
    const { totalSeconds } = get();
    if (totalSeconds <= 0) return;
    const endTime = Date.now() + totalSeconds * 1000;
    set({ status: 'running', remainingSeconds: totalSeconds, endTime, pausedRemaining: null });
  },

  pause: () => {
    const { endTime } = get();
    if (!endTime) return;
    const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    set({ status: 'paused', remainingSeconds: remaining, pausedRemaining: remaining, endTime: null });
  },

  resume: () => {
    const { pausedRemaining } = get();
    if (pausedRemaining === null || pausedRemaining <= 0) return;
    const endTime = Date.now() + pausedRemaining * 1000;
    set({ status: 'running', endTime, pausedRemaining: null });
  },

  reset: () => {
    set({ status: 'idle', remainingSeconds: get().totalSeconds, endTime: null, pausedRemaining: null });
  },

  tick: () => {
    const { endTime, status } = get();
    if (status !== 'running' || !endTime) return;
    const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    if (remaining <= 0) {
      set({ remainingSeconds: 0 });
      get().complete();
    } else {
      set({ remainingSeconds: remaining });
    }
  },

  complete: () => {
    set({ status: 'completed', remainingSeconds: 0, endTime: null, pausedRemaining: null });
  },
}));
