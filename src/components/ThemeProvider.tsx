'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/settings-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((s) => s.theme);
  const hydrated = useSettingsStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else if (theme === 'dark') {
      root.removeAttribute('data-theme');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', 'light');
      }
    }
  }, [theme, hydrated]);

  return <>{children}</>;
}
