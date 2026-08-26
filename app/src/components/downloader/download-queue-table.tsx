'use client';

import React from 'react';
import type { BatchQueueItem } from '@/lib/downloader-types';
import { Eye, Download, Sparkles, CheckCircle2 } from 'lucide-react';

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
  const getReturnTypeBadge = (type: string) => {
    switch (type) {
      case 'GSTR1':
        return (
          <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
            GSTR-1
          </span>
        );
      case 'GSTR3B':
        return (
          <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
            GSTR-3B
          </span>
        );
      case 'GSTR2B':
        return (
          <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            GSTR-2B
          </span>
        );
      case 'ARN_RECEIPT':
        return (
          <span className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-800">
            ARN Receipt
          </span>
        );
      default:
        return (
          <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="card-enterprise bg-white border border-slate-200 shadow-xs overflow-hidden space-y-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/90 bg-slate-50/60 p-4">
        <div>
          <span className="text-label-caps text-slate-500">Step 3</span>
          <h3 className="text-headline-sm font-bold text-slate-900">
            Extraction & Preview Queue ({items.length} Target Returns)
          </h3>
          <p className="text-body-sm text-slate-500 mt-0.5">
            Preview-First Architecture: Instant interactive inspection without storage clutter.
          </p>
        </div>

        <button
          onClick={onFetchAll}
          disabled={isFetchingAll || items.length === 0}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-2xs transition-all ${
            isFetchingAll
              ? 'bg-emerald-400 cursor-wait'
              : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/20 cursor-pointer'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isFetchingAll ? 'Extracting Returns...' : `Extract All (${items.length})`}</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto table-scroll">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4 font-bold text-slate-700">Code</th>
              <th className="py-3 px-4 font-bold text-slate-700">Client Legal Entity</th>
              <th className="py-3 px-4 font-bold text-slate-700">GSTIN</th>
              <th className="py-3 px-4 font-bold text-slate-700">Return Type</th>
              <th className="py-3 px-4 font-bold text-slate-700">Period</th>
              <th className="py-3 px-4 font-bold text-slate-700 text-center">Status</th>
              <th className="py-3 px-4 font-bold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-jetbrains font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                    {item.clientCode}
                  </span>
                </td>
                <td className="py-3 px-4 font-bold text-slate-900">{item.clientName}</td>
                <td className="py-3 px-4 font-jetbrains text-[11px] font-semibold text-slate-600">
                  {item.gstin}
                </td>
                <td className="py-3 px-4">{getReturnTypeBadge(item.returnType)}</td>
                <td className="py-3 px-4 font-jetbrains text-slate-700 font-medium">{item.period}</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    READY
                  </span>
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onPreviewItem(item)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-2.5 py-1 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Visual Preview</span>
                    </button>

                    <button
                      onClick={() => onExportItem(item)}
                      className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-2 py-1 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                      title="Download JSON / CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
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
