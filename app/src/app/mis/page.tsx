'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { MISReportData } from '@/lib/mis-types';
import { GSTR1Vs3BTable } from '@/components/mis/gstr1-vs-3b-table';
import { GSTR2BVs3BTable } from '@/components/mis/gstr2b-vs-3b-table';
import { GSTR9AnnualSummary } from '@/components/mis/gstr9-annual-summary';

const CLIENTS = [
  { id: 'client_001A', code: '001A', name: 'Acme Corporation Ltd.', gstin: '27AABCA1234F1Z5' },
  { id: 'client_001B', code: '001B', name: 'Acme Gujarat Logistics', gstin: '24AABCA1234F1Z1' },
  { id: 'client_002A', code: '002A', name: 'TechFlow Solutions LLP', gstin: '27AABCT9876H1Z9' },
  { id: 'client_003A', code: '003A', name: 'Singhania Global Freight', gstin: '27AASCS1122K1Z1' },
];

export default function MISPage() {
  const [selectedClientId, setSelectedClientId] = useState('client_001A');
  const [selectedFY, setSelectedFY] = useState('2026-2027');
  const [activeTab, setActiveTab] = useState<'1vs3b' | '2bvs3b' | 'gstr9'>('1vs3b');
  const [reportData, setReportData] = useState<MISReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const selectedClient = CLIENTS.find((c) => c.id === selectedClientId) || CLIENTS[0];

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            CA MIS Statutory Comparison Suite
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Multi-return statutory cross-reconciliations: Rule 88C (GSTR-1 vs 3B), Rule 88D (2B vs 3B), and Annual GSTR-9 schedules.
          </p>
        </div>

        {/* Client & FY Dropdown */}
        <div className="flex items-center gap-2">
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
            value={selectedFY}
            onChange={(e) => setSelectedFY(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-xs focus:border-blue-500 outline-none cursor-pointer"
          >
            <option value="2026-2027">FY 2026-27</option>
            <option value="2025-2026">FY 2025-26</option>
          </select>

          <button
            onClick={handleExportMIS}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-bold transition-colors shadow-xs"
          >
            <span>📥</span> Export MIS
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-xs">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-xs font-medium text-gray-500">Generating CA MIS statutory comparisons...</p>
        </div>
      ) : (
        reportData && (
          <>
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-bold text-gray-500 uppercase">FY Total GSTR-1 Tax</span>
                <div className="mt-1 text-2xl font-black text-blue-600">{formatCurrency(reportData.totals.fyGstr1Tax)}</div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                <span className="text-[11px] font-bold text-gray-500 uppercase">FY GSTR-3B Tax Paid</span>
                <div className="mt-1 text-2xl font-black text-indigo-600">{formatCurrency(reportData.totals.fyGstr3bTax)}</div>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
                <span className="text-[11px] font-bold text-rose-800 uppercase">DRC-01B Liability Gap</span>
                <div className="mt-1 text-2xl font-black text-rose-600">{formatCurrency(reportData.totals.fyLiabilityGap)}</div>
                <span className="text-[10px] text-rose-600 font-semibold">Rule 88C Notice Risk</span>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
                <span className="text-[11px] font-bold text-amber-800 uppercase">DRC-01C Excess ITC</span>
                <div className="mt-1 text-2xl font-black text-amber-600">{formatCurrency(reportData.totals.fyExcessItcClaimed)}</div>
                <span className="text-[10px] text-amber-600 font-semibold">Rule 88D Notice Risk</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 space-x-4">
              <button
                onClick={() => setActiveTab('1vs3b')}
                className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === '1vs3b'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                1. GSTR-1 vs GSTR-3B (Rule 88C)
              </button>

              <button
                onClick={() => setActiveTab('2bvs3b')}
                className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === '2bvs3b'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                2. GSTR-2B vs GSTR-3B (Rule 88D)
              </button>

              <button
                onClick={() => setActiveTab('gstr9')}
                className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'gstr9'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
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
