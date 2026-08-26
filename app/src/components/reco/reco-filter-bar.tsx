'use client';

import React from 'react';
import { Search, Download, Filter } from 'lucide-react';

interface RecoFilterBarProps {
  activeBucket: string;
  onBucketChange: (bucket: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  tolerance: number;
  onToleranceChange: (t: number) => void;
  onExportCsv: () => void;
  counts: {
    all: number;
    exact: number;
    valueMismatch: number;
    missingIn2b: number;
    missingInBooks: number;
    ineligible: number;
  };
}

export function RecoFilterBar({
  activeBucket,
  onBucketChange,
  searchQuery,
  onSearchChange,
  tolerance,
  onToleranceChange,
  onExportCsv,
  counts,
}: RecoFilterBarProps) {
  const pills = [
    { key: 'ALL', label: `All Items (${counts.all})` },
    { key: 'EXACT_MATCH', label: `Exact Match (${counts.exact})` },
    { key: 'VALUE_MISMATCH', label: `Value Mismatch (${counts.valueMismatch})` },
    { key: 'MISSING_IN_2B', label: `Missing in 2B (${counts.missingIn2b})` },
    { key: 'MISSING_IN_BOOKS', label: `Missing in Books (${counts.missingInBooks})` },
    { key: 'INELIGIBLE', label: `Ineligible 17(5) (${counts.ineligible})` },
  ];

  return (
    <div className="card-enterprise p-4 bg-white border border-slate-200 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search supplier, GSTIN, invoice..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 outline-none transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        {/* Tolerance & Export Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-medium text-slate-400 text-[11px]">Rounding:</span>
            <select
              value={tolerance}
              onChange={(e) => onToleranceChange(parseFloat(e.target.value))}
              className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-800 focus:border-emerald-500 outline-none cursor-pointer"
            >
              <option value="1">± ₹1.00</option>
              <option value="5">± ₹5.00</option>
              <option value="10">± ₹10.00</option>
            </select>
          </div>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Reconciled Excel</span>
          </button>
        </div>
      </div>

      {/* Bucket Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
        <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Classify:
        </span>
        {pills.map((p) => {
          const isSelected = activeBucket === p.key;

          return (
            <button
              key={p.key}
              onClick={() => onBucketChange(p.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
