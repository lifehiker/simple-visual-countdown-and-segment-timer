export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';
export type TimerMode = 'countdown' | 'segments' | 'intervals';
export type ThemeMode = 'system' | 'light' | 'dark';

export interface TimerPreset {
  label: string;
  seconds: number;
}

export interface SegmentItem {
  id: string;
  label: string;
  durationSeconds: number;
}

export interface SegmentSession {
  id: string;
  name: string;
  segments: SegmentItem[];
}

export interface IntervalSession {
  id: string;
  name: string;
  warmupSeconds: number;
  workSeconds: number;
  restSeconds: number;
  rounds: number;
  cooldownSeconds: number;
}

export type IntervalPhase = 'warmup' | 'work' | 'rest' | 'cooldown' | 'completed';

export interface SavedTimer {
  id: string;
  name: string;
  type: TimerMode;
  durationSeconds?: number;
  segmentSession?: SegmentSession;
  intervalSession?: IntervalSession;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  halfwayAlert: boolean;
  finalCountdownTick: boolean;
  keepScreenAwake: boolean;
  theme: ThemeMode;
}

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  halfwayAlert: false,
  finalCountdownTick: true,
  keepScreenAwake: true,
  theme: 'system',
};

export const TIMER_PRESETS: TimerPreset[] = [
  { label: '1m', seconds: 60 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '15m', seconds: 900 },
  { label: '25m', seconds: 1500 },
  { label: '30m', seconds: 1800 },
  { label: '45m', seconds: 2700 },
  { label: '60m', seconds: 3600 },
];

export const MAX_FREE_SAVED_TIMERS = 3;
