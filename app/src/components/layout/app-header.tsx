'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Menu, 
  Search, 
  ChevronDown, 
  Calendar,
  Check,
  Zap, 
  LogOut,
  RotateCcw,
  Download,
  Loader2,
  Monitor,
  X,
  HelpCircle
} from 'lucide-react';
import { checkCompanionHealth, launchCompanionViaProtocol } from '@/lib/companion-client';
import { useGSTClients } from '@/lib/use-gst-clients';
import { QuickLoginModal } from '@/components/quick-login/quick-login-modal';

interface AppHeaderProps {
  onToggleSidebar?: () => void;
}

const FISCAL_YEAR_OPTIONS = ['FY 2026-27', 'FY 2025-26', 'FY 2024-25'];

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const { staffInfo, firmName: dynamicFirmName } = useGSTClients();

  const [companionOnline, setCompanionOnline] = useState(false);
  const [fiscalYear, setFiscalYear] = useState('FY 2026-27');
  const [isCycleDropdownOpen, setIsCycleDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isQuickLoginOpen, setIsQuickLoginOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCompanionModalOpen, setIsCompanionModalOpen] = useState(false);
  const [isStartingCompanion, setIsStartingCompanion] = useState(false);

  const handleStartCompanion = async () => {
    try {
      setIsStartingCompanion(true);
      launchCompanionViaProtocol();

      for (let i = 0; i < 6; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const health = await checkCompanionHealth();
        if (health.status === 'HEALTHY') {
          setCompanionOnline(true);
          setIsStartingCompanion(false);
          return;
        }
      }

      // If still offline after 5 seconds, open Setup & Troubleshooting modal
      setIsCompanionModalOpen(true);
    } catch {
      setIsCompanionModalOpen(true);
    } finally {
      setIsStartingCompanion(false);
    }
  };

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

  // Connected vs Standalone state
  const isConnected = Boolean(staffInfo);
  const displayFirmName = dynamicFirmName || 'GST Hub';

  const userName = isConnected ? (staffInfo?.name || 'Authorized Staff') : 'Guest';
  const cleanWords = userName.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/).filter(Boolean);
  const userInitials = isConnected 
    ? cleanWords.map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'U'
    : 'G';

  const isUserAdmin = staffInfo?.role === 'ADMIN' || staffInfo?.role === 'PARTNER';
  const roleLabel = isUserAdmin ? 'Partner / Admin' : 'Staff Member';
  const roleColor = isUserAdmin 
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
    : 'bg-slate-100 text-slate-700 border-slate-200';

  const handleSignOutOrReset = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gsthub_token');
      document.cookie = 'gsthub_token=; path=/; max-age=0; SameSite=Lax';
      setIsProfileOpen(false);
      // Reload page to enter clean standalone Guest mode with 0 redirects to ModusDesk
      window.location.href = '/dashboard';
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-40 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shadow-2xs gap-3 select-none">
        {/* Group 1 (Left): Mobile Toggle + Dynamic Firm Name / GST Hub + Divider + Search Bar */}
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

            {/* Firm Name / GST Hub Header */}
            <Link
              href="/dashboard"
              className="flex flex-col text-left py-0.5 group shrink-0 min-w-0"
              title={displayFirmName}
            >
              <span className="text-xs sm:text-[14px] font-bold text-slate-900 tracking-tight leading-snug group-hover:text-emerald-800 truncate max-w-[180px] sm:max-w-[240px]">
                {displayFirmName}
              </span>
              {dynamicFirmName && (
                <span className="text-[9px] sm:text-[9.5px] font-semibold text-emerald-700 uppercase tracking-wider leading-none mt-0.5">
                  Chartered Accountants
                </span>
              )}
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
          {/* Quick Login Button (Opens Floating Modal) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsQuickLoginOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.99] cursor-pointer"
              title="Launch Quick Login Modal"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span className="hidden sm:inline">Quick Login</span>
            </button>
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

            {/* Layman-Friendly Portal Automation Status Indicator & 1-Click Launch Button */}
            {companionOnline ? (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-50/90 text-emerald-800 border-emerald-200 transition-all"
                title="Desktop Automation Running on localhost:9090 — Quick Login is active"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline text-[11px]">GST Auto-Login Ready</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleStartCompanion}
                  disabled={isStartingCompanion}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 transition-all cursor-pointer active:scale-[0.98]"
                  title="Click to start Desktop Companion for 1-Click GST login"
                >
                  {isStartingCompanion ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
                      <span className="hidden sm:inline text-[11px]">Starting...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-3 w-3 text-amber-600 fill-amber-500" />
                      <span className="hidden sm:inline text-[11px]">Start Companion</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCompanionModalOpen(true)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Companion Setup & Auto-Start Configuration"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Vertical Divider */}
          <div className="h-5 w-px bg-slate-200 hidden md:block shrink-0" />

          {/* User Profile / Guest Dropdown Cluster */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors group cursor-pointer"
              title="Session Profile Menu"
              aria-label="Session Profile Menu"
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-slate-100 shadow-2xs group-hover:ring-slate-300 transition-all">
                  {userInitials}
                </div>
                {isConnected && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {userName}
                </span>
                {isConnected && (
                  <span className="text-[10px] text-slate-500 leading-tight">
                    {roleLabel}
                  </span>
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block group-hover:text-slate-700 transition-transform duration-150" />
            </button>

            {/* Profile Menu Dropdown Panel */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Top Identity Card */}
                <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                        {userInitials}
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {userName}
                      </span>
                      {isConnected && staffInfo?.email && (
                        <span className="text-[11px] text-slate-500 truncate font-normal">
                          {staffInfo.email}
                        </span>
                      )}
                      {isConnected && (
                        <span className={`mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-semibold border w-fit ${roleColor}`}>
                          {roleLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                    {isConnected ? 'Connected' : 'Standalone'}
                  </span>
                </div>

                {/* Action: Sign Out or Reset Session */}
                <div className="p-2">
                  <button
                    onClick={handleSignOutOrReset}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {isConnected ? <LogOut className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                      <span>{isConnected ? 'Sign Out' : 'Reset Session'}</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating Quick Login Modal */}
      <QuickLoginModal
        isOpen={isQuickLoginOpen}
        onClose={() => setIsQuickLoginOpen(false)}
      />

      {/* Companion Setup Modal */}
      {isCompanionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Monitor className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ModusDesk GSThub Desktop Companion
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Required for 1-Click GST Portal Auto-Login on your computer
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCompanionModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Real-time Status Card */}
              <div
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  companionOnline
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      companionOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span className="text-xs font-semibold">
                    {companionOnline
                      ? 'Connected & Ready (localhost:9090)'
                      : 'Companion Service is currently offline'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const health = await checkCompanionHealth();
                    setCompanionOnline(health.status === 'HEALTHY');
                  }}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  Refresh Status
                </button>
              </div>

              {/* Action 1: Instant Web Launch */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Option 1: Launch Companion Directly
                </h4>
                <p className="text-[11px] text-slate-500">
                  If already configured on this PC, click below to start the companion immediately in the background.
                </p>
                <button
                  type="button"
                  onClick={handleStartCompanion}
                  disabled={isStartingCompanion || companionOnline}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  {isStartingCompanion ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Starting Companion...</span>
                    </>
                  ) : companionOnline ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Already Running &amp; Ready</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white" />
                      <span>Start Desktop Companion Now</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-400 italic text-center">
                  When Chrome prompts &quot;Open ModusDesk Protocol?&quot;, click Open.
                </p>
              </div>

              {/* Action 2: 1-Click Auto-Start Installer */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  Option 2: 1-Click Auto-Start Setup (Recommended)
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  First time on this computer? Download our 1-click setup file to configure automatic startup whenever Windows turns on.
                </p>
                <div className="pt-1">
                  <a
                    href="/api/download/companion"
                    download="ModusDesk-GST-Companion-Setup.bat"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>Download 1-Click Setup (.bat)</span>
                  </a>
                </div>
                <div className="text-[10.5px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200/80 space-y-1">
                  <p className="font-semibold text-slate-700">How to use:</p>
                  <p>1. Download and double-click the file once.</p>
                  <p>2. It configures Windows to auto-start the companion on PC boot forever.</p>
                  <p>3. You can also double-click &quot;ModusDesk GST Companion&quot; on your Desktop anytime.</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10.5px] text-slate-400">
                Desktop Companion listens strictly on 127.0.0.1:9090
              </span>
              <button
                type="button"
                onClick={() => setIsCompanionModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
