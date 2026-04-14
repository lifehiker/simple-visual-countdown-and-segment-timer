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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
      style={{
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border)',
        height: '4rem',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-150',
              isActive ? '' : 'opacity-40 hover:opacity-60'
            )}
            style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
