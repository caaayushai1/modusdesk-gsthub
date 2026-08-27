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
  ShieldCheck, 
  Server,
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
    { name: 'Quick Login', href: '/quick-login', icon: Zap },
    { name: 'Filing Matrix', href: '/matrix', icon: LayoutGrid },
    { name: 'Returns Downloader', href: '/downloader', icon: DownloadCloud },
    { name: '2B Reco Studio', href: '/reco', icon: FileSpreadsheet },
    { name: 'Ledgers & Offset', href: '/ledgers', icon: Wallet },
    { name: 'CA MIS Suite', href: '/mis', icon: BarChart3 },
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

      <aside
        className={`w-[220px] h-[calc(100vh-3.5rem)] fixed left-0 top-14 flex flex-col bg-white border-r border-slate-200/90 z-30 transition-transform duration-300 ease-in-out shadow-xs select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Navigation List */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto custom-scrollbar">
          <div className="px-2.5 pb-1.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
            GST Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isExact = pathname === item.href;
            const isPrefix = item.href !== '/' && pathname.startsWith(item.href);
            const isActive = isExact || isPrefix;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                title={item.name}
                className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-50/90 text-emerald-950 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 font-normal'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Left Accent Bar on Active */}
                  {isActive && (
                    <span className="absolute left-0 top-1 bottom-1 w-1 bg-emerald-600 rounded-r-full" />
                  )}
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive ? 'text-emerald-600 stroke-[2.2]' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span className="truncate text-[11.5px]">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom System Status Box */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Server className="w-3 h-3 text-slate-400" /> Engine
              </span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[9.5px]">
                SQLite Local
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1">
              <span>Port :9090</span>
              <span className="font-mono text-[9px] font-bold text-slate-500">v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
