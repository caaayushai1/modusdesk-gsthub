import type { Metadata } from 'next';
import { Inter, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ModusDesk GSThub | Practice GST Compliance Engine',
  description: 'Multi-tenant practice compliance matrix, 1-click automated portal login, and statutory reconciliation engine.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[var(--surface)] text-[var(--on-surface)] antialiased min-h-screen selection:bg-emerald-600 selection:text-white">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
