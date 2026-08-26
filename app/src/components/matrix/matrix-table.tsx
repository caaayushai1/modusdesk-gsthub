'use client';

import React from 'react';
import type { MatrixRow } from '@/lib/matrix-types';
import { triggerGSTLogin } from '@/lib/companion-client';

interface MatrixTableProps {
  rows: MatrixRow[];
  onSyncRow: (row: MatrixRow) => void;
  syncingRowId: string | null;
}

export function MatrixTable({ rows, onSyncRow, syncingRowId }: MatrixTableProps) {
  const handle1ClickLogin = async (row: MatrixRow) => {
    // For demo/interactive launch, triggers companion login with client's GSTIN
    await triggerGSTLogin({
      username: row.gstin,
      password: 'SamplePassword123',
    });
  };

  const renderStatusBadge = (status: 'FILED' | 'PENDING' | 'OVERDUE', arn?: string | null, date?: string | null) => {
    if (status === 'FILED') {
      return (
        <div className="flex flex-col">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            FILED
          </span>
          {arn && (
            <span className="text-[10px] text-gray-500 font-mono truncate max-w-[120px]" title={`ARN: ${arn}`}>
              {arn}
            </span>
          )}
          {date && (
            <span className="text-[9px] text-gray-400">
              {new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>
      );
    }

    if (status === 'OVERDUE') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          OVERDUE
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        PENDING
      </span>
    );
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-xs">
        <span className="text-3xl">🔍</span>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No clients match your filter</h3>
        <p className="mt-1 text-xs text-gray-500">Try adjusting your search query or status filter.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead className="border-b border-gray-200 bg-gray-50/80 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Client</th>
              <th className="py-3 px-4">GSTIN / State</th>
              <th className="py-3 px-3 text-center">Scheme</th>
              <th className="py-3 px-4">GSTR-1 / IFF</th>
              <th className="py-3 px-4">GSTR-3B</th>
              <th className="py-3 px-3 text-center">GSTR-2B</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100 font-normal text-gray-900">
            {rows.map((row) => {
              const isRowSyncing = syncingRowId === row.id;

              return (
                <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
                  {/* Client Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 font-mono">
                        {row.clientCode}
                      </span>
                      <span className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                        {row.clientName}
                      </span>
                    </div>
                  </td>

                  {/* GSTIN & State */}
                  <td className="py-3.5 px-4 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-800 text-[11px] font-medium">{row.gstin}</span>
                      <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-bold text-slate-600">
                        {row.stateCode}
                      </span>
                    </div>
                  </td>

                  {/* Scheme */}
                  <td className="py-3.5 px-3 text-center">
                    {row.isQrmp ? (
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200">
                        QRMP
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400">Monthly</span>
                    )}
                  </td>

                  {/* GSTR-1 */}
                  <td className="py-3.5 px-4">
                    {renderStatusBadge(row.gstr1Status, row.gstr1Arn, row.gstr1FilingDate)}
                  </td>

                  {/* GSTR-3B */}
                  <td className="py-3.5 px-4">
                    {renderStatusBadge(row.gstr3bStatus, row.gstr3bArn, row.gstr3bFilingDate)}
                  </td>

                  {/* GSTR-2B */}
                  <td className="py-3.5 px-3 text-center">
                    {row.gstr2bGenerated ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700">
                        ✅ Generated
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400">⏳ Pending</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Row Refresh Button */}
                      <button
                        onClick={() => onSyncRow(row)}
                        disabled={isRowSyncing}
                        title="Sync this client's portal status"
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors disabled:opacity-50"
                      >
                        <span className={`inline-block ${isRowSyncing ? 'animate-spin' : ''}`}>🔄</span>
                      </button>

                      {/* 1-Click Login Button */}
                      <button
                        onClick={() => handle1ClickLogin(row)}
                        title="1-Click Login to GST Portal for this client"
                        className="rounded bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        🔑 Login
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="border-t border-gray-200 bg-gray-50/50 px-4 py-2.5 text-[11px] text-gray-500 flex justify-between items-center">
        <span>Showing {rows.length} GST registrations</span>
        <span className="text-gray-400">Live Practice Compliance Snapshot</span>
      </div>
    </div>
  );
}
