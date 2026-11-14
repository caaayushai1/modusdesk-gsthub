'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Zap, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  FileSpreadsheet, 
  DownloadCloud, 
  Calculator, 
  CheckCircle2,
  AlertTriangle,
  Boxes,
  ArrowRight
} from 'lucide-react';

interface ComingSoonViewProps {
  onOpenQuickLogin: () => void;
}

const MODULE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Executive Dashboard',
    subtitle: 'Practice-wide GST filing health and return statistics'
  },
  '/matrix': {
    title: 'Filing Matrix',
    subtitle: 'Client-by-client multi-period filing compliance tracker'
  },
  '/downloader': {
    title: 'Returns Downloader',
    subtitle: 'Automated batch ingestion of GSTR-1, GSTR-2B, and GSTR-3B'
  },
  '/reco': {
    title: 'Purchase Reconciliation',
    subtitle: 'GSTR-2B vs Purchase Register intelligent matching engine'
  },
  '/ledgers': {
    title: 'Cash & Credit Ledgers',
    subtitle: 'Live electronic ledger balances and statutory tax offset simulator'
  },
  '/mis': {
    title: 'CA MIS Suite',
    subtitle: 'Multi-period turnover comparisons, tax trends, and audit summaries'
  },
  '/settings': {
    title: 'Practice Settings',
    subtitle: 'GST Hub configuration, sync preferences, and companion status'
  }
};

export function ComingSoonView({ onOpenQuickLogin }: ComingSoonViewProps) {
  const pathname = usePathname();
  const currentModule = MODULE_TITLES[pathname] || {
    title: 'GST Hub Statutory Suite',
    subtitle: 'Comprehensive GST practice management for Chartered Accountants'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header with Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {currentModule.title}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Under Active Development
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentModule.subtitle}
          </p>
        </div>

        {/* Quick Action Button in Header */}
        <button
          onClick={onOpenQuickLogin}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>Launch Quick Login</span>
        </button>
      </div>

      {/* 2. Notice Card: Calibration & Suppression of Mock Data */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 text-amber-900 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">
              Live GST Portal Calibration in Progress
            </h3>
            <p className="text-slate-700 leading-relaxed">
              To guarantee absolute statutory compliance and prevent confusion, all placeholder and mock analytical data have been temporarily hidden. Live integration with GSTN APIs, scheduled batch downloads, and the dedicated <strong className="text-slate-900 font-semibold">GST Composition Scheme Module</strong> are actively being calibrated.
            </p>
            <p className="text-slate-600 pt-0.5">
              In the meantime, the <strong className="text-emerald-800 font-semibold">1-Click Quick Login</strong> utility in the top navigation bar is 100% operational.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Primary Feature Card: 1-Click Quick Login */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-slate-900 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Fully Operational & Ready</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              1-Click GST Portal Quick Login
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Launch the official GST Portal with pre-filled credentials in under 2 seconds. Search any client from your practice list, auto-fill login credentials from the encrypted CA vault, and complete filings without manual password lookups.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-emerald-200">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                AES-256-GCM Encrypted
              </span>
              <span>•</span>
              <span>Searchable Client Combobox</span>
              <span>•</span>
              <span>Zero-Leak Credential Vault</span>
            </div>
          </div>

          <div className="shrink-0 flex items-center">
            <button
              onClick={onOpenQuickLogin}
              className="w-full md:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-white hover:bg-emerald-50 active:bg-emerald-100 text-emerald-900 text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Zap className="w-4 h-4 fill-emerald-700 text-emerald-700" />
              <span>Launch Quick Login Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Upcoming Roadmap Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Upcoming Statutory Modules in Active Development</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">
            Release Phase 2
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Composition Scheme Module */}
          <div className="p-4 rounded-xl bg-white border-2 border-emerald-200/90 shadow-2xs hover:shadow-sm transition-shadow space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                <Boxes className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                NOW ACTIVE
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900">
              GST Composition Scheme Module
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Automated 1-click GSTR-2A quarterly import, auto-calculated Stock Ledger (Opening + Purchases + GP Margin - Sales = Closing Stock), Section 9(3)/9(4) RCM tax liability computation, and CMP-08 filing draft.
            </p>
            <div className="pt-1">
              <Link
                href="/composition"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 group"
              >
                <span>Open Composition Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2: Filing Matrix */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                In Calibration
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900">
              Live Statutory Filing Matrix
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Real-time filed vs pending compliance matrix across all practice clients for GSTR-1, GSTR-3B, and CMP-08, synced directly with GST portal filing timestamps.
            </p>
          </div>

          {/* Card 3: Returns Downloader */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
                <DownloadCloud className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                In Calibration
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900">
              Automated Returns Downloader
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Scheduled batch downloads of filed GSTR-1, GSTR-2B, and GSTR-3B returns in JSON and Excel formats for offline audits and working papers.
            </p>
          </div>

          {/* Card 4: Purchase Reconciliation */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Planned
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900">
              2B vs Purchase Reconciliation
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              AI-assisted 3-way invoice matching between client books and auto-drafted GSTR-2B. Automated vendor notice generator for missing or mismatched ITC.
            </p>
          </div>

          {/* Card 5: Cash & Credit Ledgers */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                <Calculator className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Planned
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900">
              Electronic Cash & Credit Ledgers
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Live portal balances for CGST, SGST, IGST, and Cess accounts, with intelligent offset recommendation engine to minimize cash outflow.
            </p>
          </div>

          {/* Card 6: Practice Security */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                Security
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900">
              Zero-Leak Security Architecture
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              All credentials remain encrypted using AES-256-GCM. Portal login dispatch runs via localhost loopback without transmitting plaintext passwords across public networks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
