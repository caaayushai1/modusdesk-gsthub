'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, AlertCircle } from 'lucide-react';

export interface WatchlistItem {
  clientCode: string;
  clientName: string;
  gstin: string;
  issue: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
}

interface DefaulterWatchlistProps {
  items: WatchlistItem[];
}

export function DefaulterWatchlist({ items }: DefaulterWatchlistProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <h2 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
            Action Watchlist
          </h2>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
          {items.length} Flagged
        </span>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto custom-scrollbar">
        {items.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No compliance flags detected.
          </div>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className="p-3 hover:bg-slate-50/60 transition-colors space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1 py-0.2 rounded shrink-0">
                    {item.clientCode}
                  </span>
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    {item.clientName}
                  </span>
                </div>
                <span className="text-[9.5px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded shrink-0">
                  {item.severity}
                </span>
              </div>

              <p className="text-[11px] text-slate-700 leading-tight">
                {item.issue}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                <span>{item.gstin}</span>
                <span className="font-sans font-semibold text-slate-700">{item.action}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Link */}
      <div className="p-2 border-t border-slate-100 bg-slate-50/40 text-center">
        <Link
          href="/matrix"
          className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
        >
          <span>Open Full Practice Matrix</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
