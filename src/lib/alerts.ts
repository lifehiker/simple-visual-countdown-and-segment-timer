let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export function playBeep(frequency = 880, duration = 0.15, count = 1): void {
  try {
    const ctx = getAudioContext();
    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = frequency;
      osc.type = 'sine';
      const startTime = ctx.currentTime + i * (duration + 0.08);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    }
  } catch {
    // audio not available
  }
}

export function playCompletionSound(): void {
  playBeep(880, 0.2, 3);
}

export function playTickSound(): void {
  playBeep(660, 0.05, 1);
}

export function playHalfwaySound(): void {
  playBeep(440, 0.15, 2);
}

export function vibrate(pattern: number | number[] = 200): void {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // vibration not available
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function sendNotification(title: string, body: string): void {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  } catch {
    // notification not available
  }
}

export async function requestWakeLock(): Promise<WakeLockSentinel | null> {
  try {
    if ('wakeLock' in navigator) {
      return await navigator.wakeLock.request('screen');
    }
  } catch {
    // wake lock not available
  }
  return null;
}
