'use client';

import { useState, useEffect, useCallback } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  return (
    <button
      onClick={toggle}
      title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      className="flex items-center justify-center w-10 h-10 rounded-xl transition-all hover:opacity-80"
      style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
    >
      {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
    </button>
  );
}
