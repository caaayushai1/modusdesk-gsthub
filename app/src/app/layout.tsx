import type { Metadata } from 'next';
import './globals.css';
import { NavHeader } from '@/components/nav-header';

export const metadata: Metadata = {
  title: 'ModusDesk GSThub — Practice GST Compliance Engine',
  description: 'Practice-wide GST filing matrix, 1-click portal login, and automated compliance tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased font-sans">
        <NavHeader />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
