'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  ChevronDown, 
  Zap, 
  ExternalLink,
  Activity
} from 'lucide-react';
import { checkCompanionHealth } from '@/lib/companion-client';

interface AppHeaderProps {
  onToggleSidebar?: () => void;
}

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const pathname = usePathname();
  const [companionOnline, setCompanionOnline] = useState(false);
  const [fiscalYear, setFiscalYear] = useState('FY 2026-27');

  // Check Companion status on port 9090
  useEffect(() => {
    const checkCompanion = async () => {
      const health = await checkCompanionHealth();
      setCompanionOnline(health.status === 'HEALTHY');
    };

    checkCompanion();
    const interval = setInterval(checkCompanion, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200/90 z-40 flex items-center justify-between px-4 select-none">
      {/* Left: Hamburger & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-2xs shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <span className="font-hanken font-extrabold text-sm tracking-tighter">M</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-hanken font-bold text-base tracking-tight text-slate-900">
              ModusDesk
            </span>
            <span className="rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
              GSThub
            </span>
          </div>
        </Link>

        {/* Divider */}
        <div className="hidden sm:block h-4 w-px bg-slate-200 mx-1" />

        {/* Fiscal Year Switcher */}
        <div className="hidden sm:flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
          <span className="font-medium text-slate-400">Period:</span>
          <span className="font-semibold text-slate-800">{fiscalYear}</span>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search clients, GSTINs, returns..."
            className="w-full bg-slate-50 border border-slate-200/90 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Right: Companion Status & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Companion Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
            companionOnline
              ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200'
              : 'bg-rose-50/90 text-rose-800 border-rose-200'
          }`}
          title={
            companionOnline
              ? 'Desktop Companion running on localhost:9090'
              : 'Desktop Companion offline — Run start-companion.bat'
          }
        >
          <span
            className={`h-2 w-2 rounded-full ${
              companionOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="hidden sm:inline text-[11px]">
            {companionOnline ? 'Companion Active' : 'Companion Offline'}
          </span>
        </div>

        {/* 1-Click Quick Action */}
        <Link
          href="/quick-login"
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-white" />
          <span className="hidden sm:inline">1-Click Login</span>
        </Link>

        {/* Practice Avatar */}
        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shadow-2xs">
          CA
        </div>
      </div>
    </header>
  );
}
