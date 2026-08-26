import type { Metadata } from 'next';
import './globals.css';
import { CompanionStatusBadge } from '@/components/companion-status-badge';

export const metadata: Metadata = {
  title: 'ModusDesk GSThub',
  description: 'GST Portal Automation & Practice Compliance Engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-bold tracking-tight text-gray-900">
                ModusDesk <span className="text-blue-600">GSThub</span>
              </h1>
              <span className="hidden sm:inline-block rounded bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 border border-blue-100">
                v1.0.0-dev
              </span>
            </div>
            <CompanionStatusBadge />
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
