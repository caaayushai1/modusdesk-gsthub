'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { MatrixRow, MatrixMetrics } from '@/lib/matrix-types';
import { MatrixFilterBar } from '@/components/matrix/matrix-filter-bar';
import { MatrixTable } from '@/components/matrix/matrix-table';
import { QuickLoginModal } from '@/components/quick-login/quick-login-modal';
import { triggerGSTLogin } from '@/lib/companion-client';

export default function MatrixPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-07');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [schemeFilter, setSchemeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
        status: statusFilter,
        scheme: schemeFilter,
        search: searchQuery,
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
  }, [selectedPeriod, statusFilter, schemeFilter, searchQuery]);

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
      'Frequency',
      'GSTR-1 Status',
      'GSTR-1 ARN',
      'GSTR-3B Status',
      'GSTR-3B ARN',
      'Last Synced At',
    ];

    const csvRows = [
      headers.join(','),
      ...records.map((r) =>
        [
          `"${r.clientCode}"`,
          `"${r.clientName.replace(/"/g, '""')}"`,
          `"${r.gstin}"`,
          `"${r.period}"`,
          `"${r.frequency}"`,
          `"${r.gstr1Status}"`,
          `"${r.gstr1Arn || ''}"`,
          `"${r.gstr3bStatus}"`,
          `"${r.gstr3bArn || ''}"`,
          `"${r.lastSyncedAt}"`,
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
    <div className="space-y-4 max-w-7xl animate-in fade-in duration-200">
      {/* Simple Clean Heading matching ModusDesk */}
      <div className="flex items-center justify-between">
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          Filing Matrix
        </h1>
        <span className="text-xs text-slate-500 font-medium">
          Showing {records.length} practice clients
        </span>
      </div>

      {/* Filter & Action Bar */}
      <MatrixFilterBar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        schemeFilter={schemeFilter}
        onSchemeFilterChange={setSchemeFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExportCsv={handleExportCsv}
        onSyncAll={handleSyncAll}
        isSyncing={isSyncing}
      />

      {/* Matrix Table */}
      <MatrixTable
        records={records}
        onSyncRow={handleSyncRow}
        onQuickLogin={handleQuickLogin}
        syncingClientId={syncingClientId}
      />

      {/* Quick Login Modal */}
      <QuickLoginModal
        isOpen={isQuickLoginOpen}
        onClose={() => setIsQuickLoginOpen(false)}
      />
    </div>
  );
}
