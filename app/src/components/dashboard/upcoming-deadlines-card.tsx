'use client';

import React from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Deadline {
  returnType: string;
  description: string;
  dueDate: string;
  daysRemaining: number;
  status: string;
  category: string;
}

interface UpcomingDeadlinesCardProps {
  deadlines: Deadline[];
}

export function UpcomingDeadlinesCard({ deadlines }: UpcomingDeadlinesCardProps) {
  const getBadge = (days: number, status: string) => {
    if (days < 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          Overdue ({Math.abs(days)}d ago)
        </span>
      );
    } else if (days <= 2) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800 animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Due in {days} day{days === 1 ? '' : 's'}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          In {days} days
        </span>
      );
    }
  };

  return (
    <div className="card-enterprise bg-white border border-slate-200 shadow-xs overflow-hidden">
      <div className="border-b border-slate-100 p-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-headline-sm font-bold text-slate-900">
              Statutory GST Compliance Calendar
            </h3>
            <p className="text-[11px] text-slate-500">Upcoming filing milestones & critical cut-offs</p>
          </div>
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 font-jetbrains">
          Aug - Sep 2026
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {deadlines.map((d, idx) => (
          <div key={idx} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900">{d.returnType}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9.5px] font-semibold text-slate-600">
                  {d.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{d.description}</p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center">
              <span className="font-jetbrains text-xs font-semibold text-slate-700">
                {d.dueDate}
              </span>
              {getBadge(d.daysRemaining, d.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
