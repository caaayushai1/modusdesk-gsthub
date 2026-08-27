'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard,
  Zap, 
  LayoutGrid, 
  DownloadCloud, 
  FileSpreadsheet, 
  Wallet, 
  BarChart3, 
  Settings,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isOpen = false, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Executive Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Filing Matrix', href: '/matrix', icon: LayoutGrid },
    { name: 'Returns Downloader', href: '/downloader', icon: DownloadCloud },
    { name: '2B Reco Studio', href: '/reco', icon: FileSpreadsheet },
    { name: 'Ledgers & Offset', href: '/ledgers', icon: Wallet },
    { name: 'CA MIS Suite', href: '/mis', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-56 bg-white border-r border-slate-200/90 z-30 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation Section */}
        <nav className="p-2 space-y-3 overflow-y-auto custom-scrollbar flex-1">
          {/* Workspace Group */}
          <div className="space-y-0.5">
            <div className="px-2.5 pb-1 pt-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
              Workspace
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isExact = pathname === item.href;
              const isPrefix = item.href !== '/dashboard' && pathname.startsWith(item.href);
              const isActive = isExact || isPrefix;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  title={item.name}
                  className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-50/90 text-emerald-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 font-normal'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Left Accent Bar on Active */}
                    {isActive && (
                      <span className="absolute left-0 top-1 bottom-1 w-1 bg-emerald-600 rounded-r-full" />
                    )}
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                        isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="truncate text-[11.5px]">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Distinct Bottom Branding Section with visual divider */}
        <div className="p-2.5 border-t border-slate-200/90 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white rounded-md flex items-center justify-center shadow-2xs shrink-0">
              <Sparkles className="w-2.5 h-2.5 text-emerald-300" />
            </div>
            <span className="font-headline font-bold text-slate-900 text-[11px] tracking-tight truncate">
              ModusDesk GSThub
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
