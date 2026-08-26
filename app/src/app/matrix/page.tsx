'use client';

import React, { useEffect, useState, useCallback } from 'react';
import type { MatrixApiResponse, MatrixRow } from '@/lib/matrix-types';
import { MatrixSummaryCards } from '@/components/matrix/matrix-summary-cards';
import { MatrixFilterBar } from '@/components/matrix/matrix-filter-bar';
import { MatrixTable } from '@/components/matrix/matrix-table';

export default function MatrixPage() {
  const [data, setData] = useState<MatrixApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('2026-07');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingRowId, setSyncingRowId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Fetch matrix data
  const fetchMatrix = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        period,
        status: statusFilter,
        search: searchQuery,
      });

      const res = await fetch(`/api/matrix?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch matrix data');
      const json: MatrixApiResponse = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error('Failed to load matrix:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period, statusFilter, searchQuery]);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  // Trigger Smart Delta Sync for all pending clients in period
  const handleTriggerDeltaSync = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/matrix/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      });
      const result = await res.json();

      setNotification({
        message: result.message || 'Smart Delta Sync completed!',
        type: 'success',
      });

      setTimeout(() => setNotification(null), 6000);
      await fetchMatrix();
    } catch (err: unknown) {
      console.error('Delta sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Trigger single row sync
  const handleSyncRow = async (row: MatrixRow) => {
    try {
      setSyncingRowId(row.id);
      const res = await fetch('/api/matrix/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, clientId: row.clientId }),
      });
      const result = await res.json();

      setNotification({
        message: `Synced ${row.clientName}: ${result.message}`,
        type: 'info',
      });

      setTimeout(() => setNotification(null), 5000);
      await fetchMatrix();
    } catch (err: unknown) {
      console.error('Row sync failed:', err);
    } finally {
      setSyncingRowId(null);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!data || data.rows.length === 0) return;

    const headers = ['Client Code', 'Client Name', 'GSTIN', 'State', 'Scheme', 'Period', 'GSTR-1 Status', 'GSTR-1 ARN', 'GSTR-3B Status', 'GSTR-3B ARN', 'GSTR-2B'];
    const csvRows = [
      headers.join(','),
      ...data.rows.map((r) =>
        [
          `"${r.clientCode}"`,
          `"${r.clientName}"`,
          `"${r.gstin}"`,
          `"${r.stateCode}"`,
          `"${r.isQrmp ? 'QRMP' : 'Monthly'}"`,
          `"${r.period}"`,
          `"${r.gstr1Status}"`,
          `"${r.gstr1Arn || ''}"`,
          `"${r.gstr3bStatus}"`,
          `"${r.gstr3bArn || ''}"`,
          `"${r.gstr2bGenerated ? 'Generated' : 'Pending'}"`,
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GST_Compliance_Matrix_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Practice GST Filing Matrix
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Real-time compliance tracking across all clients for GSTR-1, GSTR-3B, and GSTR-2B.
          </p>
        </div>

        {/* Live Sync Timestamp */}
        {data && (
          <div className="text-xs text-gray-500">
            FY <span className="font-semibold text-gray-800">{data.financialYear}</span> | Active Period: <span className="font-bold text-blue-600">{period}</span>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`rounded-lg p-3 text-xs font-medium border flex items-center justify-between transition-all ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-600 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      {data && <MatrixSummaryCards metrics={data.metrics} period={period} />}

      {/* Filter & Action Bar */}
      <MatrixFilterBar
        period={period}
        availablePeriods={data?.availablePeriods || ['2026-07', '2026-06', '2026-05', '2026-04']}
        onPeriodChange={setPeriod}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        isSyncing={isSyncing}
        onTriggerSync={handleTriggerDeltaSync}
        onExportCsv={handleExportCsv}
      />

      {/* Main Compliance Grid */}
      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-16 text-center shadow-xs">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-xs font-medium text-gray-500">Loading practice filing matrix...</p>
        </div>
      ) : (
        <MatrixTable
          rows={data?.rows || []}
          onSyncRow={handleSyncRow}
          syncingRowId={syncingRowId}
        />
      )}
    </div>
  );
}
