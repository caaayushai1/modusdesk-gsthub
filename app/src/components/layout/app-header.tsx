'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  Search, 
  Sparkles, 
  ChevronDown, 
  Calendar,
  Check,
  Zap, 
  ExternalLink,
  Shield,
  LogOut,
  HelpCircle,
  Laptop
} from 'lucide-react';
import { checkCompanionHealth } from '@/lib/companion-client';
import { useGSTClients } from '@/lib/use-gst-clients';

interface AppHeaderProps {
  onToggleSidebar?: () => void;
}

const FISCAL_YEAR_OPTIONS = ['FY 2026-27', 'FY 2025-26', 'FY 2024-25'];

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const pathname = usePathname();
  const { staffInfo } = useGSTClients();

  const [companionOnline, setCompanionOnline] = useState(false);
  const [fiscalYear, setFiscalYear] = useState('FY 2026-27');
  const [isCycleDropdownOpen, setIsCycleDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cycleDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Check Companion health periodically on port 9090
  useEffect(() => {
    let isMounted = true;
    const checkCompanion = async () => {
      const health = await checkCompanionHealth();
      if (isMounted) {
        setCompanionOnline(health.status === 'HEALTHY');
      }
    };

    checkCompanion();
    const interval = setInterval(checkCompanion, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cycleDropdownRef.current && !cycleDropdownRef.current.contains(e.target as Node)) {
        setIsCycleDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const firmName = 'Gupta Aayush & Co.';
  const userName = staffInfo?.name || 'Aayush Gupta';
  const userRole = staffInfo?.role === 'STAFF' ? 'STAFF' : 'ADMIN';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'GA';

  const roleMeta = userRole === 'ADMIN'
    ? { label: 'Partner / Admin', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
    : { label: 'Staff Member', color: 'bg-slate-100 text-slate-700 border-slate-200' };

  const modusdeskCoreUrl = process.env.NEXT_PUBLIC_MODUSDESK_URL || 'http://localhost:3030';

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gsthub_token');
      document.cookie = 'gsthub_token=; path=/; max-age=0; SameSite=Lax';
      window.location.href = `${modusdeskCoreUrl}/login`;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-40 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shadow-2xs gap-3 select-none">
      {/* Group 1 (Left): Mobile Toggle + Firm Name + Divider + Search Bar */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Firm Name */}
          <Link
            href="/dashboard"
            className="flex flex-col text-left py-0.5 group shrink-0 min-w-0"
            title={firmName}
          >
            <span className="text-xs sm:text-[14px] font-bold text-slate-900 tracking-tight leading-snug group-hover:text-emerald-800 truncate max-w-[180px] sm:max-w-[240px]">
              {firmName}
            </span>
            <span className="text-[9px] sm:text-[9.5px] font-semibold text-emerald-700 uppercase tracking-wider leading-none mt-0.5">
              Chartered Accountants
            </span>
          </Link>
        </div>

        {/* Group Divider */}
        <div className="h-5 w-px bg-slate-200 hidden md:block shrink-0" />

        {/* Global Search Bar */}
        <div className="relative max-w-xs sm:max-w-sm w-full hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients, GSTINs, returns..."
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl pl-9 pr-3.5 py-1.5 text-xs border border-slate-200 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100 outline-none transition-all duration-150"
          />
        </div>
      </div>

      {/* Group 2 (Right Actions & Utilities Cluster) */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Quick Action Buttons Space */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/quick-login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.99] cursor-pointer"
            title="1-Click Automated GST Login"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span className="hidden sm:inline">1-Click Login</span>
          </Link>
        </div>

        {/* Vertical Divider */}
        <div className="h-5 w-px bg-slate-200 hidden sm:block shrink-0" />

        {/* Status & Utility Cluster: Period Dropdown + Layman Companion Indicator */}
        <div className="flex items-center gap-2">
          {/* Active FY Cycle Dropdown */}
          <div className="relative shrink-0 hidden sm:block" ref={cycleDropdownRef}>
            <button
              onClick={() => setIsCycleDropdownOpen(!isCycleDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-xs text-slate-700 transition-colors cursor-pointer"
              title="Active Fiscal Year Period"
            >
              <Calendar className="w-3 h-3 text-slate-400" />
              <span className="font-mono font-semibold text-[11px] text-slate-900">{fiscalYear}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isCycleDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 text-[9.5px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  Active FY Cycle
                </div>
                <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {FISCAL_YEAR_OPTIONS.map((fy) => (
                    <button
                      key={fy}
                      onClick={() => {
                        setFiscalYear(fy);
                        setIsCycleDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-mono transition-colors text-left cursor-pointer ${
                        fiscalYear === fy
                          ? 'bg-emerald-50 text-emerald-900 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{fy}</span>
                      {fiscalYear === fy && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Layman-Friendly Portal Automation Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
              companionOnline
                ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200'
                : 'bg-rose-50/90 text-rose-800 border-rose-200'
            }`}
            title={
              companionOnline
                ? 'Desktop Automation Running on localhost:9090 — 1-Click GST Portal login is active'
                : 'Desktop Automation Offline — Launch start-companion.bat on your PC for 1-click login'
            }
          >
            <span
              className={`h-2 w-2 rounded-full ${
                companionOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="hidden sm:inline text-[11px]">
              {companionOnline ? 'GST Auto-Login Ready' : 'GST Auto-Login Offline'}
            </span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-5 w-px bg-slate-200 hidden md:block shrink-0" />

        {/* User Profile Dropdown Cluster (Matching ModusDesk Core Exactly) */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors group cursor-pointer"
            title="User Profile Menu"
            aria-label="User Profile Menu"
          >
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-slate-100 shadow-2xs group-hover:ring-slate-300 transition-all">
                {userInitials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {userName}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight">
                {roleMeta.label}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block group-hover:text-slate-700 transition-transform duration-150" />
          </button>

          {/* Profile Menu Dropdown Panel */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Top Identity Card */}
              <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-2xs">
                      {userInitials}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {userName}
                    </span>
                    <span className={`mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-semibold border w-fit ${roleMeta.color}`}>
                      {roleMeta.label}
                    </span>
                  </div>
                </div>
                <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  Online
                </span>
              </div>

              {/* Menu Navigation Links */}
              <div className="p-2 space-y-0.5">
                <a
                  href={`${modusdeskCoreUrl}/dashboard`}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>ModusDesk Workspace</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <Link
                  href="/quick-login"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <Laptop className="w-4 h-4 text-slate-400" />
                  <span>Desktop Companion Portal</span>
                </Link>
              </div>

              {/* Sign Out Action */}
              <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    <span>Return to ModusDesk</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
