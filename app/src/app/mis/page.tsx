'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { MISReportData } from '@/lib/mis-types';
import { GSTR1Vs3BTable } from '@/components/mis/gstr1-vs-3b-table';
import { GSTR2BVs3BTable } from '@/components/mis/gstr2b-vs-3b-table';
import { GSTR9AnnualSummary } from '@/components/mis/gstr9-annual-summary';
import { useGSTClients } from '@/lib/use-gst-clients';
import { Download } from 'lucide-react';

export default function MISPage() {
  const { clients } = useGSTClients();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedFY, setSelectedFY] = useState('2026-2027');
  const [activeTab, setActiveTab] = useState<'1vs3b' | '2bvs3b' | 'gstr9'>('1vs3b');
  const [reportData, setReportData] = useState<MISReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0];
  }, [clients, selectedClientId]);

  const fetchMIS = useCallback(async () => {
    if (!selectedClientId || !selectedClient) return;
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
  }, [selectedClientId, selectedClient?.name, selectedClient?.gstin, selectedFY]);

  useEffect(() => {
    if (selectedClient) {
      fetchMIS();
    }
  }, [fetchMIS, selectedClient]);

  const handleExportMIS = () => {
    if (!reportData) return;

    let csvContent = 'CA MIS AUDIT REPORT\n';
    csvContent += `Client: ${reportData.clientName} (${reportData.gstin})\n`;
    csvContent += `Financial Year: ${reportData.financialYear}\n\n`;

    if (activeTab === '1vs3b') {
      csvContent += '--- GSTR-1 vs GSTR-3B TAX LIABILITY COMPARISON ---\n';
      csvContent += 'Month,GSTR-1 Taxable,GSTR-1 Tax,GSTR-3B Taxable,GSTR-3B Tax,Liability Gap,DRC-01B Alert\n';
      reportData.gstr1Vs3b.forEach((r) => {
        csvContent += `"${r.month}",${r.gstr1Taxable},${r.gstr1Tax},${r.gstr3bTaxable},${r.gstr3bTax},${r.taxDifference},"${r.drc01bAlert ? 'ALERT: DRC-01B' : 'OK'}"\n`;
      });
    } else if (activeTab === '2bvs3b') {
      csvContent += '--- GSTR-2B vs GSTR-3B ITC COMPARISON ---\n';
      csvContent += 'Month,GSTR-2B Available ITC,GSTR-3B Claimed ITC,Excess Claim,DRC-01C Alert\n';
      reportData.gstr2bVs3b.forEach((r) => {
        csvContent += `"${r.month}",${r.gstr2bItc},${r.gstr3bItcClaimed},${r.excessClaim},"${r.drc01cAlert ? 'ALERT: DRC-01C' : 'OK'}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CA_MIS_${selectedClient?.code || 'Client'}_${selectedFY}.csv`;
    link.click();
  };

  return (
    <div className="space-y-3.5 max-w-7xl animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            CA MIS Suite
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

          <button
            onClick={handleExportMIS}
            disabled={!reportData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Export report as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveTab('1vs3b')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === '1vs3b'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          GSTR-1 vs 3B (DRC-01B)
        </button>

        <button
          onClick={() => setActiveTab('2bvs3b')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === '2bvs3b'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          GSTR-2B vs 3B (DRC-01C)
        </button>

        <button
          onClick={() => setActiveTab('gstr9')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'gstr9'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Annual Summary (GSTR-9)
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs text-slate-400 font-medium">Loading statutory comparison data...</p>
        </div>
      ) : reportData ? (
        <div>
          {activeTab === '1vs3b' && <GSTR1Vs3BTable rows={reportData.gstr1Vs3b} />}
          {activeTab === '2bvs3b' && <GSTR2BVs3BTable rows={reportData.gstr2bVs3b} />}
          {activeTab === 'gstr9' && (
            <GSTR9AnnualSummary
              outwardRows={reportData.gstr9Outward}
              taxPaidRows={reportData.gstr9TaxPaid}
            />
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs text-slate-400 font-medium">
            Select a client to view statutory comparison reports.
          </p>
        </div>
      )}
    </div>
  );
}
