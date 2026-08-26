'use client';

import React from 'react';
import type { BatchQueueItem, ReturnType } from '@/lib/downloader-types';

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
  const getReturnTypeBadge = (type: ReturnType) => {
    switch (type) {
      case 'GSTR1':
        return <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-700">GSTR-1</span>;
      case 'GSTR3B':
        return <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700">GSTR-3B</span>;
      case 'GSTR2B':
        return <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-extrabold text-teal-700">GSTR-2B</span>;
      case 'ARN_RECEIPT':
        return <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">ARN Receipt</span>;
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-xs">
        <span className="text-3xl">📦</span>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Queue is empty</h3>
        <p className="mt-1 text-xs text-gray-500">Select at least one client and return type above to populate the extraction queue.</p>
      </div>
    );
  }

  const readyCount = items.filter((i) => i.status === 'READY').length;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
      {/* Table Top Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50/75 px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Extraction & Preview Queue ({items.length} Tasks)
          </h3>
          {readyCount > 0 && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
              {readyCount} Ready for Preview
            </span>
          )}
        </div>

        <button
          onClick={onFetchAll}
          disabled={isFetchingAll}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-all ${
            isFetchingAll
              ? 'bg-blue-400 cursor-wait'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          <span className={isFetchingAll ? 'animate-spin' : ''}>⚡</span>
          {isFetchingAll ? 'Extracting Returns...' : 'Extract All Selected for Preview'}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-100/60 text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-4">Client</th>
              <th className="py-2.5 px-3">GSTIN</th>
              <th className="py-2.5 px-3 text-center">Return Package</th>
              <th className="py-2.5 px-3 text-center">Tax Period</th>
              <th className="py-2.5 px-3 text-center">Extraction Status</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                {/* Client Info */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 font-mono">
                      {item.clientCode}
                    </span>
                    <span className="font-semibold text-gray-900">{item.clientName}</span>
                  </div>
                </td>

                {/* GSTIN */}
                <td className="py-3 px-3 font-mono text-gray-700 text-[11px]">
                  {item.gstin}
                </td>

                {/* Return Type */}
                <td className="py-3 px-3 text-center">
                  {getReturnTypeBadge(item.returnType)}
                </td>

                {/* Period */}
                <td className="py-3 px-3 text-center font-semibold text-gray-800">
                  {item.period}
                </td>

                {/* Status */}
                <td className="py-3 px-3 text-center">
                  {item.status === 'READY' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 border border-green-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Parsed & Ready
                    </span>
                  ) : item.status === 'FETCHING' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200 animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      Extracting...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400">
                      ⏳ Queued
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Visual Preview Button */}
                    <button
                      onClick={() => onPreviewItem(item)}
                      className="rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 text-xs font-bold transition-colors border border-blue-200"
                    >
                      👁 Visual Preview
                    </button>

                    {/* On-Demand Export Button */}
                    <button
                      onClick={() => onExportItem(item)}
                      title="Export clean spreadsheet without cluttering storage"
                      className="rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-2 py-1 text-xs font-medium transition-colors shadow-xs"
                    >
                      📥 Export
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
