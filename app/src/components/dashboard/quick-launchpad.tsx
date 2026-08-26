'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, LayoutGrid, DownloadCloud, FileSpreadsheet, Wallet, BarChart3, ArrowRight } from 'lucide-react';

export function QuickLaunchpad() {
  const actions = [
    {
      title: 'Practice Filing Matrix',
      description: 'Track multi-period compliance and trigger smart delta syncs across 40 accounts.',
      href: '/matrix',
      icon: LayoutGrid,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Bulk Return Downloader',
      description: 'Zero-storage in-memory preview for GSTR-1, 3B, 2B and official ARN receipts.',
      href: '/downloader',
      icon: DownloadCloud,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
    },
    {
      title: '2B Reco Studio',
      description: 'Reconcile Tally/Busy books with GSTR-2B. Generate vendor follow-up notices.',
      href: '/reco',
      icon: FileSpreadsheet,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      title: 'Electronic Ledgers & Offset',
      description: 'Inspect Cash & Credit balances. Simulate Section 49 / Rule 88A tax discharge.',
      href: '/ledgers',
      icon: Wallet,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      title: 'CA MIS Comparison Suite',
      description: 'Audit Rule 88C (1 vs 3B), Rule 88D (2B vs 3B), and compile Annual GSTR-9 schedules.',
      href: '/mis',
      icon: BarChart3,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
  ];

  return (
    <div className="card-enterprise bg-white border border-slate-200 shadow-xs p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 className="text-headline-sm font-bold text-slate-900">
            Practice Workflow Launchpad
          </h3>
          <p className="text-[11px] text-slate-500">Quick shortcuts to core GST compliance modules</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {actions.map((act, idx) => {
          const Icon = act.icon;

          return (
            <Link
              key={idx}
              href={act.href}
              className="group p-4 rounded-xl border border-slate-200/80 bg-white hover:border-emerald-400 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${act.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {act.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {act.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
