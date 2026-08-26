'use client';

import React from 'react';
import type { RecoBucket } from '@/lib/reco-types';

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
    { key: 'ALL', label: `All Items (${counts.all})`, color: 'bg-gray-100 text-gray-700' },
    { key: 'EXACT_MATCH', label: `🟢 Exact Match (${counts.exact})`, color: 'bg-emerald-50 text-emerald-700' },
    { key: 'VALUE_MISMATCH', label: `🟡 Value Mismatch (${counts.valueMismatch})`, color: 'bg-amber-50 text-amber-700' },
    { key: 'MISSING_IN_2B', label: `🔴 Missing in 2B (${counts.missingIn2b})`, color: 'bg-rose-50 text-rose-700' },
    { key: 'MISSING_IN_BOOKS', label: `🔵 Missing in Books (${counts.missingInBooks})`, color: 'bg-blue-50 text-blue-700' },
    { key: 'INELIGIBLE', label: `🟣 Ineligible 17(5) (${counts.ineligible})`, color: 'bg-purple-50 text-purple-700' },
  ];

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search supplier, GSTIN, invoice number..."
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 pl-8 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
          <span className="absolute left-2.5 top-2 text-xs text-gray-400">🔍</span>
        </div>

        {/* Tolerance & Export Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span>Rounding Tolerance:</span>
            <select
              value={tolerance}
              onChange={(e) => onToleranceChange(parseFloat(e.target.value))}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-800 focus:border-blue-500 outline-none cursor-pointer"
            >
              <option value="1">± ₹1.00</option>
              <option value="5">± ₹5.00</option>
              <option value="10">± ₹10.00</option>
            </select>
          </div>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-xs"
          >
            <span>📥</span> Export Reconciled Excel
          </button>
        </div>
      </div>

      {/* Bucket Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3">
        <span className="text-[11px] font-medium text-gray-400 mr-1">Classification:</span>
        {pills.map((p) => {
          const isSelected = activeBucket === p.key;

          return (
            <button
              key={p.key}
              onClick={() => onBucketChange(p.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
