'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { RecoResult, RecoLineItem } from '@/lib/reco-types';
import { RecoSummaryKpis } from '@/components/reco/reco-summary-kpis';
import { RecoFilterBar } from '@/components/reco/reco-filter-bar';
import { RecoDataTable } from '@/components/reco/reco-data-table';
import { FileUploadCard } from '@/components/reco/file-upload-card';
import { VendorNoticeModal } from '@/components/reco/vendor-notice-modal';

const CLIENTS = [
  { id: 'client_001A', code: '001A', name: 'Acme Corporation Ltd.', gstin: '27AABCA1234F1Z5' },
  { id: 'client_001B', code: '001B', name: 'Acme Gujarat Logistics', gstin: '24AABCA1234F1Z1' },
  { id: 'client_002A', code: '002A', name: 'TechFlow Solutions LLP', gstin: '27AABCT9876H1Z9' },
  { id: 'client_003A', code: '003A', name: 'Singhania Global Freight', gstin: '27AASCS1122K1Z1' },
];

export default function RecoStudioPage() {
  const [selectedClientId, setSelectedClientId] = useState('client_001A');
  const [selectedPeriod, setSelectedPeriod] = useState('2026-07');
  const [tolerance, setTolerance] = useState(1.0);
  const [recoResult, setRecoResult] = useState<RecoResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeBucket, setActiveBucket] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNoticeItem, setActiveNoticeItem] = useState<RecoLineItem | null>(null);

  const selectedClient = useMemo(
    () => CLIENTS.find((c) => c.id === selectedClientId) || CLIENTS[0],
    [selectedClientId]
  );

  const executeReco = useCallback(async () => {
    try {
      setIsProcessing(true);
      const res = await fetch('/api/reco/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          gstin: selectedClient.gstin,
          period: selectedPeriod,
          tolerance,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setRecoResult(json.data as RecoResult);
    } catch (err: unknown) {
      console.error('Failed to run reco:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedClient, selectedPeriod, tolerance]);

  // Initial load
  useEffect(() => {
    executeReco();
  }, [executeReco]);

  // Filter items based on active bucket & search query
  const filteredItems = useMemo(() => {
    if (!recoResult) return [];

    let list = recoResult.items;

    if (activeBucket !== 'ALL') {
      list = list.filter((item) => item.bucket === activeBucket);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.supplierName.toLowerCase().includes(q) ||
          item.supplierGstin.toLowerCase().includes(q) ||
          item.invoiceNumber.toLowerCase().includes(q)
      );
    }

    return list;
  }, [recoResult, activeBucket, searchQuery]);

  // Export Reconciled CSV
  const handleExportCsv = () => {
    if (!recoResult || recoResult.items.length === 0) return;

    const headers = [
      'Classification Bucket',
      'Supplier GSTIN',
      'Supplier Name',
      'Invoice No',
      'Books Invoice Date',
      'Books Taxable Value',
      'Books Total Tax',
      '2B Invoice Date',
      '2B Taxable Value',
      '2B Total Tax',
      'Tax Difference',
      'Status Note',
    ];

    const rows = recoResult.items.map((item) => [
      `"${item.bucket}"`,
      `"${item.supplierGstin}"`,
      `"${item.supplierName}"`,
      `"${item.invoiceNumber}"`,
      `"${item.booksInvoice?.invoiceDate || ''}"`,
      item.booksInvoice?.taxableValue || 0,
      item.booksInvoice?.totalTax || 0,
      `"${item.gstr2bInvoice?.invoiceDate || ''}"`,
      item.gstr2bInvoice?.taxableValue || 0,
      item.gstr2bInvoice?.totalTax || 0,
      item.taxDiff,
      `"${item.statusMessage}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR2B_Reco_${selectedClient.code}_${selectedPeriod}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            GSTR-2B vs Books Reconciliation Studio
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Automated 5-bucket invoice matching engine to identify eligible ITC, detect defaulting vendors, and maximize credit claims.
          </p>
        </div>

        {/* Client & Period Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-xs focus:border-blue-500 outline-none cursor-pointer"
          >
            {CLIENTS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-xs focus:border-blue-500 outline-none cursor-pointer"
          >
            <option value="2026-07">Jul 2026</option>
            <option value="2026-06">Jun 2026</option>
            <option value="2026-05">May 2026</option>
            <option value="2026-04">Apr 2026</option>
          </select>
        </div>
      </div>

      {/* File Upload / Sample Dataset Area */}
      <FileUploadCard
        onLoadSample={executeReco}
        isProcessing={isProcessing}
      />

      {/* Summary KPI Cards */}
      {recoResult && (
        <RecoSummaryKpis
          summary={recoResult.summary}
          period={selectedPeriod}
        />
      )}

      {/* Filter Bar */}
      {recoResult && (
        <RecoFilterBar
          activeBucket={activeBucket}
          onBucketChange={setActiveBucket}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          tolerance={tolerance}
          onToleranceChange={setTolerance}
          onExportCsv={handleExportCsv}
          counts={{
            all: recoResult.summary.totalLines,
            exact: recoResult.summary.exactMatchCount,
            valueMismatch: recoResult.summary.valueMismatchCount,
            missingIn2b: recoResult.summary.missingIn2bCount,
            missingInBooks: recoResult.summary.missingInBooksCount,
            ineligible: recoResult.summary.ineligibleCount,
          }}
        />
      )}

      {/* Comparison Grid */}
      <RecoDataTable
        items={filteredItems}
        onOpenVendorNotice={(item) => setActiveNoticeItem(item)}
      />

      {/* Defaulter Vendor Follow-Up Notice Modal */}
      {activeNoticeItem && (
        <VendorNoticeModal
          item={activeNoticeItem}
          clientName={selectedClient.name}
          onClose={() => setActiveNoticeItem(null)}
        />
      )}
    </div>
  );
}
