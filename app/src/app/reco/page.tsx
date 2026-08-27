'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { RecoResult, RecoLineItem } from '@/lib/reco-types';
import { RecoDataTable } from '@/components/reco/reco-data-table';
import { VendorNoticeModal } from '@/components/reco/vendor-notice-modal';
import { useGSTClients } from '@/lib/use-gst-clients';
import { Download, RefreshCw } from 'lucide-react';

export default function RecoStudioPage() {
  const { clients } = useGSTClients();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('2026-07');
  const [tolerance, setTolerance] = useState(1.0);
  const [recoResult, setRecoResult] = useState<RecoResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeNoticeItem, setActiveNoticeItem] = useState<RecoLineItem | null>(null);

  // Staging sample fallback clients if empty
  const effectiveClients = clients.length > 0 ? clients : [
    { id: 'stg-1', code: '001A', name: 'Apex Infotech Solutions Private Limited', gstin: '27AABCA1122D1Z4' },
    { id: 'stg-2', code: '002A', name: 'Bharat Pharma & Life Sciences LLP', gstin: '24BBBBB3344E1Z8' },
    { id: 'stg-3', code: '003A', name: 'Singhania Heavy Engineering Works', gstin: '27CCCCC5566F1Z1' },
    { id: 'stg-4', code: '004A', name: 'Zenith Logistics & Supply Chain Pvt Ltd', gstin: '29DDDDD7788G1Z9' },
    { id: 'stg-5', code: '005A', name: 'Kalyan Jewellers & Craftsmen Co', gstin: '33EEEEE9900H1Z2' },
  ];

  useEffect(() => {
    if (effectiveClients.length > 0 && !selectedClientId) {
      setSelectedClientId(effectiveClients[0].id);
    }
  }, [effectiveClients, selectedClientId]);

  const selectedClient = useMemo(
    () => effectiveClients.find((c) => c.id === selectedClientId) || effectiveClients[0] || {
      id: 'none',
      code: '---',
      name: 'No client selected',
      gstin: '---'
    },
    [effectiveClients, selectedClientId]
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

  // Export Reconciled CSV
  const handleExportCsv = () => {
    if (!recoResult || recoResult.items.length === 0) return;

    const headers = [
      'Supplier Name',
      'Supplier GSTIN',
      'Match Status',
      'Books Invoice',
      'Books Tax',
      '2B Tax',
      'Tax Difference',
    ];

    const csvRows = [
      headers.join(','),
      ...recoResult.items.map((i) =>
        [
          `"${i.supplierName.replace(/"/g, '""')}"`,
          `"${i.supplierGstin}"`,
          `"${i.bucket}"`,
          `"${i.invoiceNumber || ''}"`,
          `"${i.booksInvoice?.totalTax || 0}"`,
          `"${i.gstr2bInvoice?.totalTax || 0}"`,
          `"${i.taxDiff || 0}"`,
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `2B_Reconciliation_${selectedClient.code}_${selectedPeriod}.csv`;
    link.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const summary = recoResult?.summary;

  return (
    <div className="space-y-3.5 max-w-7xl animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            2B Reco Studio
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* Client Selector */}
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-semibold outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
          >
            {effectiveClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Export full reconciliation as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={executeReco}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Re-run reconciliation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Reconciling...' : 'Re-Run Reco'}</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500">Exact Matched ITC</div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
              {formatCurrency(summary.eligibleClaimableItc)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{summary.exactMatchCount} invoices</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500">Missing in 2B (Books Only)</div>
            <div className="text-sm font-bold text-rose-600 font-mono mt-0.5">
              {formatCurrency(summary.atRiskItcMissingIn2b)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{summary.missingIn2bCount} invoices</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500">In 2B Only (Unclaimed)</div>
            <div className="text-sm font-bold text-slate-700 font-mono mt-0.5">
              {formatCurrency(summary.unclaimedItcMissingInBooks)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{summary.missingInBooksCount} invoices</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500">Value Differences</div>
            <div className="text-sm font-bold text-rose-600 font-mono mt-0.5">
              {formatCurrency(summary.valueMismatchTaxDiff)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{summary.valueMismatchCount} invoices</div>
          </div>
        </div>
      )}

      {/* Reco Data Table */}
      <RecoDataTable
        items={recoResult?.items || []}
        onOpenVendorNotice={(item) => setActiveNoticeItem(item)}
      />

      {/* Vendor Notice Modal */}
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
