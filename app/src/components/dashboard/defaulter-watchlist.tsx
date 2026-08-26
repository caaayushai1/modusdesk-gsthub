'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface DefaulterItem {
  clientCode: string;
  clientName: string;
  gstin: string;
  issue: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
}

interface DefaulterWatchlistProps {
  items: DefaulterItem[];
}

export function DefaulterWatchlist({ items }: DefaulterWatchlistProps) {
  return (
    <div className="card-enterprise bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
      <div>
        <div className="border-b border-slate-100 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center animate-pulse">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-headline-sm font-bold text-slate-900">
                Action Watchlist
              </h3>
              <p className="text-[11px] text-slate-500">Accounts requiring immediate intervention</p>
            </div>
          </div>
          <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800">
            {items.length} Flagged
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {items.map((item, idx) => (
            <div key={idx} className="p-4 hover:bg-slate-50/80 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-jetbrains text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                    {item.clientCode}
                  </span>
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[170px]">
                    {item.clientName}
                  </span>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase ${
                    item.severity === 'HIGH'
                      ? 'bg-rose-50 border border-rose-200 text-rose-700'
                      : 'bg-amber-50 border border-amber-200 text-amber-700'
                  }`}
                >
                  {item.severity}
                </span>
              </div>

              <p className="text-[11px] text-rose-600 font-medium mt-1">
                ⚠️ {item.issue}
              </p>

              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[10.5px]">
                <span className="text-slate-400 font-jetbrains">{item.gstin}</span>
                <span className="font-semibold text-emerald-700">{item.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-100 p-3 bg-slate-50/60 text-center">
        <Link
          href="/matrix"
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
        >
          <span>Open Full Practice Matrix</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
