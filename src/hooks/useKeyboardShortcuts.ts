'use client';

import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onToggle?: () => void;
  onReset?: () => void;
}

export function useKeyboardShortcuts({ onToggle, onReset }: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) return;

      if (e.code === 'Space') {
        e.preventDefault();
        onToggle?.();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onReset?.();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onToggle, onReset]);
}
