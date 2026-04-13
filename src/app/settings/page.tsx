"use client";

import { Lock, Volume2, Smartphone, Bell, Clock, Moon, Sun, Monitor, Crown, CheckCircle } from 'lucide-react';
import { useSettingsStore } from '@/lib/settings-store';
import type { ThemeMode } from '@/lib/types';

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button onClick={disabled ? undefined : onChange} disabled={disabled} aria-pressed={checked} className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-40" style={{ background: checked ? 'var(--accent)' : 'var(--border)' }}>
      <span className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200" style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }} />
    </button>
  );
}

function SettingRow({ icon, label, description, checked, onToggle, locked }: { icon: React.ReactNode; label: string; description?: string; checked: boolean; onToggle: () => void; locked?: boolean }) {
  return (
    <div className="flex items-center justify-between py-4 px-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3">
        <span style={{ color: 'var(--text-secondary)' }}>{icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
            {locked && <Lock size={12} style={{ color: 'var(--warning)' }} />}
          </div>
          {description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>}
        </div>
      </div>
      <Toggle checked={checked} onChange={onToggle} disabled={locked} />
    </div>
  );
}

export default function SettingsPage() {
  const settings = useSettingsStore();
  const themes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'system', label: 'System', icon: <Monitor size={16} /> },
    { value: 'light', label: 'Light', icon: <Sun size={16} /> },
    { value: 'dark', label: 'Dark', icon: <Moon size={16} /> },
  ];

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-8 animate-fade-in">
      <div className="mb-6"><h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1></div>

      <div className="mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}><p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Audio & Feedback</p></div>
        <SettingRow icon={<Volume2 size={18} />} label="Sound Effects" description="Play sounds on events" checked={settings.soundEnabled} onToggle={settings.toggleSound} />
        <SettingRow icon={<Smartphone size={18} />} label="Vibration" description="Haptic feedback on completion" checked={settings.vibrationEnabled} onToggle={settings.toggleVibration} />
        <SettingRow icon={<Bell size={18} />} label="Halfway Alert" description="Sound at 50% time elapsed" checked={settings.halfwayAlert} onToggle={settings.toggleHalfwayAlert} locked={!settings.isPremium} />
        <div className="flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-3">
            <span style={{ color: 'var(--text-secondary)' }}><Clock size={18} /></span>
            <div>
              <div className="flex items-center gap-2"><span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Final 10s Countdown Tick</span>{!settings.isPremium && <Lock size={12} style={{ color: 'var(--warning)' }} />}</div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Tick sound in last 10 seconds</p>
            </div>
          </div>
          <Toggle checked={settings.finalCountdownTick} onChange={settings.toggleFinalCountdownTick} disabled={!settings.isPremium} />
        </div>
      </div>

      <div className="mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}><p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Display</p></div>
        <SettingRow icon={<Monitor size={18} />} label="Keep Screen Awake" description="Prevent screen from locking" checked={settings.keepScreenAwake} onToggle={settings.toggleKeepScreenAwake} />
      </div>

      <div className="mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}><p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Theme</p></div>
        <div className="p-4">
          <div className="flex gap-2">
            {themes.map(({ value, label, icon }) => (
              <button key={value} onClick={() => settings.setTheme(value)} className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all" style={{ background: settings.theme === value ? 'var(--accent)' : 'var(--bg-secondary)', color: settings.theme === value ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                {icon}{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}><p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Premium</p></div>
        <div className="p-4">
          {settings.isPremium ? (
            <div className="flex items-center gap-3 py-2">
              <CheckCircle size={20} style={{ color: 'var(--success)' }} />
              <div><p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>Premium Unlocked</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>All features enabled</p></div>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>Unlock halfway alerts, countdown ticks, and more.</p>
              <button onClick={() => settings.setPremium(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, var(--accent), var(--warning))' }}>
                <Crown size={16} /> Unlock Premium (Free for Web)
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Timer sessions completed</p>
        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{settings.completionCount}</p>
      </div>
    </div>
  );
}
