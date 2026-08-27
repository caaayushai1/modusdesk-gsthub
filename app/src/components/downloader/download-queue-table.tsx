'use client';

import React, { useState, useMemo } from 'react';
import type { BatchQueueItem } from '@/lib/downloader-types';
import { Eye, Download, X } from 'lucide-react';

interface DownloadQueueTableProps {
  items: BatchQueueItem[];
  onPreviewItem: (item: BatchQueueItem) => void;
  onExportItem: (item: BatchQueueItem) => void;
  onFetchAll: () => void;
  isFetchingAll: boolean;
}

export function DownloadQueueTable({
  items,
  onPreviewItem,
  onExportItem,
  onFetchAll,
  isFetchingAll,
}: DownloadQueueTableProps) {
  // In-column filter states
  const [filterCode, setFilterCode] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterGstin, setFilterGstin] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterPeriod, setFilterPeriod] = useState('ALL');

  const hasActiveFilters =
    Boolean(filterCode) ||
    Boolean(filterName) ||
    Boolean(filterGstin) ||
    filterType !== 'ALL' ||
    filterPeriod !== 'ALL';

  const resetFilters = () => {
    setFilterCode('');
    setFilterName('');
    setFilterGstin('');
    setFilterType('ALL');
    setFilterPeriod('ALL');
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterCode && !item.clientCode.toLowerCase().includes(filterCode.toLowerCase().trim())) {
        return false;
      }
      if (filterName && !item.clientName.toLowerCase().includes(filterName.toLowerCase().trim())) {
        return false;
      }
      if (filterGstin && !item.gstin.toLowerCase().includes(filterGstin.toLowerCase().trim())) {
        return false;
      }
      if (filterType !== 'ALL' && item.returnType !== filterType) {
        return false;
      }
      if (filterPeriod !== 'ALL' && item.period !== filterPeriod) {
        return false;
      }
      return true;
    });
  }, [items, filterCode, filterName, filterGstin, filterType, filterPeriod]);

  const formatReturnType = (type: string) => {
    switch (type) {
      case 'GSTR1':
        return 'GSTR-1';
      case 'GSTR3B':
        return 'GSTR-3B';
      case 'GSTR2B':
        return 'GSTR-2B';
      case 'ARN_RECEIPT':
        return 'ARN Receipt';
      default:
        return type;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header with Column Titles & Filters */}
          <thead className="bg-slate-50/80 border-b border-slate-200/80 sticky top-0 z-10 select-none">
            <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-700 whitespace-nowrap">
              <th className="py-2.5 px-3.5 whitespace-nowrap">Code</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Client Legal Name</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">GSTIN</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Return Type</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Period</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Status</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Actions</th>
            </tr>

            {/* In-Column Filters Row */}
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

              {/* Return Type Filter */}
              <th className="p-1.5 px-3.5">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-24 px-1.5 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 text-slate-700 cursor-pointer"
                >
                  <option value="ALL">All</option>
                  <option value="GSTR1">GSTR-1</option>
                  <option value="GSTR3B">GSTR-3B</option>
                  <option value="GSTR2B">GSTR-2B</option>
                  <option value="ARN_RECEIPT">ARN</option>
                </select>
              </th>

              {/* Period Filter */}
              <th className="p-1.5 px-3.5">
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="w-24 px-1.5 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 text-slate-700 cursor-pointer"
                >
                  <option value="ALL">All</option>
                  <option value="2026-07">2026-07</option>
                  <option value="2026-06">2026-06</option>
                  <option value="2026-05">2026-05</option>
                </select>
              </th>

              {/* Status Header Column placeholder */}
              <th className="p-1.5 px-3.5 text-slate-400 text-[11px] font-normal">
                Ready
              </th>

              {/* Reset Filter Button */}
              <th className="p-1.5 px-3.5 text-right">
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10.5px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors cursor-pointer"
                    title="Clear column filters"
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
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400 text-xs whitespace-nowrap">
                  No matching return items found in queue.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                  {/* Client Code (Plain text) */}
                  <td className="py-2.5 px-3.5 text-slate-700 font-mono text-xs font-normal whitespace-nowrap">
                    {item.clientCode}
                  </td>

                  {/* Client Name (Uniform text) */}
                  <td className="py-2.5 px-3.5 text-slate-700 text-xs font-normal whitespace-nowrap">
                    {item.clientName}
                  </td>

                  {/* GSTIN */}
                  <td className="py-2.5 px-3.5 text-slate-700 font-mono text-xs font-normal whitespace-nowrap">
                    {item.gstin}
                  </td>

                  {/* Return Type */}
                  <td className="py-2.5 px-3.5 text-slate-700 text-xs font-normal whitespace-nowrap">
                    {formatReturnType(item.returnType)}
                  </td>

                  {/* Period */}
                  <td className="py-2.5 px-3.5 text-slate-700 font-mono text-xs font-normal whitespace-nowrap">
                    {item.period}
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3.5 text-slate-700 text-xs font-normal whitespace-nowrap">
                    Ready
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onPreviewItem(item)}
                        className="px-2.5 py-1 text-[11px] font-normal rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="Interactive Preview"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => onExportItem(item)}
                        className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                        title="Export JSON/Excel"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
