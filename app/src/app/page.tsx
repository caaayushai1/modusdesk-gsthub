'use client';

import React from 'react';
import Link from 'next/link';
import { QuickLoginCard } from '@/components/quick-login-card';
import { 
  LayoutGrid, 
  DownloadCloud, 
  FileSpreadsheet, 
  Wallet, 
  BarChart3, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap
} from 'lucide-react';

export default function HomePage() {
  const modules = [
    {
      title: 'Practice Filing Matrix',
      description: 'Practice-wide multi-client compliance matrix, smart delta status sync, and overdue alerts across all GSTINs.',
      href: '/matrix',
      icon: LayoutGrid,
      tag: 'Live Compliance',
      accent: 'emerald',
    },
    {
      title: 'Bulk Return Downloader',
      description: 'Preview-First statutory extractor: Multi-period mass extraction of GSTR-1, 3B, 2B & ARN receipts in browser memory.',
      href: '/downloader',
      icon: DownloadCloud,
      tag: 'Preview-First',
      accent: 'emerald',
    },
    {
      title: '2B vs Books Reco Studio',
      description: 'Intelligent 5-bucket matching engine: Fuzzy invoice normalization, at-risk ITC calculation & 1-click vendor notices.',
      href: '/reco',
      icon: FileSpreadsheet,
      tag: 'ITC Protection',
      accent: 'emerald',
    },
    {
      title: 'Ledger & Offset Studio',
      description: 'Real-time cash and credit ledgers with interactive Section 49 / Rule 88A tax offset and PMT-06 cash challan calculator.',
      href: '/ledgers',
      icon: Wallet,
      tag: 'Rule 88A Engine',
      accent: 'emerald',
    },
    {
      title: 'CA MIS Statutory Suite',
      description: 'Statutory cross-reconciliations: Rule 88C (GSTR-1 vs 3B), Rule 88D (2B vs 3B), and Annual GSTR-9 schedules.',
      href: '/mis',
      icon: BarChart3,
      tag: 'Audit Ready',
      accent: 'emerald',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg font-bold text-slate-900">
              GST Compliance Studio
            </h1>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              Enterprise Practice Suite
            </span>
          </div>
          <p className="text-body-md text-slate-500 mt-1">
            Automated statutory filing workflows, instant 1-click portal login, and AI-powered reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/matrix"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2.5 text-xs font-bold shadow-2xs shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Open Filing Matrix</span>
          </Link>
        </div>
      </div>

      {/* 1-Click Login Card */}
      <QuickLoginCard />

      {/* Workspace Modules Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-headline-sm font-bold text-slate-900">
              Compliance Workspaces
            </h2>
            <p className="text-body-sm text-slate-500">
              Dedicated tools for practice-wide GST management, statutory audits, and returns.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((m) => {
            const Icon = m.icon;

            return (
              <Link
                key={m.href}
                href={m.href}
                className="group card-enterprise-hover p-5 flex flex-col justify-between cursor-pointer bg-white"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 group-hover:bg-emerald-100 transition-all">
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {m.tag}
                    </span>
                  </div>

                  <h3 className="mt-4 text-headline-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {m.title}
                  </h3>
                  <p className="mt-1.5 text-body-sm text-slate-500 line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform border-t border-slate-100 pt-3">
                  <span>Launch Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
