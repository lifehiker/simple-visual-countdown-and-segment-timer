"use client";

import { useRouter } from 'next/navigation';
import { Timer, Layers, Repeat, Trash2, Clock, BookmarkPlus, Crown, Play } from 'lucide-react';
import { useLibraryStore } from '@/lib/library-store';
import { useSettingsStore } from '@/lib/settings-store';
import { useTimerStore } from '@/lib/timer-store';
import type { SavedTimer } from '@/lib/types';
import { MAX_FREE_SAVED_TIMERS } from '@/lib/types';
import { getTotalDurationLabel } from '@/lib/format';

function typeIcon(type: SavedTimer['type']) {
  if (type === 'segments') return <Layers size={16} />;
  if (type === 'intervals') return <Repeat size={16} />;
  return <Timer size={16} />;
}

function typeLabel(type: SavedTimer['type']) {
  if (type === 'segments') return 'Segments';
  if (type === 'intervals') return 'Intervals';
  return 'Countdown';
}

function typeColor(type: SavedTimer['type']) {
  if (type === 'segments') return 'var(--warning)';
  if (type === 'intervals') return 'var(--success)';
  return 'var(--accent)';
}

export default function LibraryPage() {
  const router = useRouter();
  const library = useLibraryStore();
  const settings = useSettingsStore();
  const timer = useTimerStore();

  const runTimer = (t: SavedTimer) => {
    if (t.type === 'countdown') {
      library.addRecent(t);
      if (t.durationSeconds) {
        timer.setDuration(t.durationSeconds);
        router.push('/');
      }
    } else if (t.type === 'segments') {
      library.setPendingLoad(t);
      router.push('/segments');
    } else if (t.type === 'intervals') {
      library.setPendingLoad(t);
      router.push('/intervals');
    }
  };

  const TimerCard = ({ t, showDelete = true }: { t: SavedTimer; showDelete?: boolean }) => (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0" style={{ background: typeColor(t.type) + '22', color: typeColor(t.type) }}>
        {typeIcon(t.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{typeLabel(t.type)}</span>
          {t.durationSeconds && (<><span style={{ color: 'var(--border)' }}>·</span><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{getTotalDurationLabel(t.durationSeconds)}</span></>)}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {showDelete && (<button onClick={() => library.deleteTimer(t.id)} className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:opacity-80" style={{ color: 'var(--critical)' }} title="Delete"><Trash2 size={15} /></button>)}
        <button onClick={() => runTimer(t)} className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:opacity-80" style={{ background: 'var(--accent)', color: 'white' }} title="Run"><Play size={14} className="ml-0.5" /></button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-8 animate-fade-in">
      <div className="mb-6"><h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Library</h1></div>

      <div className="mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Saved Timers</p>
          {!settings.isPremium && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{library.savedTimers.length} of {MAX_FREE_SAVED_TIMERS}</span>
              {library.savedTimers.length >= MAX_FREE_SAVED_TIMERS && (<button onClick={() => router.push('/settings')} className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--warning)' }}><Crown size={12} /> Upgrade</button>)}
            </div>
          )}
        </div>
        {library.savedTimers.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <BookmarkPlus size={32} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>No saved timers yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Save timers from any timer page</p>
          </div>
        ) : (
          library.savedTimers.map((t) => <TimerCard key={t.id} t={t} showDelete={true} />)
        )}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}><p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Recent</p></div>
        {library.recentTimers.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <Clock size={32} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>No recent timers</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Run a timer to see it here</p>
          </div>
        ) : (
          library.recentTimers.map((t) => <TimerCard key={t.id} t={t} showDelete={false} />)
        )}
      </div>
    </div>
  );
}
