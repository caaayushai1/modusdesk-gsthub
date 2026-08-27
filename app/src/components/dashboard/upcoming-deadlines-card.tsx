'use client';

import React, { useState } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle2, ChevronRight, Filter } from 'lucide-react';

export interface StatutoryDeadline {
  returnType: string;
  category: 'MONTHLY' | 'QRMP' | 'COMPOSITION' | 'ANNUAL' | 'OTHER';
  period: string;
  dueDate: string;
  dueTimestamp: number; // For sorting and days remaining calculation
  ruleSection: string;
}

const STATUTORY_RETURNS_CALENDAR: StatutoryDeadline[] = [
  {
    returnType: 'GSTR-7 (TDS under GST)',
    category: 'MONTHLY',
    period: 'Monthly (July 2026)',
    dueDate: '10 Aug 2026',
    dueTimestamp: new Date('2026-08-10').getTime(),
    ruleSection: 'Section 51 / Rule 66',
  },
  {
    returnType: 'GSTR-8 (TCS by E-Commerce)',
    category: 'MONTHLY',
    period: 'Monthly (July 2026)',
    dueDate: '10 Aug 2026',
    dueTimestamp: new Date('2026-08-10').getTime(),
    ruleSection: 'Section 52 / Rule 67',
  },
  {
    returnType: 'GSTR-1 (Monthly Outward)',
    category: 'MONTHLY',
    period: 'Monthly (July 2026)',
    dueDate: '11 Aug 2026',
    dueTimestamp: new Date('2026-08-11').getTime(),
    ruleSection: 'Section 37 / Rule 59',
  },
  {
    returnType: 'IFF (QRMP Invoice Facility)',
    category: 'QRMP',
    period: 'QRMP Month 1 (July 2026)',
    dueDate: '13 Aug 2026',
    dueTimestamp: new Date('2026-08-13').getTime(),
    ruleSection: 'Rule 59(2) QRMP',
  },
  {
    returnType: 'GSTR-1 (Quarterly QRMP)',
    category: 'QRMP',
    period: 'Q1 (Apr - Jun 2026)',
    dueDate: '13 Jul 2026',
    dueTimestamp: new Date('2026-07-13').getTime(),
    ruleSection: 'Section 37(1) Proviso',
  },
  {
    returnType: 'CMP-08 (Composition Statement)',
    category: 'COMPOSITION',
    period: 'Q1 (Apr - Jun 2026)',
    dueDate: '18 Jul 2026',
    dueTimestamp: new Date('2026-07-18').getTime(),
    ruleSection: 'Rule 62(1) / Section 10',
  },
  {
    returnType: 'GSTR-3B (Monthly Summary)',
    category: 'MONTHLY',
    period: 'Monthly (July 2026)',
    dueDate: '20 Aug 2026',
    dueTimestamp: new Date('2026-08-20').getTime(),
    ruleSection: 'Section 39 / Rule 61',
  },
  {
    returnType: 'GSTR-3B (QRMP State Group 1)',
    category: 'QRMP',
    period: 'Q1 (Apr - Jun 2026)',
    dueDate: '22 Jul 2026',
    dueTimestamp: new Date('2026-07-22').getTime(),
    ruleSection: 'Rule 61(1) Group 1 States',
  },
  {
    returnType: 'GSTR-3B (QRMP State Group 2)',
    category: 'QRMP',
    period: 'Q1 (Apr - Jun 2026)',
    dueDate: '24 Jul 2026',
    dueTimestamp: new Date('2026-07-24').getTime(),
    ruleSection: 'Rule 61(1) Group 2 States',
  },
  {
    returnType: 'PMT-06 (QRMP Monthly Challan)',
    category: 'QRMP',
    period: 'QRMP Month 1 (July 2026)',
    dueDate: '25 Aug 2026',
    dueTimestamp: new Date('2026-08-25').getTime(),
    ruleSection: 'Rule 87 / Section 49',
  },
  {
    returnType: 'ITC-04 (Job Work Statement)',
    category: 'OTHER',
    period: 'H1 (Apr - Sep 2026)',
    dueDate: '25 Oct 2026',
    dueTimestamp: new Date('2026-10-25').getTime(),
    ruleSection: 'Rule 45(3) Job Work',
  },
  {
    returnType: 'GSTR-9 & 9C (Annual Return & Reco)',
    category: 'ANNUAL',
    period: 'FY 2025-26',
    dueDate: '31 Dec 2026',
    dueTimestamp: new Date('2026-12-31').getTime(),
    ruleSection: 'Section 44 / Rule 80',
  },
  {
    returnType: 'GSTR-4 (Composition Annual)',
    category: 'COMPOSITION',
    period: 'FY 2025-26',
    dueDate: '30 Apr 2027',
    dueTimestamp: new Date('2027-04-30').getTime(),
    ruleSection: 'Rule 62(1)(ii)',
  },
];

export function UpcomingDeadlinesCard() {
  const [filter, setFilter] = useState<'ALL' | 'MONTHLY' | 'QRMP' | 'ANNUAL'>('ALL');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredReturns = STATUTORY_RETURNS_CALENDAR.filter((item) => {
    if (filter === 'ALL') return true;
    return item.category === filter;
  });

  const getDueBadge = (dueDateString: string) => {
    const due = new Date(dueDateString);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[10.5px] font-bold shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          Overdue ({Math.abs(diffDays)}d)
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10.5px] font-bold shrink-0 animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Due Today
        </span>
      );
    }
    if (diffDays <= 3) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10.5px] font-bold shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Due in {diffDays}d
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10.5px] font-semibold shrink-0">
        In {diffDays}d
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Clean Header without redundant explanations */}
      <div className="p-3.5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <h2 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
            Statutory GST Compliance Calendar
          </h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-200/60 rounded-lg text-xs w-fit">
          {(['ALL', 'MONTHLY', 'QRMP', 'ANNUAL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'ALL' ? 'All Returns' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Statutory Calendar Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/30 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-2.5 px-3.5">Return Type</th>
              <th className="py-2.5 px-3.5">Period / Frequency</th>
              <th className="py-2.5 px-3.5">Statutory Section</th>
              <th className="py-2.5 px-3.5">Statutory Cut-Off</th>
              <th className="py-2.5 px-3.5 text-right">Filing Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredReturns.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-2.5 px-3.5 font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{item.returnType}</span>
                </td>
                <td className="py-2.5 px-3.5 text-slate-600 text-[11px]">
                  {item.period}
                </td>
                <td className="py-2.5 px-3.5 text-slate-400 font-mono text-[10px]">
                  {item.ruleSection}
                </td>
                <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-800 text-[11.5px]">
                  {item.dueDate}
                </td>
                <td className="py-2.5 px-3.5 text-right">
                  {getDueBadge(item.dueDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
