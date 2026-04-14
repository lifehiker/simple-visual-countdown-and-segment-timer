import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Navigation } from '@/components/Navigation';
import { HydrationGate } from '@/components/HydrationGate';

export const metadata: Metadata = {
  title: 'Big Countdown Timer',
  description: 'Large display countdown timer for presentations, workouts & routines',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <HydrationGate>
            <Navigation />
            <main className="min-h-screen pb-16">
              {children}
            </main>
          </HydrationGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
