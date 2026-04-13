'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Timer, Layers, Repeat, BookmarkCheck, Settings } from 'lucide-react';
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
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-12"
      style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}
    >
      <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
        Timer
      </span>
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                isActive
                  ? 'text-white'
                  : 'opacity-50 hover:opacity-80'
              )}
              style={isActive ? { background: 'var(--accent)', color: 'white' } : { color: 'var(--text-secondary)' }}
            >
              <Icon size={13} strokeWidth={isActive ? 2.5 : 1.5} />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
