'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { RecoResult, RecoLineItem } from '@/lib/reco-types';
import { RecoSummaryKpis } from '@/components/reco/reco-summary-kpis';
import { RecoFilterBar } from '@/components/reco/reco-filter-bar';
import { RecoDataTable } from '@/components/reco/reco-data-table';
import { FileUploadCard } from '@/components/reco/file-upload-card';
import { VendorNoticeModal } from '@/components/reco/vendor-notice-modal';
import { FileSpreadsheet } from 'lucide-react';

import { useGSTClients } from '@/lib/use-gst-clients';

export default function RecoStudioPage() {
  const { clients } = useGSTClients();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('2026-07');
  const [tolerance, setTolerance] = useState(1.0);
  const [recoResult, setRecoResult] = useState<RecoResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeBucket, setActiveBucket] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNoticeItem, setActiveNoticeItem] = useState<RecoLineItem | null>(null);

  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || clients[0] || {
      id: 'none',
      code: '---',
      name: 'No client selected',
      gstin: '---'
    },
    [clients, selectedClientId]
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg font-bold text-slate-900">
              GSTR-2B vs Books Reconciliation Studio
            </h1>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
              5-Bucket Matching
            </span>
          </div>
          <p className="text-body-md text-slate-500 mt-1">
            Automated statutory purchase register matching: identify eligible ITC, detect defaulting vendors, and maximize credit claims.
          </p>
        </div>

        {/* Client & Period Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:border-emerald-500 outline-none cursor-pointer"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:border-emerald-500 outline-none cursor-pointer"
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
