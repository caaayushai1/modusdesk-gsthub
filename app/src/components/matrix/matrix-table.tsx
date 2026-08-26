'use client';

import React from 'react';
import type { MatrixRow } from '@/lib/matrix-types';
import { Zap, RefreshCw, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

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
  const getStatusBadge = (status: string, arn: string | null) => {
    switch (status) {
      case 'FILED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            FILED
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            OVERDUE
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            PENDING
          </span>
        );
    }
  };

  if (records.length === 0) {
    return (
      <div className="card-enterprise p-12 text-center bg-white border border-slate-200 shadow-xs">
        <span className="text-3xl">🔍</span>
        <h3 className="mt-2 text-headline-sm font-semibold text-slate-900">
          No practice clients found
        </h3>
        <p className="text-body-sm text-slate-500 mt-1">
          Try changing your search query or filter pills above.
        </p>
      </div>
    );
  }

  return (
    <div className="card-enterprise bg-white border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="overflow-x-auto table-scroll">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider sticky top-0 z-10 backdrop-blur-xs">
            <tr>
              <th className="py-3 px-4 font-bold text-slate-700">Code</th>
              <th className="py-3 px-4 font-bold text-slate-700">Client Legal Entity</th>
              <th className="py-3 px-4 font-bold text-slate-700">GSTIN</th>
              <th className="py-3 px-4 font-bold text-slate-700 text-center">Filing Scheme</th>
              <th className="py-3 px-4 font-bold text-slate-700">GSTR-1 Status</th>
              <th className="py-3 px-4 font-bold text-slate-700">GSTR-3B Status</th>
              <th className="py-3 px-4 font-bold text-slate-700">Last Synced</th>
              <th className="py-3 px-4 font-bold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100">
            {records.map((record) => {
              const isSyncingRow = syncingClientId === record.clientId;

              return (
                <tr
                  key={record.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Client Code */}
                  <td className="py-3 px-4">
                    <span className="font-jetbrains font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                      {record.clientCode}
                    </span>
                  </td>

                  {/* Legal Entity */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 text-xs">
                      {record.clientName}
                    </div>
                  </td>

                  {/* GSTIN */}
                  <td className="py-3 px-4">
                    <span className="font-jetbrains text-[11px] font-semibold text-slate-700">
                      {record.gstin}
                    </span>
                  </td>

                  {/* Frequency / Scheme */}
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                        record.isQrmp
                          ? 'bg-purple-50 border-purple-200 text-purple-700'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {record.isQrmp ? 'QRMP Qtr' : 'Monthly'}
                    </span>
                  </td>

                  {/* GSTR-1 Status */}
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      {getStatusBadge(record.gstr1Status, record.gstr1Arn)}
                      {record.gstr1Arn && (
                        <div className="font-jetbrains text-[9.5px] text-slate-400 truncate max-w-[130px]">
                          ARN: {record.gstr1Arn}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* GSTR-3B Status */}
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      {getStatusBadge(record.gstr3bStatus, record.gstr3bArn)}
                      {record.gstr3bArn && (
                        <div className="font-jetbrains text-[9.5px] text-slate-400 truncate max-w-[130px]">
                          ARN: {record.gstr3bArn}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Last Synced Date */}
                  <td className="py-3 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(record.lastSyncedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSyncRow(record.clientId, record.period)}
                        disabled={isSyncingRow}
                        title="Smart Delta Sync Portal Status"
                        className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-2 py-1 text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncingRow ? 'animate-spin' : ''}`} />
                      </button>

                      <button
                        onClick={() => onQuickLogin(record)}
                        title="1-Click Headed Portal Login"
                        className="flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-2.5 py-1 text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
                      >
                        <Zap className="w-3 h-3 fill-emerald-700" />
                        <span>Login</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-[11px] text-slate-500 flex justify-between items-center">
        <span>Showing {records.length} practice GSTIN accounts</span>
        <span className="text-slate-400">Locking verified FILED returns • Real-time Delta Sync</span>
      </div>
    </div>
  );
}
