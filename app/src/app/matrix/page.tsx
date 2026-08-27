'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { MatrixRow } from '@/lib/matrix-types';
import { MatrixTable } from '@/components/matrix/matrix-table';
import { QuickLoginModal } from '@/components/quick-login/quick-login-modal';
import { triggerGSTLogin } from '@/lib/companion-client';
import { Download, RefreshCw } from 'lucide-react';

export default function MatrixPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-07');
  const [records, setRecords] = useState<MatrixRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncingClientId, setSyncingClientId] = useState<string | null>(null);

  // Quick Login Modal State
  const [isQuickLoginOpen, setIsQuickLoginOpen] = useState(false);

  // Fetch Matrix Data from API
  const fetchMatrixData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        period: selectedPeriod,
      });

      const res = await fetch(`/api/matrix?${params.toString()}`);
      const json = await res.json();

      if (json.rows) {
        setRecords(json.rows);
      }
    } catch (err) {
      console.error('Failed to fetch matrix data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchMatrixData();
  }, [fetchMatrixData]);

  // Handle checking portal status for all records
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

  // Handle checking portal status for a single row
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

  // Handle Quick Login for row
  const handleQuickLogin = async (record: MatrixRow) => {
    try {
      const res = await triggerGSTLogin({
        username: record.gstin,
        password: '',
      });

      if (!res.success) {
        window.open('https://services.gst.gov.in/services/login', '_blank');
      }
    } catch {
      window.open('https://services.gst.gov.in/services/login', '_blank');
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
      'Scheme',
      'GSTR-1 Status',
      'GSTR-3B Status',
    ];

    const csvRows = [
      headers.join(','),
      ...records.map((r) =>
        [
          `"${r.clientCode}"`,
          `"${r.clientName.replace(/"/g, '""')}"`,
          `"${r.gstin}"`,
          `"${r.period}"`,
          `"${r.frequency || 'MONTHLY'}"`,
          `"${r.gstr1Status}"`,
          `"${r.gstr3bStatus}"`,
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GST_Filing_Matrix_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3.5 max-w-7xl animate-in fade-in duration-200">
      {/* Simple Clean Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Filing Matrix
          </h1>
        </div>

        {/* Top Actions: Export CSV & Check Portal Status */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Export full table data as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Connects with GST Portal to check if clients have newly filed returns"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Checking Portal...' : 'Check Portal Status'}</span>
          </button>
        </div>
      </div>

      {/* Matrix Table with In-Column Filters */}
      <MatrixTable
        records={records}
        onSyncRow={handleSyncRow}
        onQuickLogin={handleQuickLogin}
        syncingClientId={syncingClientId}
      />

      {/* Floating Quick Login Modal */}
      <QuickLoginModal
        isOpen={isQuickLoginOpen}
        onClose={() => setIsQuickLoginOpen(false)}
      />
    </div>
  );
}
