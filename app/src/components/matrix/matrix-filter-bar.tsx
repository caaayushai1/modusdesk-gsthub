'use client';

import React from 'react';
import { Search, Download, RefreshCw, Filter } from 'lucide-react';

interface MatrixFilterBarProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  schemeFilter: string;
  onSchemeFilterChange: (scheme: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExportCsv: () => void;
  onSyncAll: () => void;
  isSyncing: boolean;
}

export function MatrixFilterBar({
  statusFilter,
  onStatusFilterChange,
  schemeFilter,
  onSchemeFilterChange,
  searchQuery,
  onSearchChange,
  onExportCsv,
  onSyncAll,
  isSyncing,
}: MatrixFilterBarProps) {
  const statusOptions = [
    { key: 'ALL', label: 'All Statuses' },
    { key: 'PENDING', label: 'Pending Filings' },
    { key: 'PENDING_GSTR1', label: 'Pending GSTR-1' },
    { key: 'PENDING_GSTR3B', label: 'Pending GSTR-3B' },
    { key: 'OVERDUE', label: 'Overdue Only' },
    { key: 'FULLY_FILED', label: 'Fully Filed' },
  ];

  const schemeOptions = [
    { key: 'ALL', label: 'All Schemes' },
    { key: 'MONTHLY', label: 'Monthly Regular' },
    { key: 'QRMP', label: 'QRMP Quarterly' },
    { key: 'COMPOSITION', label: 'Composition Scheme' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3">
      {/* Top Row: Search Input & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        {/* Live Search Input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by client name, client code, or GSTIN..."
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl pl-9 pr-3.5 py-1.5 text-xs border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2 pointer-events-none" />
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Download matrix data as CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onSyncAll}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Connects with GST Portal to check if clients have newly filed returns"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Checking Portal...' : 'Check Portal Status'}</span>
          </button>
        </div>
      </div>

      {/* Multi-Dimensional Filter Dropdowns & Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold uppercase tracking-wider mr-1">
          <Filter className="w-3 h-3 text-slate-400" />
          <span>Filter:</span>
        </div>

        {/* Status Dropdown Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
        >
          {statusOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Scheme Dropdown Filter */}
        <select
          value={schemeFilter}
          onChange={(e) => onSchemeFilterChange(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
        >
          {schemeOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Quick Clear Filter Link */}
        {(statusFilter !== 'ALL' || schemeFilter !== 'ALL' || searchQuery) && (
          <button
            onClick={() => {
              onStatusFilterChange('ALL');
              onSchemeFilterChange('ALL');
              onSearchChange('');
            }}
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 ml-auto cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
