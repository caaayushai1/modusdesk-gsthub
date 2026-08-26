'use client';

import React from 'react';
import { Activity, RefreshCw, Zap, FileSpreadsheet, Calculator } from 'lucide-react';

interface ActivityItem {
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
        return <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />;
      case 'LOGIN':
        return <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />;
      case 'RECO':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />;
      case 'OFFSET':
      default:
        return <Calculator className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  return (
    <div className="card-enterprise bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
      <div>
        <div className="border-b border-slate-100 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-headline-sm font-bold text-slate-900">
                Compliance Live Stream
              </h3>
              <p className="text-[11px] text-slate-500">Automated actions & system events</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            Live
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {activities.map((act) => (
            <div key={act.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(act.type)}
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {act.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-jetbrains shrink-0 ml-2">
                    {act.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {act.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-100 p-3 bg-slate-50/60 text-center text-[11px] text-slate-400">
        All audit logs encrypted with AES-256
      </div>
    </div>
  );
}
