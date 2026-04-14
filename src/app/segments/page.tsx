'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus,
  Trash2,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Save,
} from 'lucide-react';
import { useTimerStore } from '@/lib/timer-store';
import { useSettingsStore } from '@/lib/settings-store';
import { useLibraryStore } from '@/lib/library-store';
import { formatTime, formatTimeCompact } from '@/lib/format';
import { playCompletionSound, playTickSound, vibrate, requestWakeLock } from '@/lib/alerts';
import type { SegmentItem, SegmentSession } from '@/lib/types';
import { FullscreenButton } from '@/components/FullscreenButton';

type ViewMode = 'build' | 'run';

function createDefaultSegment(): SegmentItem {
  return { id: uuidv4(), label: '', durationSeconds: 300 };
}

export default function SegmentsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('build');
  const [sessionName, setSessionName] = useState('');
  const [segments, setSegments] = useState<SegmentItem[]>([createDefaultSegment()]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const timer = useTimerStore();
  const settings = useSettingsStore();
  const library = useLibraryStore();

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const pendingLoad = library.pendingLoad;
    if (pendingLoad && pendingLoad.type === 'segments' && pendingLoad.segmentSession) {
      setSessionName(pendingLoad.name);
      setSegments(
        pendingLoad.segmentSession.segments.map((s) => ({
          id: s.id,
          label: s.label,
          durationSeconds: s.durationSeconds,
        }))
      );
      library.clearPendingLoad();
      library.addRecent(pendingLoad);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalDuration = segments.reduce((sum, s) => sum + s.durationSeconds, 0);
  const currentSegment = segments[currentSegmentIndex] ?? null;
  const nextSegment = segments[currentSegmentIndex + 1] ?? null;

  useEffect(() => {
    if (viewMode !== 'run' || timer.status !== 'running') {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => { timer.tick(); }, 100);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, timer.status, timer.tick]);

  useEffect(() => {
    if (viewMode === 'run' && timer.status === 'running' && timer.remainingSeconds <= 5 && timer.remainingSeconds > 0 && settings.soundEnabled && settings.finalCountdownTick) {
      playTickSound();
    }
  }, [viewMode, timer.status, timer.remainingSeconds, settings.soundEnabled, settings.finalCountdownTick]);

  useEffect(() => {
    if (viewMode !== 'run' || timer.status !== 'completed') return;
    if (settings.soundEnabled) playCompletionSound();
    if (settings.vibrationEnabled) vibrate();
    if (currentSegmentIndex < segments.length - 1) {
      setTransitioning(true);
      setTimeout(() => {
        const nextIndex = currentSegmentIndex + 1;
        setCurrentSegmentIndex(nextIndex);
        timer.setDuration(segments[nextIndex].durationSeconds);
        timer.start();
        setTransitioning(false);
      }, 1200);
    } else {
      settings.incrementCompletions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.status]);

  useEffect(() => {
    if (viewMode === 'run' && settings.keepScreenAwake) {
      requestWakeLock().then((lock) => { wakeLockRef.current = lock; });
    }
    return () => { wakeLockRef.current?.release(); wakeLockRef.current = null; };
  }, [viewMode, settings.keepScreenAwake]);
  const addSegment = () => { setSegments((prev) => [...prev, createDefaultSegment()]); };
  const removeSegment = (id: string) => { setSegments((prev) => prev.filter((s) => s.id !== id)); };
  const updateSegment = (id: string, updates: Partial<SegmentItem>) => { setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s))); };

  const moveSegment = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= segments.length) return;
    setSegments((prev) => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  const startSession = () => {
    if (segments.length === 0) return;
    setCurrentSegmentIndex(0);
    timer.setDuration(segments[0].durationSeconds);
    setViewMode('run');
    setTimeout(() => timer.start(), 50);
  };

  const resetSession = () => {
    timer.reset();
    setCurrentSegmentIndex(0);
    setTransitioning(false);
    setViewMode('build');
  };

  const handleToggle = useCallback(() => {
    if (viewMode === 'build') {
      if (segments.length > 0 && totalDuration > 0) startSession();
    } else {
      if (timer.status === 'running') timer.pause();
      else if (timer.status === 'paused') timer.resume();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, timer.status, segments.length, totalDuration, timer.pause, timer.resume]);

  const handleReset = useCallback(() => {
    if (viewMode === 'run') resetSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  useKeyboardShortcuts({ onToggle: handleToggle, onReset: handleReset });

  const skipSegment = () => {
    if (currentSegmentIndex < segments.length - 1) {
      const nextIndex = currentSegmentIndex + 1;
      setCurrentSegmentIndex(nextIndex);
      timer.setDuration(segments[nextIndex].durationSeconds);
      timer.start();
    } else {
      timer.complete();
    }
  };

  const saveToLibrary = () => {
    const session: SegmentSession = { id: uuidv4(), name: sessionName || 'Untitled Session', segments };
    const savedTimer = {
      id: uuidv4(), name: session.name, type: 'segments' as const,
      segmentSession: session, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const success = library.saveTimer(savedTimer, settings.isPremium);
    if (!success) alert('Free tier limit reached. Upgrade to save more timers.');
  };

  const getMinutes = (seconds: number) => Math.floor(seconds / 60);
  const getSeconds = (seconds: number) => seconds % 60;

  const elapsedBefore = segments.slice(0, currentSegmentIndex).reduce((sum, s) => sum + s.durationSeconds, 0);
  const currentElapsed = currentSegment ? currentSegment.durationSeconds - timer.remainingSeconds : 0;
  const overallElapsed = elapsedBefore + currentElapsed;

  const getGlowClass = () => {
    if (timer.status === 'completed' && currentSegmentIndex >= segments.length - 1) return 'glow-success';
    if (timer.remainingSeconds <= 5 && timer.status === 'running') return 'glow-critical';
    if (timer.remainingSeconds <= 30 && timer.status === 'running') return 'glow-warning';
    return 'glow-accent';
  };

  // ====== BUILD MODE ======
  if (viewMode === 'build') {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Segment Timer</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Build a sequence of timed segments</p>
        </div>

        <div className="mb-5">
          <input
            type="text"
            placeholder="Session name (optional)"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2"
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
          />
        </div>

        <div className="space-y-3 mb-5">
          {segments.map((segment, index) => (
            <div
              key={segment.id}
              className="animate-fade-in"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}
            >
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0"
                    style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
                  >
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    placeholder={`Segment ${index + 1}`}
                    value={segment.label}
                    onChange={(e) => updateSegment(segment.id, { label: e.target.value })}
                    className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none transition-colors"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  />
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => moveSegment(index, 'up')} disabled={index === 0} className="p-1.5 rounded-lg transition-opacity disabled:opacity-20" style={{ color: 'var(--text-secondary)' }} title="Move up"><ChevronUp size={16} /></button>
                    <button onClick={() => moveSegment(index, 'down')} disabled={index === segments.length - 1} className="p-1.5 rounded-lg transition-opacity disabled:opacity-20" style={{ color: 'var(--text-secondary)' }} title="Move down"><ChevronDown size={16} /></button>
                    <button onClick={() => removeSegment(segment.id)} className="p-1.5 rounded-lg transition-colors hover:opacity-80" style={{ color: 'var(--critical)' }} title="Delete segment"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-8">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number" min={0} max={180}
                      value={getMinutes(segment.durationSeconds)}
                      onChange={(e) => { const mins = Math.max(0, parseInt(e.target.value) || 0); updateSegment(segment.id, { durationSeconds: mins * 60 + getSeconds(segment.durationSeconds) }); }}
                      className="w-16 px-2 py-1.5 rounded-lg text-center text-sm font-mono outline-none"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                    />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>min</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number" min={0} max={59}
                      value={getSeconds(segment.durationSeconds)}
                      onChange={(e) => { const secs = Math.min(59, Math.max(0, parseInt(e.target.value) || 0)); updateSegment(segment.id, { durationSeconds: getMinutes(segment.durationSeconds) * 60 + secs }); }}
                      className="w-16 px-2 py-1.5 rounded-lg text-center text-sm font-mono outline-none"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                    />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>sec</span>
                  </div>
                  <span className="ml-auto text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{formatTimeCompact(segment.durationSeconds)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addSegment}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-90 mb-6"
          style={{ background: 'var(--bg-card)', color: 'var(--accent)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}
        >
          <Plus size={18} />
          Add Segment
        </button>

        <div
          className="sticky bottom-20 p-4 rounded-xl"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{segments.length} segment{segments.length !== 1 ? 's' : ''}</span>
            <span className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>Total: {formatTimeCompact(totalDuration)}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={saveToLibrary}
              disabled={segments.length === 0 || totalDuration === 0}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-30"
              style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
            >
              <Save size={16} />
              Save
            </button>
            <button
              onClick={startSession}
              disabled={segments.length === 0 || totalDuration === 0}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-30"
              style={{ background: 'var(--accent)', borderRadius: 'var(--radius)' }}
            >
              <Play size={18} />
              Start Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====== RUN MODE ======
  const sessionComplete = timer.status === 'completed' && currentSegmentIndex >= segments.length - 1;

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 animate-fade-in">
      <div className="flex justify-end mb-2">
        <FullscreenButton />
      </div>
      <div className="text-center mb-2">
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{sessionName || 'Segment Timer'}</p>
      </div>

      <div className="text-center mb-1">
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {sessionComplete ? 'Session Complete' : `Segment ${currentSegmentIndex + 1} of ${segments.length}`}
        </span>
      </div>

      <div className="text-center mb-6">
        <h2
          className="text-xl font-bold animate-fade-in"
          style={{ color: sessionComplete ? 'var(--success)' : 'var(--text-primary)' }}
          key={currentSegmentIndex}
        >
          {sessionComplete ? 'All Done!' : transitioning ? 'Next up...' : currentSegment?.label || `Segment ${currentSegmentIndex + 1}`}
        </h2>
      </div>

      <div
        className={`mx-auto mb-6 flex items-center justify-center rounded-2xl transition-all duration-500 ${getGlowClass()} ${timer.remainingSeconds <= 5 && timer.status === 'running' ? 'animate-pulse-critical' : ''}`}
        style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', width: '280px', height: '280px' }}
      >
        <span
          className="timer-display font-bold"
          style={{
            fontSize: sessionComplete ? '2.5rem' : '4rem',
            color: sessionComplete ? 'var(--success)' : timer.remainingSeconds <= 10 ? 'var(--critical)' : timer.remainingSeconds <= 30 ? 'var(--warning)' : 'var(--text-primary)',
          }}
        >
          {sessionComplete ? 'Done' : formatTime(timer.remainingSeconds)}
        </span>
      </div>

      <div className="mb-5">
        <div className="w-full h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--bg-secondary)' }}>
          {segments.map((seg, i) => {
            const segWidth = totalDuration > 0 ? (seg.durationSeconds / totalDuration) * 100 : 0;
            let fillPercent = 0;
            if (i < currentSegmentIndex) fillPercent = 100;
            else if (i === currentSegmentIndex && currentSegment) {
              fillPercent = currentSegment.durationSeconds > 0
                ? ((currentSegment.durationSeconds - timer.remainingSeconds) / currentSegment.durationSeconds) * 100
                : 100;
            }
            return (
              <div key={seg.id} className="relative h-full" style={{ width: `${segWidth}%`, borderRight: i < segments.length - 1 ? '1px solid var(--bg-primary)' : 'none' }}>
                <div className="absolute inset-0 transition-all duration-300" style={{ width: `${Math.min(100, fillPercent)}%`, background: i < currentSegmentIndex ? 'var(--success)' : i === currentSegmentIndex ? 'var(--accent)' : 'transparent' }} />
              </div>
            );
          })}
        </div>
        <div className="flex mt-1.5">
          {segments.map((seg, i) => {
            const segWidth = totalDuration > 0 ? (seg.durationSeconds / totalDuration) * 100 : 0;
            return (
              <div key={seg.id} className="text-center overflow-hidden" style={{ width: `${segWidth}%` }}>
                <span className="text-[9px] leading-tight block truncate" style={{ color: i === currentSegmentIndex ? 'var(--accent)' : i < currentSegmentIndex ? 'var(--success)' : 'var(--text-muted)', fontWeight: i === currentSegmentIndex ? 600 : 400 }}>
                  {seg.label || `Seg ${i + 1}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {!sessionComplete && nextSegment && (
        <div className="mb-6 px-4 py-3 rounded-xl flex items-center justify-between" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div className="flex items-center gap-2">
            <SkipForward size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Next:</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{nextSegment.label || `Segment ${currentSegmentIndex + 2}`}</span>
          </div>
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{formatTimeCompact(nextSegment.durationSeconds)}</span>
        </div>
      )}

      <div className="flex items-center justify-center gap-4">
        <button onClick={resetSession} className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 hover:opacity-80" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }} title="Reset session">
          <RotateCcw size={20} />
        </button>

        {!sessionComplete && (
          <button
            onClick={() => { if (timer.status === 'running') timer.pause(); else if (timer.status === 'paused') timer.resume(); }}
            disabled={transitioning}
            className="flex items-center justify-center w-16 h-16 rounded-full text-white transition-all duration-200 hover:opacity-90 disabled:opacity-40"
            style={{ background: 'var(--accent)' }}
            title={timer.status === 'running' ? 'Pause' : 'Resume'}
          >
            {timer.status === 'running' ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </button>
        )}

        {sessionComplete && (
          <button onClick={resetSession} className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition-all duration-200 hover:opacity-90" style={{ background: 'var(--success)' }}>
            <RotateCcw size={18} />
            New Session
          </button>
        )}

        {!sessionComplete && (
          <button onClick={skipSegment} disabled={transitioning} className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 hover:opacity-80 disabled:opacity-40" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }} title="Skip to next segment">
            <SkipForward size={20} />
          </button>
        )}
      </div>

      <div className="mt-6 text-center">
        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{formatTimeCompact(Math.max(0, totalDuration - overallElapsed))} remaining</span>
      </div>
    </div>
  );
}
