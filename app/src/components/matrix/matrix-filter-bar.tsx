'use client';

import React from 'react';

interface MatrixFilterBarProps {
  period: string;
  availablePeriods: string[];
  onPeriodChange: (p: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  isSyncing: boolean;
  onTriggerSync: () => void;
  onExportCsv: () => void;
}

export function MatrixFilterBar({
  period,
  availablePeriods,
  onPeriodChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  isSyncing,
  onTriggerSync,
  onExportCsv,
}: MatrixFilterBarProps) {
  const filterPills = [
    { key: 'ALL', label: 'All Clients' },
    { key: 'PENDING_GSTR1', label: 'Pending GSTR-1' },
    { key: 'PENDING_GSTR3B', label: 'Pending GSTR-3B' },
    { key: 'FULLY_FILED', label: 'Fully Filed ✅' },
    { key: 'OVERDUE', label: 'Overdue ⚠️' },
    { key: 'QRMP', label: 'QRMP Only' },
  ];

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
      {/* Top Row: Period Selector, Search & Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Tax Period:
            </label>
            <select
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
            >
              {availablePeriods.map((p) => (
                <option key={p} value={p}>
                  {p} (FY 2026-27)
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search code, client, GSTIN, state..."
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 pl-8 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <span className="absolute left-2.5 top-2 text-xs text-gray-400">🔍</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Export Button */}
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-xs"
          >
            <span>📥</span> Export CSV
          </button>

          {/* Smart Delta Sync Button */}
          <button
            onClick={onTriggerSync}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all ${
              isSyncing
                ? 'bg-blue-400 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            <span className={isSyncing ? 'animate-spin' : ''}>🔄</span>
            {isSyncing ? 'Syncing Pending...' : 'Smart Delta Sync'}
          </button>
        </div>
      </div>

      {/* Bottom Row: Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3">
        <span className="text-[11px] font-medium text-gray-400 mr-1">Filter:</span>
        {filterPills.map((pill) => {
          const isSelected = statusFilter === pill.key;
          return (
            <button
              key={pill.key}
              onClick={() => onStatusFilterChange(pill.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
