'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { v4 as uuidv4 } from 'uuid';
import { Play, Pause, RotateCcw, SkipForward, Save } from 'lucide-react';
import { useTimerStore } from '@/lib/timer-store';
import { useSettingsStore } from '@/lib/settings-store';
import { useLibraryStore } from '@/lib/library-store';
import { formatTime, formatTimeCompact, getTotalDurationLabel } from '@/lib/format';
import { playCompletionSound, playTickSound, playHalfwaySound, vibrate, requestWakeLock } from '@/lib/alerts';
import type { IntervalPhase, IntervalSession } from '@/lib/types';
import { FullscreenButton } from '@/components/FullscreenButton';

type ViewMode = 'build' | 'run';

interface BuildConfig { sessionName: string; warmupSeconds: number; workSeconds: number; restSeconds: number; rounds: number; cooldownSeconds: number; }

function getPhaseColor(phase: IntervalPhase): string { switch (phase) { case 'work': return 'var(--accent)'; case 'rest': return 'var(--success)'; case 'warmup': case 'cooldown': return 'var(--warning)'; case 'completed': return 'var(--success)'; default: return 'var(--accent)'; } }

function getGlowClass(phase: IntervalPhase, rem: number, status: string): string { if (status === 'completed' || phase === 'completed') return 'glow-success'; if (rem <= 5 && status === 'running') return 'glow-critical'; switch (phase) { case 'work': return 'glow-accent'; case 'rest': return 'glow-success'; case 'warmup': case 'cooldown': return 'glow-warning'; default: return 'glow-accent'; } }

function getPhaseLabel(phase: IntervalPhase): string { switch (phase) { case 'warmup': return 'WARMUP'; case 'work': return 'WORK'; case 'rest': return 'REST'; case 'cooldown': return 'COOLDOWN'; case 'completed': return 'DONE'; default: return ''; } }

function computeTotal(cfg: BuildConfig): number { return cfg.warmupSeconds + (cfg.workSeconds + cfg.restSeconds) * cfg.rounds + cfg.cooldownSeconds; }

