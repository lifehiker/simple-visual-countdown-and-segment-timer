'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Save, Maximize2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useTimerStore } from '@/lib/timer-store';
import { useSettingsStore } from '@/lib/settings-store';
import { useLibraryStore } from '@/lib/library-store';
import type { SavedTimer } from '@/lib/types';
import { formatTime } from '@/lib/format';
import { playCompletionSound, playTickSound, playHalfwaySound, vibrate, requestWakeLock } from '@/lib/alerts';
import { TIMER_PRESETS } from '@/lib/types';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function HomePage() {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerHours, setPickerHours] = useState(0);
  const [pickerMinutes, setPickerMinutes] = useState(5);
  const [pickerSeconds, setPickerSeconds] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const timer = useTimerStore();
  const settings = useSettingsStore();
  const library = useLibraryStore();
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const halfwayAlertedRef = useRef(false);

  const pct = timer.totalSeconds > 0 ? timer.remainingSeconds / timer.totalSeconds : 1;
  const isWarning = pct <= 0.2 && timer.remainingSeconds > 10;
  const isCritical = timer.remainingSeconds <= 10 && (timer.status === 'running' || timer.status === 'paused');
  const isPulsing = timer.remainingSeconds <= 5 && timer.status === 'running';
  const progressPercent = timer.totalSeconds > 0 ? (timer.remainingSeconds / timer.totalSeconds) * 100 : 100;

  const timeColor = isCritical ? 'var(--critical)' : isWarning ? 'var(--warning)' : 'var(--text-primary)';

  useEffect(() => {
    if (timer.status !== 'running') { if (tickRef.current) clearInterval(tickRef.current); return; }
    tickRef.current = setInterval(() => { timer.tick(); }, 100);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.status, timer.tick]);

  useEffect(() => {
    if (timer.status === 'running' && timer.totalSeconds > 0 && timer.remainingSeconds <= Math.floor(timer.totalSeconds / 2) && !halfwayAlertedRef.current && settings.halfwayAlert && settings.soundEnabled) {
      halfwayAlertedRef.current = true; playHalfwaySound();
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
    } else { wakeLockRef.current?.release(); wakeLockRef.current = null; }
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

  const handleReset = () => { halfwayAlertedRef.current = false; timer.reset(); setShowPicker(false); };

  const handleToggle = useCallback(() => {
    if (timer.status === 'idle' && timer.totalSeconds > 0) { halfwayAlertedRef.current = false; timer.start(); }
    else if (timer.status === 'running') { timer.pause(); }
    else if (timer.status === 'paused') { timer.resume(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.status, timer.totalSeconds, timer.pause, timer.resume, timer.start]);

  useKeyboardShortcuts({ onToggle: handleToggle, onReset: handleReset });

  const handleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3rem)] px-8 select-none">

      {/* Preset pills */}
      <div className="flex items-center gap-2 mb-10 flex-wrap justify-center">
        {TIMER_PRESETS.map((preset) => {
          const active = timer.totalSeconds === preset.seconds && timer.status === 'idle';
          return (
            <button
              key={preset.seconds}
              onClick={() => applyPreset(preset.seconds)}
              className="px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-150 hover:opacity-90"
              style={{
                background: active ? 'var(--accent)' : 'var(--bg-card)',
                color: active ? 'white' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              {preset.label}
            </button>
          );
        })}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-150 hover:opacity-90"
          style={{ background: showPicker ? 'var(--accent)' : 'var(--bg-card)', color: showPicker ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          Custom
        </button>
      </div>

      {/* Custom duration picker */}
      {showPicker && (
        <div className="mb-10 p-6 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-end gap-3 justify-center">
            {[
              { label: 'hr', value: pickerHours, max: 23, set: setPickerHours },
              { label: 'min', value: pickerMinutes, max: 59, set: setPickerMinutes },
              { label: 'sec', value: pickerSeconds, max: 59, set: setPickerSeconds },
            ].map(({ label, value, max, set }, i) => (
              <div key={label} className="flex items-end gap-3">
                {i > 0 && <span className="text-3xl font-light mb-3" style={{ color: 'var(--border)' }}>:</span>}
                <div className="flex flex-col items-center gap-1">
                  <input
                    type="number" min={0} max={max} value={value}
                    onChange={(e) => set(Math.max(0, Math.min(max, parseInt(e.target.value) || 0)))}
                    className="w-20 text-center py-2 text-3xl font-mono font-bold outline-none rounded-xl"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => setShowPicker(false)} className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-all hover:opacity-80" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>Cancel</button>
            <button onClick={applyPicker} disabled={pickerHours + pickerMinutes + pickerSeconds === 0} className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-30" style={{ background: 'var(--accent)' }}>Set</button>
          </div>
        </div>
      )}

      {/* Big time display */}
      <div
        className={`font-mono font-bold leading-none tabular-nums transition-all duration-300${isPulsing ? ' animate-pulse' : ''}`}
        style={{
          fontSize: 'clamp(6rem, 18vw, 16rem)',
          color: timeColor,
          transition: 'color 0.4s ease',
          cursor: timer.status === 'idle' ? 'pointer' : 'default',
          letterSpacing: '-0.02em',
        }}
        onClick={() => { if (timer.status === 'idle') setShowPicker(true); }}
        title={timer.status === 'idle' ? 'Click to set duration' : undefined}
      >
        {timer.totalSeconds === 0 ? '00:00' : formatTime(timer.remainingSeconds)}
      </div>

      {/* Status label */}
      <div className="h-8 mt-3 flex items-center">
        {timer.status === 'idle' && timer.totalSeconds === 0 && (
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Click the time or pick a preset to begin</span>
        )}
        {timer.status === 'completed' && (
          <span className="text-lg font-semibold" style={{ color: 'var(--success)' }}>Complete!</span>
        )}
        {timer.status === 'paused' && (
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Paused — Space to resume</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xl mt-8 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: progressPercent + '%',
            background: isCritical ? 'var(--critical)' : isWarning ? 'var(--warning)' : 'var(--accent)',
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={handleReset}
          className="flex items-center justify-center w-11 h-11 rounded-full transition-all hover:opacity-70"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          title="Reset (R)"
        >
          <RotateCcw size={18} />
        </button>

        {/* Primary play/pause button */}
        {timer.status === 'completed' ? (
          <button onClick={handleReset} className="flex items-center gap-2 px-8 py-4 rounded-full text-white font-semibold transition-all hover:opacity-90" style={{ background: 'var(--success)', fontSize: '1rem' }}>
            <RotateCcw size={18} /> Again
          </button>
        ) : (
          <button
            onClick={handleToggle}
            disabled={timer.status === 'idle' && timer.totalSeconds === 0}
            className="flex items-center justify-center rounded-full text-white transition-all hover:opacity-90 disabled:opacity-20"
            style={{ background: 'var(--accent)', width: '5rem', height: '5rem' }}
            title="Start / Pause (Space)"
          >
            {timer.status === 'running'
              ? <Pause size={28} />
              : <Play size={28} className="ml-1" />
            }
          </button>
        )}

        <button
          onClick={() => { if (timer.totalSeconds > 0) { setSaveName(''); setShowSaveDialog(true); } }}
          className="flex items-center justify-center w-11 h-11 rounded-full transition-all hover:opacity-70"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          title="Save preset"
        >
          <Save size={16} />
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
        Space to start/pause · R to reset
      </p>

      {/* Fullscreen */}
      <button
        onClick={handleFullscreen}
        className="absolute top-14 right-4 flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:opacity-70"
        style={{ color: 'var(--text-muted)' }}
        title="Fullscreen"
      >
        <Maximize2 size={15} />
      </button>

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-80 p-6 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Save as preset</p>
            <input
              type="text"
              placeholder={`${formatTime(timer.totalSeconds)} Timer`}
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.form?.requestSubmit()}
              className="w-full px-3 py-2 text-sm outline-none rounded-xl mb-4"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowSaveDialog(false)} className="flex-1 py-2.5 text-sm font-medium rounded-xl hover:opacity-80" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>Cancel</button>
              <button
                onClick={() => {
                  const saved: SavedTimer = { id: uuidv4(), name: saveName || `${formatTime(timer.totalSeconds)} Timer`, type: 'countdown', durationSeconds: timer.totalSeconds, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
                  const ok = library.saveTimer(saved, settings.isPremium);
                  if (!ok) alert('Free tier limit reached.');
                  setShowSaveDialog(false);
                }}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90"
                style={{ background: 'var(--accent)' }}
              >Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
