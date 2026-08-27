'use client';

import React, { useState, useMemo } from 'react';
import type { MatrixRow } from '@/lib/matrix-types';
import { RefreshCw, X } from 'lucide-react';

interface MatrixTableProps {
  records: MatrixRow[];
  onSyncRow: (clientId: string, period: string) => void;
  onQuickLogin: (record: MatrixRow) => void;
  syncingClientId: string | null;
}

export function MatrixTable({
  records,
  onSyncRow,
  onQuickLogin,
  syncingClientId,
}: MatrixTableProps) {
  // Column-specific filter states
  const [filterCode, setFilterCode] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterGstin, setFilterGstin] = useState('');
  const [filterScheme, setFilterScheme] = useState('ALL');
  const [filterGstr1, setFilterGstr1] = useState('ALL');
  const [filterGstr3b, setFilterGstr3b] = useState('ALL');

  const hasActiveFilters =
    Boolean(filterCode) ||
    Boolean(filterName) ||
    Boolean(filterGstin) ||
    filterScheme !== 'ALL' ||
    filterGstr1 !== 'ALL' ||
    filterGstr3b !== 'ALL';

  const resetFilters = () => {
    setFilterCode('');
    setFilterName('');
    setFilterGstin('');
    setFilterScheme('ALL');
    setFilterGstr1('ALL');
    setFilterGstr3b('ALL');
  };

  // Filter records based on in-column filter inputs
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterCode && !r.clientCode.toLowerCase().includes(filterCode.toLowerCase().trim())) {
        return false;
      }
      if (filterName && !r.clientName.toLowerCase().includes(filterName.toLowerCase().trim())) {
        return false;
      }
      if (filterGstin && !r.gstin.toLowerCase().includes(filterGstin.toLowerCase().trim())) {
        return false;
      }
      if (filterScheme !== 'ALL' && (r.frequency || 'MONTHLY') !== filterScheme) {
        return false;
      }
      if (filterGstr1 !== 'ALL' && r.gstr1Status !== filterGstr1) {
        return false;
      }
      if (filterGstr3b !== 'ALL' && r.gstr3bStatus !== filterGstr3b) {
        return false;
      }
      return true;
    });
  }, [records, filterCode, filterName, filterGstin, filterScheme, filterGstr1, filterGstr3b]);

  // Clean uniform status rendering: ONLY RED FOR OVERDUE
  const renderStatus = (status: string) => {
    if (status === 'OVERDUE') {
      return <span className="font-semibold text-rose-600 text-xs whitespace-nowrap">Overdue</span>;
    }
    if (status === 'FILED') {
      return <span className="text-slate-700 font-normal text-xs whitespace-nowrap">Filed</span>;
    }
    if (status === 'NOT_APPLICABLE') {
      return <span className="text-slate-700 font-normal text-xs whitespace-nowrap">N/A</span>;
    }
    return <span className="text-slate-700 font-normal text-xs whitespace-nowrap">Pending</span>;
  };

  const renderScheme = (scheme?: string) => {
    switch (scheme) {
      case 'QRMP':
        return <span className="text-slate-700 font-normal text-xs whitespace-nowrap">QRMP</span>;
      case 'COMPOSITION':
        return <span className="text-slate-700 font-normal text-xs whitespace-nowrap">Composition</span>;
      case 'MONTHLY':
      default:
        return <span className="text-slate-700 font-normal text-xs whitespace-nowrap">Monthly</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header with Column Names & In-Column Filters */}
          <thead className="bg-slate-50/80 border-b border-slate-200/80 sticky top-0 z-10 select-none">
            {/* Row 1: Single Line Column Names (whitespace-nowrap) */}
            <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-700 whitespace-nowrap">
              <th className="py-2.5 px-3.5 whitespace-nowrap">Code</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Client Legal Name</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">GSTIN</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Scheme</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">GSTR-1 Status</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">GSTR-3B / CMP-08</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Actions</th>
            </tr>

            {/* Row 2: In-Column Filters directly below column names */}
            <tr className="border-t border-slate-200/60 bg-slate-50/40 text-xs font-normal whitespace-nowrap">
              {/* Code Filter */}
              <th className="p-1.5 px-3.5">
                <input
                  type="text"
                  value={filterCode}
                  onChange={(e) => setFilterCode(e.target.value)}
                  placeholder="Filter code"
                  className="w-20 px-2 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 font-mono"
                />
              </th>

              {/* Name Filter */}
              <th className="p-1.5 px-3.5">
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="Filter client name"
                  className="min-w-[180px] w-full px-2 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500"
                />
              </th>

              {/* GSTIN Filter */}
              <th className="p-1.5 px-3.5">
                <input
                  type="text"
                  value={filterGstin}
                  onChange={(e) => setFilterGstin(e.target.value)}
                  placeholder="Filter GSTIN"
                  className="w-32 px-2 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 font-mono"
                />
              </th>

              {/* Scheme Filter */}
              <th className="p-1.5 px-3.5">
                <select
                  value={filterScheme}
                  onChange={(e) => setFilterScheme(e.target.value)}
                  className="w-24 px-1.5 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 text-slate-700 cursor-pointer"
                >
                  <option value="ALL">All</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QRMP">QRMP</option>
                  <option value="COMPOSITION">Composition</option>
                </select>
              </th>

              {/* GSTR-1 Status Filter */}
              <th className="p-1.5 px-3.5">
                <select
                  value={filterGstr1}
                  onChange={(e) => setFilterGstr1(e.target.value)}
                  className="w-24 px-1.5 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 text-slate-700 cursor-pointer"
                >
                  <option value="ALL">All</option>
                  <option value="FILED">Filed</option>
                  <option value="PENDING">Pending</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="NOT_APPLICABLE">N/A</option>
                </select>
              </th>

              {/* GSTR-3B / CMP-08 Filter */}
              <th className="p-1.5 px-3.5">
                <select
                  value={filterGstr3b}
                  onChange={(e) => setFilterGstr3b(e.target.value)}
                  className="w-24 px-1.5 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 text-slate-700 cursor-pointer"
                >
                  <option value="ALL">All</option>
                  <option value="FILED">Filed</option>
                  <option value="PENDING">Pending</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </th>

              {/* Reset Filter Button */}
              <th className="p-1.5 px-3.5 text-right">
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10.5px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors cursor-pointer"
                    title="Clear all column filters"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400 text-xs whitespace-nowrap">
                  No matching clients found for the selected filters.
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => {
                const isSyncingRow = syncingClientId === record.clientId;

                return (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {/* Client Code (Plain text, no box) */}
                    <td className="py-2.5 px-3.5 text-slate-700 font-mono text-xs font-normal whitespace-nowrap">
                      {record.clientCode}
                    </td>

                    {/* Legal Entity (Uniform font, color, weight) */}
                    <td className="py-2.5 px-3.5 text-slate-700 text-xs font-normal whitespace-nowrap">
                      {record.clientName}
                    </td>

                    {/* GSTIN (Uniform font, color, weight) */}
                    <td className="py-2.5 px-3.5 text-slate-700 font-mono text-xs font-normal whitespace-nowrap">
                      {record.gstin}
                    </td>

                    {/* Scheme */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {renderScheme(record.frequency)}
                    </td>

                    {/* GSTR-1 Status */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {renderStatus(record.gstr1Status)}
                    </td>

                    {/* GSTR-3B / CMP-08 Status */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {renderStatus(record.gstr3bStatus)}
                    </td>

                    {/* Row Actions */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Login (Clean, No Icon) */}
                        <button
                          onClick={() => onQuickLogin(record)}
                          className="px-2.5 py-1 text-[11px] font-normal rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title={`Quick Login for ${record.clientName}`}
                        >
                          Login
                        </button>

                        {/* Row Check Portal Status */}
                        <button
                          onClick={() => onSyncRow(record.clientId, record.period)}
                          disabled={isSyncingRow}
                          className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                          title="Check latest portal filing status for this client"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingRow ? 'animate-spin text-emerald-600' : ''}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
