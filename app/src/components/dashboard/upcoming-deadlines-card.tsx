'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { 
  StatutoryReturnEntry, 
  getActiveCalendar 
} from '@/lib/compliance-calendar';

export function UpcomingDeadlinesCard() {
  const [calendarEntries, setCalendarEntries] = useState<StatutoryReturnEntry[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'MONTHLY' | 'QRMP' | 'ANNUAL'>('ALL');

  useEffect(() => {
    setCalendarEntries(getActiveCalendar());
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter returns (already sorted chronologically by currentTimestamp ascending)
  const filteredReturns = calendarEntries.filter((item) => {
    if (filter === 'ALL') return true;
    return item.category === filter;
  });

  const getDueBadge = (dueDateString: string) => {
    const due = new Date(dueDateString);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="text-[11px] font-semibold text-rose-700 font-mono">
          Overdue ({Math.abs(diffDays)}d)
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="text-[11px] font-bold text-amber-800 font-mono">
          Due Today
        </span>
      );
    }
    if (diffDays <= 3) {
      return (
        <span className="text-[11px] font-semibold text-amber-700 font-mono">
          In {diffDays}d
        </span>
      );
    }
    return (
      <span className="text-[11px] font-medium text-slate-600 font-mono">
        In {diffDays}d
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Clean Header without in-card settings button */}
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
        <div className="flex items-center gap-1 p-0.5 bg-slate-200/60 rounded-lg text-xs">
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

      {/* Statutory Calendar Table (Sorted Chronologically, Clean & Simple) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/30 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-2.5 px-3.5">Return Type</th>
              <th className="py-2.5 px-3.5">Period / Frequency</th>
              <th className="py-2.5 px-3.5">Statutory Cut-Off</th>
              <th className="py-2.5 px-3.5 text-right">Timeline / Due Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredReturns.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                  <div className="flex items-center gap-2">
                    <span>{item.returnType}</span>
                    {item.isOverridden && (
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200"
                        title={item.extensionNote || 'Extended via official notification'}
                      >
                        Extended
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3.5 text-slate-500 text-[11px]">
                  {item.period}
                </td>
                <td className="py-2.5 px-3.5 font-mono font-medium text-slate-700 text-[11.5px]">
                  {item.currentDueDate}
                </td>
                <td className="py-2.5 px-3.5 text-right">
                  {getDueBadge(item.currentDueDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
