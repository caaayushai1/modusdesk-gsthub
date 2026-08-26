'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { MatrixRow, MatrixMetrics } from '@/lib/matrix-types';
import { MatrixSummaryCards } from '@/components/matrix/matrix-summary-cards';
import { MatrixFilterBar } from '@/components/matrix/matrix-filter-bar';
import { MatrixTable } from '@/components/matrix/matrix-table';
import { LayoutGrid } from 'lucide-react';

export default function MatrixPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-07');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [records, setRecords] = useState<MatrixRow[]>([]);
  const [metrics, setMetrics] = useState<MatrixMetrics>({
    totalGstins: 0,
    gstr1FiledCount: 0,
    gstr1Percentage: 0,
    gstr3bFiledCount: 0,
    gstr3bPercentage: 0,
    fullyFiledCount: 0,
    pendingCount: 0,
    overdueCount: 0,
  });
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncingClientId, setSyncingClientId] = useState<string | null>(null);

  // Fetch Matrix Data from API
  const fetchMatrixData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        period: selectedPeriod,
        status: statusFilter,
        search: searchQuery,
      });

      const res = await fetch(`/api/matrix?${params.toString()}`);
      const json = await res.json();

      if (json.rows) {
        setRecords(json.rows);
        setMetrics(json.metrics);
        if (json.availablePeriods && json.availablePeriods.length > 0) {
          setAvailablePeriods(json.availablePeriods);
        }
      }
    } catch (err) {
      console.error('Failed to fetch matrix data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod, statusFilter, searchQuery]);

  useEffect(() => {
    fetchMatrixData();
  }, [fetchMatrixData]);

  // Handle Smart Delta Sync for ALL pending/overdue records
  const handleSyncAll = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/matrix/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: selectedPeriod }),
      });

      const json = await res.json();
      if (json.success) {
        await fetchMatrixData();
      }
    } catch (err) {
      console.error('Sync all failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Smart Delta Sync for a SINGLE client row
  const handleSyncRow = async (clientId: string, period: string) => {
    try {
      setSyncingClientId(clientId);
      const res = await fetch('/api/matrix/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, clientId }),
      });

      const json = await res.json();
      if (json.success) {
        await fetchMatrixData();
      }
    } catch (err) {
      console.error('Sync row failed:', err);
    } finally {
      setSyncingClientId(null);
    }
  };

  // Handle Quick Login from table row
  const handleQuickLogin = async (record: MatrixRow) => {
    try {
      const response = await fetch('http://127.0.0.1:9090/launch-gst-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gstin: record.gstin,
          username: 'admin_' + record.clientCode.toLowerCase(),
          password: 'Password@2026',
        }),
      });

      const data = await response.json();
      if (!data.success) {
        alert(`Login failed: ${data.error}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Companion offline';
      alert(`Could not connect to Desktop Companion: ${msg}. Make sure start-companion.bat is running.`);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (records.length === 0) return;

    const headers = [
      'Client Code',
      'Client Name',
      'GSTIN',
      'Period',
      'Frequency',
      'GSTR-1 Status',
      'GSTR-1 ARN',
      'GSTR-3B Status',
      'GSTR-3B ARN',
      'Last Synced At',
    ];

    const rows = records.map((r) => [
      `"${r.clientCode}"`,
      `"${r.clientName}"`,
      `"${r.gstin}"`,
      `"${r.period}"`,
      `"${r.isQrmp ? 'QUARTERLY' : 'MONTHLY'}"`,
      `"${r.gstr1Status}"`,
      `"${r.gstr1Arn || ''}"`,
      `"${r.gstr3bStatus}"`,
      `"${r.gstr3bArn || ''}"`,
      `"${r.lastSyncedAt}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GST_Filing_Matrix_${selectedPeriod}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg font-bold text-slate-900">
              Practice Filing Matrix
            </h1>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
              Smart Delta Sync
            </span>
          </div>
          <p className="text-body-md text-slate-500 mt-1">
            Real-time compliance monitoring across all client GSTINs with automated return status verification.
          </p>
        </div>
      </div>

      {/* 1. Summary Cards */}
      <MatrixSummaryCards
        metrics={metrics}
        selectedPeriod={selectedPeriod}
      />

      {/* 2. Filter & Search Bar */}
      <MatrixFilterBar
        periods={availablePeriods.length > 0 ? availablePeriods : ['2026-07', '2026-06', '2026-05', '2026-04']}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExportCsv={handleExportCsv}
        onSyncAll={handleSyncAll}
        isSyncing={isSyncing}
      />

      {/* 3. Filing Matrix Table */}
      {isLoading ? (
        <div className="card-enterprise p-16 text-center bg-white border border-slate-200 shadow-xs">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-body-sm text-slate-500 mt-3 font-medium">
            Loading filing matrix records...
          </p>
        </div>
      ) : (
        <MatrixTable
          records={records}
          onSyncRow={handleSyncRow}
          onQuickLogin={handleQuickLogin}
          syncingClientId={syncingClientId}
        />
      )}
    </div>
  );
}
