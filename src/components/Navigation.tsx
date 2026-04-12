'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Timer, BookmarkCheck, Settings, Layers, Repeat } from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/', label: 'Timer', icon: Timer },
  { href: '/segments', label: 'Segments', icon: Layers },
  { href: '/intervals', label: 'Intervals', icon: Repeat },
  { href: '/library', label: 'Library', icon: BookmarkCheck },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}
    >
      <div className="mx-auto max-w-lg flex items-center justify-around py-2 px-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[60px]',
                isActive ? 'scale-105' : 'opacity-50 hover:opacity-80'
              )}
              style={isActive ? { color: 'var(--accent)' } : { color: 'var(--text-secondary)' }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
