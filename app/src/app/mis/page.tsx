'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { MISReportData } from '@/lib/mis-types';
import { GSTR1Vs3BTable } from '@/components/mis/gstr1-vs-3b-table';
import { GSTR2BVs3BTable } from '@/components/mis/gstr2b-vs-3b-table';
import { GSTR9AnnualSummary } from '@/components/mis/gstr9-annual-summary';
import { Download, BarChart3, AlertCircle } from 'lucide-react';

import { useGSTClients } from '@/lib/use-gst-clients';

export default function MISPage() {
  const { clients } = useGSTClients();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedFY, setSelectedFY] = useState('2026-2027');
  const [activeTab, setActiveTab] = useState<'1vs3b' | '2bvs3b' | 'gstr9'>('1vs3b');
  const [reportData, setReportData] = useState<MISReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0] || {
    id: 'none',
    code: '---',
    name: 'No client selected',
    gstin: '---'
  };

  const fetchMIS = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/mis?clientId=${selectedClientId}&clientName=${encodeURIComponent(
          selectedClient.name
        )}&gstin=${selectedClient.gstin}&financialYear=${selectedFY}`
      );
      const json = await res.json();
      if (json.success) {
        setReportData(json.data as MISReportData);
      }
    } catch (err: unknown) {
      console.error('Failed to load MIS data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClientId, selectedClient.name, selectedClient.gstin, selectedFY]);

  useEffect(() => {
    fetchMIS();
  }, [fetchMIS]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportMIS = () => {
    if (!reportData) return;

    let csvContent = 'CA MIS STATUTORY AUDIT REPORT\n';
    csvContent += `Client: ${reportData.clientName} (${reportData.gstin})\n`;
    csvContent += `Financial Year: ${reportData.financialYear}\n\n`;

    csvContent += '--- 1. GSTR-1 vs GSTR-3B TAX LIABILITY COMPARISON ---\n';
    csvContent += 'Month,GSTR-1 Taxable,GSTR-1 Tax,GSTR-3B Taxable,GSTR-3B Tax,Liability Gap,DRC-01B Alert\n';
    reportData.gstr1Vs3b.forEach((r) => {
      csvContent += `"${r.month}",${r.gstr1Taxable},${r.gstr1Tax},${r.gstr3bTaxable},${r.gstr3bTax},${r.taxDifference},"${r.drc01bAlert ? 'ALERT: DRC-01B' : 'OK'}"\n`;
    });

    csvContent += '\n--- 2. GSTR-2B vs GSTR-3B ITC COMPARISON ---\n';
    csvContent += 'Month,GSTR-2B Available ITC,GSTR-3B Claimed ITC,Excess Claim,DRC-01C Alert\n';
    reportData.gstr2bVs3b.forEach((r) => {
      csvContent += `"${r.month}",${r.gstr2bItc},${r.gstr3bItcClaimed},${r.excessClaim},"${r.drc01cAlert ? 'ALERT: DRC-01C' : 'OK'}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CA_MIS_Report_${selectedClient.code}_${selectedFY}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg font-bold text-slate-900">
              CA MIS Statutory Comparison Suite
            </h1>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
              Rule 88C & 88D Audits
            </span>
          </div>
          <p className="text-body-md text-slate-500 mt-1">
            Multi-return statutory cross-reconciliations: Rule 88C (GSTR-1 vs 3B), Rule 88D (2B vs 3B), and Annual GSTR-9 schedules.
          </p>
        </div>

        {/* Client & FY Dropdown */}
        <div className="flex items-center gap-2">
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
            value={selectedFY}
            onChange={(e) => setSelectedFY(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:border-emerald-500 outline-none cursor-pointer"
          >
            <option value="2026-2027">FY 2026-27</option>
            <option value="2025-2026">FY 2025-26</option>
          </select>

          <button
            onClick={handleExportMIS}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-2xs shadow-emerald-600/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export MIS</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card-enterprise p-16 text-center bg-white border border-slate-200 shadow-xs">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-body-sm text-slate-500 mt-3 font-medium">
            Generating CA MIS statutory comparisons...
          </p>
        </div>
      ) : (
        reportData && (
          <>
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="card-enterprise p-5 bg-white border border-slate-200 shadow-xs">
                <span className="text-label-caps text-slate-500">FY Total GSTR-1 Tax</span>
                <div className="font-jetbrains mt-2 text-2xl font-bold tracking-tight text-emerald-700">
                  {formatCurrency(reportData.totals.fyGstr1Tax)}
                </div>
              </div>

              <div className="card-enterprise p-5 bg-white border border-slate-200 shadow-xs">
                <span className="text-label-caps text-slate-500">FY GSTR-3B Tax Paid</span>
                <div className="font-jetbrains mt-2 text-2xl font-bold tracking-tight text-teal-700">
                  {formatCurrency(reportData.totals.fyGstr3bTax)}
                </div>
              </div>

              <div className="card-enterprise p-5 bg-white border border-rose-200 shadow-xs">
                <span className="text-label-caps text-rose-800">DRC-01B Liability Gap</span>
                <div className="font-jetbrains mt-2 text-2xl font-bold tracking-tight text-rose-600">
                  {formatCurrency(reportData.totals.fyLiabilityGap)}
                </div>
                <span className="text-[10px] text-rose-600 font-semibold mt-1 block">Rule 88C Notice Risk</span>
              </div>

              <div className="card-enterprise p-5 bg-white border border-amber-200 shadow-xs">
                <span className="text-label-caps text-amber-800">DRC-01C Excess ITC</span>
                <div className="font-jetbrains mt-2 text-2xl font-bold tracking-tight text-amber-600">
                  {formatCurrency(reportData.totals.fyExcessItcClaimed)}
                </div>
                <span className="text-[10px] text-amber-600 font-semibold mt-1 block">Rule 88D Notice Risk</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 space-x-6">
              <button
                onClick={() => setActiveTab('1vs3b')}
                className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === '1vs3b'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                1. GSTR-1 vs GSTR-3B (Rule 88C)
              </button>

              <button
                onClick={() => setActiveTab('2bvs3b')}
                className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === '2bvs3b'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                2. GSTR-2B vs GSTR-3B (Rule 88D)
              </button>

              <button
                onClick={() => setActiveTab('gstr9')}
                className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'gstr9'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                3. Annual GSTR-9 Preparation Schedule
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === '1vs3b' && <GSTR1Vs3BTable rows={reportData.gstr1Vs3b} />}
            {activeTab === '2bvs3b' && <GSTR2BVs3BTable rows={reportData.gstr2bVs3b} />}
            {activeTab === 'gstr9' && (
              <GSTR9AnnualSummary
                outwardRows={reportData.gstr9Outward}
                taxPaidRows={reportData.gstr9TaxPaid}
              />
            )}
          </>
        )
      )}
    </div>
  );
}
