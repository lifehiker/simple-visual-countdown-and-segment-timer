'use client';

import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/lib/settings-store';
import { useLibraryStore } from '@/lib/library-store';

export function HydrationGate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateLibrary = useLibraryStore((s) => s.hydrate);

  useEffect(() => {
    hydrateSettings();
    hydrateLibrary();
    setMounted(true);
  }, [hydrateSettings, hydrateLibrary]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return <>{children}</>;
}
