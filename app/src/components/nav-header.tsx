'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CompanionStatusBadge } from '@/components/companion-status-badge';

export function NavHeader() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '⚡ Quick Login' },
    { href: '/matrix', label: '🌐 Filing Matrix' },
    { href: '/downloader', label: '📥 Returns Downloader' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-sm shadow-xs">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Brand & Tabs */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-gray-900">
              ModusDesk <span className="text-blue-600">GSThub</span>
            </span>
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 border border-blue-100">
              v1.0.0
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Live Status Badge */}
        <CompanionStatusBadge />
      </div>
    </header>
  );
}
