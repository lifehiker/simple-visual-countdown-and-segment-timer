'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/settings-store';
import { useLibraryStore } from '@/lib/library-store';

export function HydrationGate({ children }: { children: React.ReactNode }) {
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateLibrary = useLibraryStore((s) => s.hydrate);

  useEffect(() => {
    hydrateSettings();
    hydrateLibrary();
  }, [hydrateSettings, hydrateLibrary]);

  return <>{children}</>;
}