export default function IntervalsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('build');
  const [config, setConfig] = useState<BuildConfig>({ sessionName: '', warmupSeconds: 0, workSeconds: 30, restSeconds: 15, rounds: 5, cooldownSeconds: 0 });
  const [phase, setPhase] = useState<IntervalPhase>('work');
  const [currentRound, setCurrentRound] = useState(1);
  const [runConfig, setRunConfig] = useState<BuildConfig>({ sessionName: '', warmupSeconds: 0, workSeconds: 30, restSeconds: 15, rounds: 5, cooldownSeconds: 0 });
  const [transitioning, setTransitioning] = useState(false);
  const timer = useTimerStore();
  const settings = useSettingsStore();
  const library = useLibraryStore();
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const pendingLoad = library.pendingLoad;
    if (pendingLoad && pendingLoad.type === 'intervals' && pendingLoad.intervalSession) {
      const s = pendingLoad.intervalSession;
      setConfig((c) => ({
        ...c,
        sessionName: pendingLoad.name,
        warmupSeconds: s.warmupSeconds,
        workSeconds: s.workSeconds,
        restSeconds: s.restSeconds,
        rounds: s.rounds,
        cooldownSeconds: s.cooldownSeconds,
      }));
      library.clearPendingLoad();
      library.addRecent(pendingLoad);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function computeElapsed(ph: IntervalPhase, round: number, cfg: BuildConfig, rem: number): number {
    const total = computeTotal(cfg);
    if (ph === 'warmup') return Math.max(0, cfg.warmupSeconds - rem);
    if (ph === 'work') return Math.max(0, cfg.warmupSeconds + (round - 1) * (cfg.workSeconds + cfg.restSeconds) + (cfg.workSeconds - rem));
    if (ph === 'rest') return Math.max(0, cfg.warmupSeconds + (round - 1) * (cfg.workSeconds + cfg.restSeconds) + cfg.workSeconds + (cfg.restSeconds - rem));
    if (ph === 'cooldown') return Math.max(0, cfg.warmupSeconds + cfg.rounds * (cfg.workSeconds + cfg.restSeconds) + (cfg.cooldownSeconds - rem));
    if (ph === 'completed') return total;
    return 0;
  }

  function getNextPhase(ph: IntervalPhase, round: number, cfg: BuildConfig): { phase: IntervalPhase; round: number; duration: number } | null {
    if (ph === 'warmup') return { phase: 'work', round: 1, duration: cfg.workSeconds };
    if (ph === 'work') return { phase: 'rest', round, duration: cfg.restSeconds };
    if (ph === 'rest') {
      if (round < cfg.rounds) return { phase: 'work', round: round + 1, duration: cfg.workSeconds };
      if (cfg.cooldownSeconds > 0) return { phase: 'cooldown', round, duration: cfg.cooldownSeconds };
      return { phase: 'completed', round, duration: 0 };
    }
    if (ph === 'cooldown') return { phase: 'completed', round, duration: 0 };
    return null;
  }
  useEffect(() => {
    if (viewMode !== 'run' || timer.status !== 'running') { if (tickRef.current) clearInterval(tickRef.current); return; }
    tickRef.current = setInterval(() => { timer.tick(); }, 100);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, timer.status, timer.tick]);

  useEffect(() => {
    if (viewMode === 'run' && timer.status === 'running' && timer.remainingSeconds <= 5 && timer.remainingSeconds > 0 && settings.soundEnabled && settings.finalCountdownTick) playTickSound();
  }, [viewMode, timer.status, timer.remainingSeconds, settings.soundEnabled, settings.finalCountdownTick]);

  useEffect(() => {
    if (viewMode !== 'run' || timer.status !== 'completed') return;
    const next = getNextPhase(phase, currentRound, runConfig);
    if (!next || next.phase === 'completed') {
      setPhase('completed');
      if (settings.soundEnabled) playCompletionSound();
      if (settings.vibrationEnabled) vibrate([200, 100, 200]);
      settings.incrementCompletions();
      return;
    }
    if (settings.soundEnabled) playHalfwaySound();
    if (settings.vibrationEnabled) vibrate(100);
    setTransitioning(true);
    setTimeout(() => { setPhase(next.phase); setCurrentRound(next.round); timer.setDuration(next.duration); timer.start(); setTransitioning(false); }, 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.status]);

  useEffect(() => {
    if (viewMode === 'run' && settings.keepScreenAwake) requestWakeLock().then((lock) => { wakeLockRef.current = lock; });
    return () => { wakeLockRef.current?.release(); wakeLockRef.current = null; };
  }, [viewMode, settings.keepScreenAwake]);

  const startSession = () => {
    const cfg = { ...config };
    setRunConfig(cfg);
    const firstPhase: IntervalPhase = cfg.warmupSeconds > 0 ? 'warmup' : 'work';
    const firstDuration = cfg.warmupSeconds > 0 ? cfg.warmupSeconds : cfg.workSeconds;
    setPhase(firstPhase); setCurrentRound(1); timer.setDuration(firstDuration);
    setViewMode('run');
    setTimeout(() => timer.start(), 50);
  };

  const resetSession = () => { timer.reset(); setPhase('work'); setCurrentRound(1); setTransitioning(false); setViewMode('build'); };

  const handleToggle = useCallback(() => {
    if (viewMode === 'build') {
      if (computeTotal(config) > 0) startSession();
    } else {
      if (timer.status === 'running') timer.pause();
      else if (timer.status === 'paused') timer.resume();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, timer.status, config, timer.pause, timer.resume]);

  const handleReset = useCallback(() => {
    if (viewMode === 'run') resetSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  useKeyboardShortcuts({ onToggle: handleToggle, onReset: handleReset });

  const skipPhase = () => {
    const next = getNextPhase(phase, currentRound, runConfig);
    if (!next || next.phase === 'completed') { setPhase('completed'); timer.complete(); return; }
    setPhase(next.phase); setCurrentRound(next.round); timer.setDuration(next.duration); timer.start();
  };

  const saveToLibrary = () => {
    const session: IntervalSession = { id: uuidv4(), name: config.sessionName || 'Interval Session', warmupSeconds: config.warmupSeconds, workSeconds: config.workSeconds, restSeconds: config.restSeconds, rounds: config.rounds, cooldownSeconds: config.cooldownSeconds };
    const saved = { id: uuidv4(), name: session.name, type: 'intervals' as const, intervalSession: session, durationSeconds: computeTotal(config), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    if (!library.saveTimer(saved, settings.isPremium)) alert('Free tier limit reached. Upgrade to save more timers.');
  };

  const gm = (s: number) => Math.floor(s / 60);
  const gs = (s: number) => s % 60;
  const fms = (m: number, s: number) => m * 60 + s;
  const totalBuild = computeTotal(config);

  if (viewMode === 'build') {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6 animate-fade-in">
        <div className="mb-6"><h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Interval Timer</h1><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Build a work/rest interval session</p></div>
        <div className="mb-4"><input type="text" placeholder="Session name (optional)" value={config.sessionName} onChange={(e) => setConfig((c) => ({ ...c, sessionName: e.target.value }))} className="w-full px-4 py-3 text-sm font-medium outline-none" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} /></div>
        <div className="space-y-3 mb-5">
          <div className="p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
            <div className="flex items-center justify-between"><div><p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Rounds</p><p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Number of work/rest cycles</p></div><input type="number" min={1} max={99} value={config.rounds} onChange={(e) => setConfig((c) => ({ ...c, rounds: Math.max(1, parseInt(e.target.value) || 1) }))} className="w-20 text-center py-2 text-lg font-mono font-bold outline-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} /></div>
          </div>
          {([['workSeconds','Work','var(--accent)','Active interval',1],['restSeconds','Rest','var(--success)','Recovery interval',0],['warmupSeconds','Warmup','var(--warning)','Before work rounds',0],['cooldownSeconds','Cooldown','var(--warning)','After all rounds',0]] as [keyof typeof config, string, string, string, number][]).map(([key,label,color,desc,minv]) => (
            <div key={key} className="p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <div className="flex items-center justify-between mb-3"><div><p className="text-sm font-semibold" style={{ color }}>{label}{minv===0&&<span className="font-normal text-xs ml-1" style={{ color: 'var(--text-muted)' }}>(optional)</span>}</p><p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p></div><span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{(config[key] as number)>0?formatTimeCompact(config[key] as number):'off'}</span></div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5"><input type="number" min={0} max={180} value={gm(config[key] as number)} onChange={(e) => setConfig((c) => ({ ...c, [key]: Math.max(minv,fms(parseInt(e.target.value)||0,gs(c[key] as number))) }))} className="w-16 px-2 py-1.5 text-center text-sm font-mono outline-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>min</span></div>
                <span style={{ color: 'var(--text-muted)' }}>:</span>
                <div className="flex items-center gap-1.5"><input type="number" min={0} max={59} value={gs(config[key] as number)} onChange={(e) => setConfig((c) => ({ ...c, [key]: Math.max(minv,fms(gm(c[key] as number),Math.min(59,parseInt(e.target.value)||0))) }))} className="w-16 px-2 py-1.5 text-center text-sm font-mono outline-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>sec</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="sticky bottom-20 p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <div className="flex items-center justify-between mb-3"><span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{config.rounds} round{config.rounds!==1?'s':''}</span><span className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>Total: {getTotalDurationLabel(totalBuild)}</span></div>
          <div className="flex items-center gap-3">
            <button onClick={saveToLibrary} disabled={totalBuild===0} className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-30" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}><Save size={16} /> Save</button>
            <button onClick={startSession} disabled={totalBuild===0} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-30" style={{ background: 'var(--accent)', borderRadius: 'var(--radius)' }}><Play size={18} /> Start Session</button>
          </div>
        </div>
      </div>
    );
  }
  // RUN MODE
  const sessionComplete = phase === 'completed';
  const phaseColor = getPhaseColor(phase);
  const glowCls = getGlowClass(phase, timer.remainingSeconds, timer.status);
  const isPulsing = timer.remainingSeconds <= 5 && timer.status === 'running';
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const totalRun = computeTotal(runConfig);
  const curDuration = phase === 'warmup' ? runConfig.warmupSeconds : phase === 'work' ? runConfig.workSeconds : phase === 'rest' ? runConfig.restSeconds : phase === 'cooldown' ? runConfig.cooldownSeconds : 1;
  const phasePct = curDuration > 0 ? (timer.remainingSeconds / curDuration) * 100 : 0;
  const strokeDashoffset = circumference * (1 - phasePct / 100);
  const elapsed = computeElapsed(phase, currentRound, runConfig, timer.remainingSeconds);
  const overallPct = totalRun > 0 ? (elapsed / totalRun) * 100 : 0;

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 animate-fade-in">
      <div className="flex justify-end mb-2">
        <FullscreenButton />
      </div>
      <div className="text-center mb-2"><p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{runConfig.sessionName || 'Interval Timer'}</p></div>
      {!sessionComplete && (<div className="text-center mb-1"><span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{phase === 'warmup' ? 'Warmup' : phase === 'cooldown' ? 'Cooldown' : 'Round ' + currentRound + ' of ' + runConfig.rounds}</span></div>)}
      <div className="text-center mb-5">
        <span className="inline-block px-4 py-1 rounded-full text-sm font-bold tracking-widest animate-fade-in" key={phase + String(currentRound)} style={{ background: 'var(--bg-card)', color: phaseColor, border: '1px solid var(--border)' }}>{getPhaseLabel(phase)}</span>
      </div>
      <div className="flex flex-col items-center mb-6">
        <div className={"relative flex items-center justify-center transition-all duration-500 " + glowCls + (isPulsing ? ' animate-pulse-critical' : '')} style={{ width: 300, height: 300, borderRadius: '50%', background: 'var(--bg-card)' }}>
          <svg className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }} width={300} height={300} viewBox="0 0 300 300">
            <circle cx={150} cy={150} r={radius} fill="none" stroke="var(--border)" strokeWidth={8} />
            {!sessionComplete && (<circle cx={150} cy={150} r={radius} fill="none" stroke={phaseColor} strokeWidth={8} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.5s ease' }} />)}
          </svg>
          <div className="flex flex-col items-center gap-1 z-10">
            <span className="timer-display font-bold" style={{ fontSize: sessionComplete ? '2.5rem' : '4rem', color: sessionComplete ? 'var(--success)' : phaseColor }}>{sessionComplete ? 'Done!' : formatTime(timer.remainingSeconds)}</span>
          </div>
        </div>
      </div>
      <div className="mb-3">
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}><div className="h-full rounded-full transition-all duration-300" style={{ width: (100-phasePct) + '%', background: phaseColor }} /></div>
        <div className="flex justify-between mt-1"><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Phase</span><span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{formatTimeCompact(curDuration)}</span></div>
      </div>
      <div className="mb-6">
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}><div className="h-full rounded-full transition-all duration-300" style={{ width: overallPct + '%', background: 'var(--text-secondary)' }} /></div>
        <div className="flex justify-between mt-1"><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Overall</span><span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{getTotalDurationLabel(totalRun)}</span></div>
      </div>
      <div className="flex items-center justify-center gap-4">
        <button onClick={resetSession} className="flex items-center justify-center w-12 h-12 rounded-full transition-all hover:opacity-80" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }} title="Reset"><RotateCcw size={20} /></button>
        {!sessionComplete && (<button onClick={() => { if (timer.status === 'running') timer.pause(); else if (timer.status === 'paused') timer.resume(); }} disabled={transitioning} className="flex items-center justify-center w-16 h-16 rounded-full text-white transition-all hover:opacity-90 disabled:opacity-40" style={{ background: phaseColor }} title={timer.status === 'running' ? 'Pause' : 'Resume'}>{timer.status === 'running' ? <Pause size={28} /> : <Play size={28} className="ml-1" />}</button>)}
        {sessionComplete && (<button onClick={resetSession} className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition-all hover:opacity-90" style={{ background: 'var(--success)' }}><RotateCcw size={18} /> New Session</button>)}
        {!sessionComplete && (<button onClick={skipPhase} disabled={transitioning} className="flex items-center justify-center w-12 h-12 rounded-full transition-all hover:opacity-80 disabled:opacity-40" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }} title="Skip phase"><SkipForward size={20} /></button>)}
      </div>
      <div className="mt-6 text-center"><span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{formatTimeCompact(Math.max(0, totalRun - elapsed))} remaining</span></div>
    </div>
  );
}
