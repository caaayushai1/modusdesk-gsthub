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
          <div className="space-y-0.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              FILED
            </span>
            {arn && (
              <div className="text-[9.5px] text-slate-400 font-mono truncate max-w-[130px]">
                {arn}
              </div>
            )}
          </div>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            OVERDUE
          </span>
        );
      case 'NOT_APPLICABLE':
        return (
          <span className="text-[10px] text-slate-400 font-medium">
            N/A
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            PENDING
          </span>
        );
    }
  };

  const getSchemeBadge = (frequency?: string) => {
    switch (frequency) {
      case 'QRMP':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            QRMP
          </span>
        );
      case 'COMPOSITION':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Composition
          </span>
        );
      case 'MONTHLY':
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Monthly
          </span>
        );
    }
  };

  if (records.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200/90 shadow-2xs">
        <h3 className="text-xs sm:text-[13px] font-bold text-slate-900">
          No matching client records found
        </h3>
        <p className="text-[11px] text-slate-500 mt-1">
          Try adjusting your search query or filter selections above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead className="bg-slate-50/70 text-slate-600 font-semibold border-b border-slate-200/80 uppercase text-[10px] tracking-wider sticky top-0 z-10">
            <tr>
              <th className="py-2.5 px-3.5 font-bold text-slate-700">Code</th>
              <th className="py-2.5 px-3.5 font-bold text-slate-700">Client Legal Name</th>
              <th className="py-2.5 px-3.5 font-bold text-slate-700">GSTIN</th>
              <th className="py-2.5 px-3.5 font-bold text-slate-700">Scheme</th>
              <th className="py-2.5 px-3.5 font-bold text-slate-700">GSTR-1 Status</th>
              <th className="py-2.5 px-3.5 font-bold text-slate-700">GSTR-3B / CMP-08</th>
              <th className="py-2.5 px-3.5 font-bold text-slate-700">Last Checked</th>
              <th className="py-2.5 px-3.5 font-bold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100">
            {records.map((record) => {
              const isSyncingRow = syncingClientId === record.clientId;

              return (
                <tr
                  key={record.id}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  {/* Client Code */}
                  <td className="py-2.5 px-3.5">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10.5px] border border-slate-200">
                      {record.clientCode}
                    </span>
                  </td>

                  {/* Legal Entity */}
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900 text-xs">
                    <span className="line-clamp-1 max-w-[220px]">
                      {record.clientName}
                    </span>
                  </td>

                  {/* GSTIN */}
                  <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-700 font-medium">
                    {record.gstin}
                  </td>

                  {/* Scheme */}
                  <td className="py-2.5 px-3.5">
                    {getSchemeBadge(record.frequency)}
                  </td>

                  {/* GSTR-1 Status */}
                  <td className="py-2.5 px-3.5">
                    {getStatusBadge(record.gstr1Status, record.gstr1Arn)}
                  </td>

                  {/* GSTR-3B / CMP-08 Status */}
                  <td className="py-2.5 px-3.5">
                    {getStatusBadge(record.gstr3bStatus, record.gstr3bArn)}
                  </td>

                  {/* Last Synced */}
                  <td className="py-2.5 px-3.5 text-[10.5px] text-slate-400 font-mono">
                    {new Date(record.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>

                  {/* Row Actions */}
                  <td className="py-2.5 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* 1-Click Login Trigger */}
                      <button
                        onClick={() => onQuickLogin(record)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
                        title={`Launch Quick Login for ${record.clientName}`}
                      >
                        <Zap className="w-3 h-3 fill-emerald-700" />
                        <span>Login</span>
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
