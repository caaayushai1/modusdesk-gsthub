'use client';

import React from 'react';
import { Activity, RefreshCw, Zap, FileSpreadsheet, Calculator, CheckCircle2 } from 'lucide-react';

export interface ActivityItem {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  description: string;
  status: string;
}

interface RecentActivityFeedProps {
  activities: ActivityItem[];
}

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'SYNC':
        return <RefreshCw className="w-3 h-3 text-emerald-600" />;
      case 'LOGIN':
        return <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />;
      case 'RECO':
        return <FileSpreadsheet className="w-3 h-3 text-blue-600" />;
      case 'OFFSET':
      default:
        return <Calculator className="w-3 h-3 text-indigo-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <h2 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
            Compliance Live Stream
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          Live
        </span>
      </div>

      {/* Activity Items */}
      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto custom-scrollbar">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No recent compliance events recorded.
          </div>
        ) : (
          activities.map((act) => (
            <div key={act.id} className="p-3 hover:bg-slate-50/60 transition-colors flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(act.type)}
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    {act.title}
                  </span>
                  <span className="text-[9.5px] text-slate-400 font-mono shrink-0">
                    {act.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {act.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
