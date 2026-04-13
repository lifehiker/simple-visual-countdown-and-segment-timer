'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, ChevronDown, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useTimerStore } from '@/lib/timer-store';
import { useSettingsStore } from '@/lib/settings-store';
import { useLibraryStore } from '@/lib/library-store';
import type { SavedTimer } from '@/lib/types';
import { formatTime } from '@/lib/format';
import { playCompletionSound, playTickSound, playHalfwaySound, vibrate, requestWakeLock } from '@/lib/alerts';
import { TIMER_PRESETS } from '@/lib/types';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { FullscreenButton } from '@/components/FullscreenButton';

export default function HomePage() {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerHours, setPickerHours] = useState(0);
  const [pickerMinutes, setPickerMinutes] = useState(5);
  const [pickerSeconds, setPickerSeconds] = useState(0);
  const timer = useTimerStore();
  const settings = useSettingsStore();
  const library = useLibraryStore();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const halfwayAlertedRef = useRef(false);
  const pct = timer.totalSeconds > 0 ? timer.remainingSeconds / timer.totalSeconds : 1;
  const isWarning = pct <= 0.2 && timer.remainingSeconds > 10;
  const isCritical = timer.remainingSeconds <= 10 && (timer.status === 'running' || timer.status === 'paused');
  const isPulsing = timer.remainingSeconds <= 5 && timer.status === 'running';
  const timeColor = isCritical ? 'var(--critical)' : isWarning ? 'var(--warning)' : 'var(--text-primary)';
  const glowClass = timer.status === 'completed' ? 'glow-success' : isCritical ? 'glow-critical' : isWarning ? 'glow-warning' : (timer.status === 'running' || timer.status === 'paused') ? 'glow-accent' : '';
  useEffect(() => {
    if (timer.status !== 'running') {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => { timer.tick(); }, 100);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [timer.status, timer.tick]);
  useEffect(() => {
    if (timer.status === 'running' && timer.totalSeconds > 0 && timer.remainingSeconds <= Math.floor(timer.totalSeconds / 2) && !halfwayAlertedRef.current && settings.halfwayAlert && settings.soundEnabled) {
      halfwayAlertedRef.current = true;
      playHalfwaySound();
    }
  }, [timer.remainingSeconds, timer.status, timer.totalSeconds, settings.halfwayAlert, settings.soundEnabled]);

  useEffect(() => {
    if (timer.status === 'running' && timer.remainingSeconds <= 10 && timer.remainingSeconds > 0 && settings.soundEnabled && settings.finalCountdownTick) {
      playTickSound();
    }
  }, [timer.remainingSeconds, timer.status, settings.soundEnabled, settings.finalCountdownTick]);

  useEffect(() => {
    if (timer.status !== 'completed') return;
    if (settings.soundEnabled) playCompletionSound();
    if (settings.vibrationEnabled) vibrate([200, 100, 200]);
    settings.incrementCompletions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.status]);

  useEffect(() => {
    if (timer.status === 'running' && settings.keepScreenAwake) {
      requestWakeLock().then((lock) => { wakeLockRef.current = lock; });
    } else {
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    }
    return () => { wakeLockRef.current?.release(); wakeLockRef.current = null; };
  }, [timer.status, settings.keepScreenAwake]);

  const applyPreset = (seconds: number) => {
    timer.setDuration(seconds);
    halfwayAlertedRef.current = false;
    setShowPicker(false);
    setPickerHours(Math.floor(seconds / 3600));
    setPickerMinutes(Math.floor((seconds % 3600) / 60));
    setPickerSeconds(seconds % 60);
  };

  const applyPicker = () => {
    const total = pickerHours * 3600 + pickerMinutes * 60 + pickerSeconds;
    if (total > 0) { timer.setDuration(total); halfwayAlertedRef.current = false; }
    setShowPicker(false);
  };

  const handleStart = () => { halfwayAlertedRef.current = false; timer.start(); };
  const handleReset = () => { halfwayAlertedRef.current = false; timer.reset(); };

  const handleToggle = useCallback(() => {
    if (timer.status === 'idle' && timer.totalSeconds > 0) { halfwayAlertedRef.current = false; timer.start(); }
    else if (timer.status === 'running') { timer.pause(); }
    else if (timer.status === 'paused') { timer.resume(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.status, timer.totalSeconds, timer.pause, timer.resume, timer.start]);

  useKeyboardShortcuts({ onToggle: handleToggle, onReset: handleReset });
  const progressPercent = timer.totalSeconds > 0 ? (timer.remainingSeconds / timer.totalSeconds) * 100 : 0;
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressPercent / 100);
  const strokeColor = isCritical ? 'var(--critical)' : isWarning ? 'var(--warning)' : 'var(--accent)';
  return (
    <div className="mx-auto max-w-lg px-4 pt-6 animate-fade-in">
      <div className="flex justify-end mb-3">
        <FullscreenButton />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
        {TIMER_PRESETS.map((preset) => (
          <button key={preset.seconds} onClick={() => applyPreset(preset.seconds)} className="shrink-0 px-4 py-2 text-sm font-semibold transition-all duration-200 hover:opacity-90" style={{ background: timer.totalSeconds === preset.seconds && timer.status === 'idle' ? 'var(--accent)' : 'var(--bg-card)', color: timer.totalSeconds === preset.seconds && timer.status === 'idle' ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            {preset.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center mb-6">
        <div className={"relative flex items-center justify-center transition-all duration-500 " + glowClass + (isPulsing ? ' animate-pulse-critical' : '')} style={{ width: 300, height: 300, borderRadius: '50%', background: 'var(--bg-card)', cursor: timer.status === 'idle' ? 'pointer' : 'default' }} onClick={() => { if (timer.status === 'idle') setShowPicker(true); }} title={timer.status === 'idle' ? 'Click to set duration' : undefined}>
          <svg className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }} width={300} height={300} viewBox="0 0 300 300">
            <circle cx={150} cy={150} r={radius} fill="none" stroke="var(--border)" strokeWidth={8} />
            {timer.totalSeconds > 0 && timer.status !== 'idle' && (
              <circle cx={150} cy={150} r={radius} fill="none" stroke={strokeColor} strokeWidth={8} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.5s ease' }} />
            )}
          </svg>
          <div className="flex flex-col items-center gap-1 z-10">
            <span className="timer-display font-bold" style={{ fontSize: '3.5rem', color: timeColor, transition: 'color 0.5s ease' }}>
              {timer.totalSeconds === 0 ? '00:00' : formatTime(timer.remainingSeconds)}
            </span>
            {timer.status === 'idle' && timer.totalSeconds === 0 && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <ChevronDown size={14} /> Set duration
              </span>
            )}
            {timer.status === 'completed' && (
              <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>Complete!</span>
            )}
          </div>
        </div>
      </div>
      {showPicker && (
        <div className="mb-6 p-4 animate-slide-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <p className="text-sm font-medium mb-4 text-center" style={{ color: 'var(--text-secondary)' }}>Set Duration</p>
          <div className="flex items-center justify-center gap-3">
            <div className="flex flex-col items-center gap-1"><input type="number" min={0} max={23} value={pickerHours} onChange={(e) => setPickerHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))} className="w-16 text-center py-2 text-xl font-mono font-bold outline-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>hr</span></div>
            <span className="text-2xl font-bold pb-5" style={{ color: 'var(--text-muted)' }}>:</span>
            <div className="flex flex-col items-center gap-1"><input type="number" min={0} max={59} value={pickerMinutes} onChange={(e) => setPickerMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))} className="w-16 text-center py-2 text-xl font-mono font-bold outline-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>min</span></div>
            <span className="text-2xl font-bold pb-5" style={{ color: 'var(--text-muted)' }}>:</span>
            <div className="flex flex-col items-center gap-1"><input type="number" min={0} max={59} value={pickerSeconds} onChange={(e) => setPickerSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))} className="w-16 text-center py-2 text-xl font-mono font-bold outline-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>sec</span></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowPicker(false)} className="flex-1 py-2.5 text-sm font-medium transition-all hover:opacity-80" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>Cancel</button>
            <button onClick={applyPicker} disabled={pickerHours + pickerMinutes + pickerSeconds === 0} className="flex-1 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-30" style={{ background: 'var(--accent)', borderRadius: 'var(--radius)' }}>Set Timer</button>
          </div>
        </div>
      )}
      {showSaveDialog && (
        <div className="mb-6 p-4 animate-slide-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <p className="text-sm font-medium mb-4 text-center" style={{ color: 'var(--text-secondary)' }}>Save Timer</p>
          <input
            type="text"
            placeholder={`${formatTime(timer.totalSeconds)} Timer`}
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            className="w-full px-3 py-2 text-sm outline-none mb-3"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
          />
          <div className="flex gap-2">
            <button onClick={() => setShowSaveDialog(false)} className="flex-1 py-2.5 text-sm font-medium transition-all hover:opacity-80" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>Cancel</button>
            <button
              onClick={() => {
                const savedTimer: SavedTimer = {
                  id: uuidv4(),
                  name: saveName || `${formatTime(timer.totalSeconds)} Timer`,
                  type: 'countdown',
                  durationSeconds: timer.totalSeconds,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                const success = library.saveTimer(savedTimer, settings.isPremium);
                if (!success) alert('Free tier limit reached. Upgrade to save more timers.');
                setShowSaveDialog(false);
              }}
              className="flex-1 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--accent)', borderRadius: 'var(--radius)' }}
            >Save</button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={handleReset} className="flex items-center justify-center w-12 h-12 rounded-full transition-all hover:opacity-80" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }} title="Reset"><RotateCcw size={20} /></button>
        <button
          onClick={() => { if (timer.totalSeconds > 0) { setSaveName(''); setShowSaveDialog(true); } }}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:opacity-80"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          title="Save timer"
        >
          <Save size={16} />
        </button>
        {timer.status === 'idle' && (<button onClick={handleStart} disabled={timer.totalSeconds === 0} className="flex items-center justify-center w-20 h-20 rounded-full text-white transition-all hover:opacity-90 disabled:opacity-30" style={{ background: 'var(--accent)' }} title="Start"><Play size={32} className="ml-1" /></button>)}
        {timer.status === 'running' && (<button onClick={timer.pause} className="flex items-center justify-center w-20 h-20 rounded-full text-white transition-all hover:opacity-90" style={{ background: 'var(--accent)' }} title="Pause"><Pause size={32} /></button>)}
        {timer.status === 'paused' && (<button onClick={timer.resume} className="flex items-center justify-center w-20 h-20 rounded-full text-white transition-all hover:opacity-90" style={{ background: 'var(--accent)' }} title="Resume"><Play size={32} className="ml-1" /></button>)}
        {timer.status === 'completed' && (<button onClick={handleReset} className="flex items-center justify-center gap-2 px-6 py-4 rounded-full text-white font-semibold transition-all hover:opacity-90" style={{ background: 'var(--success)' }}><RotateCcw size={20} /> Again</button>)}
        <div className="w-12 h-12" />
      </div>
      {timer.totalSeconds > 0 && timer.status !== 'idle' && (
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
          <div className="h-full rounded-full transition-all duration-300" style={{ width: progressPercent + '%', background: isCritical ? 'var(--critical)' : isWarning ? 'var(--warning)' : 'var(--accent)' }} />
        </div>
      )}
    </div>
  );
}
