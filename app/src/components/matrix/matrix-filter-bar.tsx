'use client';

import React from 'react';
import { Search, Download, RefreshCw, Calendar, Filter } from 'lucide-react';

interface MatrixFilterBarProps {
  periods: string[];
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExportCsv: () => void;
  onSyncAll: () => void;
  isSyncing: boolean;
}

export function MatrixFilterBar({
  periods,
  selectedPeriod,
  onPeriodChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
  onExportCsv,
  onSyncAll,
  isSyncing,
}: MatrixFilterBarProps) {
  const statusOptions = [
    { key: 'ALL', label: 'All Clients' },
    { key: 'PENDING_GSTR1', label: 'Pending GSTR-1' },
    { key: 'PENDING_GSTR3B', label: 'Pending GSTR-3B' },
    { key: 'OVERDUE', label: 'Overdue Only' },
    { key: 'FULLY_FILED', label: 'Fully Filed' },
    { key: 'QRMP', label: 'QRMP Quarterly' },
  ];

  return (
    <div className="card-enterprise p-4 bg-white border border-slate-200 shadow-xs space-y-3">
      {/* Top Row: Period, Search, and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: Period Dropdown & Live Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Selector */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="appearance-none rounded-xl border border-slate-300 bg-slate-50/70 pl-8 pr-7 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:bg-white focus:border-emerald-500 outline-none cursor-pointer"
            >
              {periods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search client, GSTIN, code..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 outline-none transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onSyncAll}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-all ${
              isSyncing
                ? 'bg-emerald-400 cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/20 cursor-pointer'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Smart Sync Delta'}</span>
          </button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
        <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Status:
        </span>
        {statusOptions.map((opt) => {
          const isSelected = statusFilter === opt.key;

          return (
            <button
              key={opt.key}
              onClick={() => onStatusFilterChange(opt.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
