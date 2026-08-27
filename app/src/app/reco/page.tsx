'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { RecoResult } from '@/lib/reco-types';
import { RecoDataTable } from '@/components/reco/reco-data-table';
import { useGSTClients } from '@/lib/use-gst-clients';
import { Download, RefreshCw } from 'lucide-react';

export default function RecoStudioPage() {
  const { clients } = useGSTClients();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [frequency, setFrequency] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'>('MONTHLY');
  const [selectedPeriod, setSelectedPeriod] = useState('2026-07');
  const [recoResult, setRecoResult] = useState<RecoResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0];
  }, [clients, selectedClientId]);

  // Period options based on frequency
  const periodOptions = useMemo(() => {
    if (frequency === 'MONTHLY') {
      return [
        { value: '2026-07', label: 'July 2026' },
        { value: '2026-06', label: 'June 2026' },
        { value: '2026-05', label: 'May 2026' },
        { value: '2026-04', label: 'April 2026' },
      ];
    } else if (frequency === 'QUARTERLY') {
      return [
        { value: '2026-Q1', label: 'Q1 (Apr - Jun 2026)' },
        { value: '2026-Q2', label: 'Q2 (Jul - Sep 2026)' },
        { value: '2026-Q3', label: 'Q3 (Oct - Dec 2026)' },
        { value: '2026-Q4', label: 'Q4 (Jan - Mar 2027)' },
      ];
    } else {
      return [
        { value: '2026-2027', label: 'FY 2026-27 (Full Year Cumulative)' },
        { value: '2025-2026', label: 'FY 2025-26 (Full Year Cumulative)' },
      ];
    }
  }, [frequency]);

  // Auto-switch period if current period not valid for frequency
  useEffect(() => {
    if (periodOptions.length > 0 && !periodOptions.some((p) => p.value === selectedPeriod)) {
      setSelectedPeriod(periodOptions[0].value);
    }
  }, [periodOptions, selectedPeriod]);

  // Fetch reconciliation data
  const executeReco = useCallback(async () => {
    if (!selectedClient) return;
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
          tolerance: 1.0,
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
  }, [selectedClient?.id, selectedClient?.name, selectedClient?.gstin, selectedPeriod]);

  // Run on mount or when client/period changes
  useEffect(() => {
    if (selectedClient) {
      executeReco();
    }
  }, [executeReco, selectedClient]);

  // Comprehensive 29-Column Detailed Excel/CSV Export
  const handleExportDetailedExcel = () => {
    if (!recoResult || recoResult.items.length === 0) return;

    const headers = [
      'Supplier GSTIN',
      'Supplier Legal Name',
      'Match Classification',
      'Books Invoice Number',
      'Books Invoice Date',
      'Books Taxable Value',
      'Books IGST',
      'Books CGST',
      'Books SGST',
      'Books Cess',
      'Books Total Tax',
      'Books Total Invoice Value',
      'GSTR-2B Invoice Number',
      'GSTR-2B Invoice Date',
      'GSTR-2B Filing Date',
      'GSTR-2B Taxable Value',
      'GSTR-2B IGST',
      'GSTR-2B CGST',
      'GSTR-2B SGST',
      'GSTR-2B Cess',
      'GSTR-2B Total Tax',
      'GSTR-2B Total Invoice Value',
      'GSTR-2B ITC Eligibility',
      'Taxable Value Variance',
      'IGST Variance',
      'CGST Variance',
      'SGST Variance',
      'Total Tax Variance',
      'Status Remarks & Recommended Action',
    ];

    const csvRows = [
      headers.join(','),
      ...recoResult.items.map((i) => {
        const b = i.booksInvoice;
        const g = i.gstr2bInvoice;

        return [
          `"${i.supplierGstin}"`,
          `"${i.supplierName.replace(/"/g, '""')}"`,
          `"${i.bucket}"`,
          `"${b?.invoiceNumber || ''}"`,
          `"${b?.invoiceDate || ''}"`,
          `"${b?.taxableValue || 0}"`,
          `"${b?.igst || 0}"`,
          `"${b?.cgst || 0}"`,
          `"${b?.sgst || 0}"`,
          `"${b?.cess || 0}"`,
          `"${b?.totalTax || 0}"`,
          `"${b?.totalInvoiceValue || 0}"`,
          `"${g?.invoiceNumber || ''}"`,
          `"${g?.invoiceDate || ''}"`,
          `"${g?.gstr1FilingDate || ''}"`,
          `"${g?.taxableValue || 0}"`,
          `"${g?.igst || 0}"`,
          `"${g?.cgst || 0}"`,
          `"${g?.sgst || 0}"`,
          `"${g?.cess || 0}"`,
          `"${g?.totalTax || 0}"`,
          `"${g?.totalInvoiceValue || 0}"`,
          `"${g?.itcAvailability || 'NO'}"`,
          `"${i.taxableDiff || 0}"`,
          `"${i.igstDiff || 0}"`,
          `"${i.cgstDiff || 0}"`,
          `"${i.sgstDiff || 0}"`,
          `"${i.taxDiff || 0}"`,
          `"${(i.statusMessage || '').replace(/"/g, '""')}"`,
        ].join(',');
      }),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR2B_vs_Purchase_Detailed_Reco_${selectedClient?.code || 'Client'}_${selectedPeriod}.csv`;
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
            GSTR 2B vs Purhcase Reconciliation
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* Client Selector */}
          {clients.length > 0 ? (
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-semibold outline-none focus:border-emerald-500 focus:bg-white cursor-pointer max-w-[240px]"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-slate-400 font-mono">No clients loaded</span>
          )}

          {/* Export Excel Button */}
          <button
            onClick={handleExportDetailedExcel}
            disabled={!recoResult || recoResult.items.length === 0}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Download full 29-column detailed reconciliation spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Excel</span>
          </button>

          {/* Rock-Solid Re-Run Reco Button with Locked Dimensions */}
          <button
            onClick={executeReco}
            disabled={isProcessing || !selectedClient}
            className="w-28 h-8 flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-75 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer select-none"
            title="Re-run reconciliation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Re-Run Reco</span>
          </button>
        </div>
      </div>

      {/* Frequency & Period Selection Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Frequency Selector: Monthly / Quarterly / Annually */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Frequency:
            </span>
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => setFrequency('MONTHLY')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                  frequency === 'MONTHLY'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setFrequency('QUARTERLY')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                  frequency === 'QUARTERLY'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quarterly
              </button>
              <button
                onClick={() => setFrequency('ANNUALLY')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                  frequency === 'ANNUALLY'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Annually
              </button>
            </div>
          </div>

          {/* Period Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Period:
            </span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
            >
              {periodOptions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Total Invoices Count */}
        <div className="text-xs text-slate-500 font-medium">
          {recoResult?.items.length || 0} line items reconciled
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
            <div className="text-[11px] font-semibold text-slate-500">Value & Head Discrepancies</div>
            <div className="text-sm font-bold text-rose-600 font-mono mt-0.5">
              {formatCurrency(summary.valueMismatchTaxDiff)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              {(summary.valueMismatchCount || 0) + (summary.headMismatchCount || 0) + (summary.dateMismatchCount || 0)} invoices
            </div>
          </div>
        </div>
      )}

      {/* Reco Data Table with prominent sticky total row */}
      <RecoDataTable
        items={recoResult?.items || []}
      />
    </div>
  );
}
