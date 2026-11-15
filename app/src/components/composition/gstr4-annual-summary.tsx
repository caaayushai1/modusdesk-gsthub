'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileSpreadsheet
} from 'lucide-react';
import { getGuestLedger } from '@/lib/composition-guest-storage';

interface AnnualClientSummary {
  clientId: string;
  clientCode: string;
  clientName: string;
  gstin: string;
  q1?: any;
  q2?: any;
  q3?: any;
  q4?: any;
  totalPurchases: number;
  totalRcmTaxable: number;
  totalRcmTax: number;
  totalSales: number;
  totalTaxOnSales: number;
  totalCmp08TaxPaid: number;
  fyOpeningStock: number;
  fyClosingStock: number;
}

interface Gstr4AnnualSummaryProps {
  financialYear: string;
  onClose?: () => void;
}

export function Gstr4AnnualSummary({ financialYear, onClose }: Gstr4AnnualSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<AnnualClientSummary[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnnualData() {
      setLoading(true);
      try {
        const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
        
        // Fetch all 4 quarters from API
        const apiResults = await Promise.all(
          quarters.map(q => 
            fetch(`/api/composition/ledger?fy=${financialYear}&quarter=${q}`)
              .then(r => r.json())
              .then(d => d.records || [])
              .catch(() => [])
          )
        );

        // Merge API records with local cache records for all quarters
        const results = quarters.map((q, idx) => {
          const apiRecs = apiResults[idx] || [];
          const cachedRecs = getGuestLedger(financialYear, q);
          const seen = new Set(apiRecs.map((r: any) => r.clientId));
          const merged = [...apiRecs];
          cachedRecs.forEach(cr => {
            if (!seen.has(cr.clientId)) {
              merged.push(cr);
              seen.add(cr.clientId);
            }
          });
          return merged;
        });

        // Group by client
        const clientMap = new Map<string, AnnualClientSummary>();

        quarters.forEach((q, idx) => {
          const recs = results[idx] || [];
          recs.forEach((rec: any) => {
            const key = rec.clientId || rec.gstin;
            if (!clientMap.has(key)) {
              clientMap.set(key, {
                clientId: rec.clientId,
                clientCode: rec.clientCode,
                clientName: rec.clientName,
                gstin: rec.gstin,
                totalPurchases: 0,
                totalRcmTaxable: 0,
                totalRcmTax: 0,
                totalSales: 0,
                totalTaxOnSales: 0,
                totalCmp08TaxPaid: 0,
                fyOpeningStock: 0,
                fyClosingStock: 0,
              });
            }
            const s = clientMap.get(key)!;
            (s as any)[q.toLowerCase()] = rec;
            s.totalPurchases += Number(rec.totalPurchases) || 0;
            s.totalRcmTaxable += Number(rec.rcmTaxableValue) || 0;
            s.totalRcmTax += Number(rec.rcmTaxPayable) || 0;
            s.totalSales += Number(rec.actualSales) || 0;
            s.totalTaxOnSales += Number(rec.taxPayableOnSales) || 0;
            s.totalCmp08TaxPaid += Number(rec.totalCmp08Tax) || 0;

            if (q === 'Q1') {
              s.fyOpeningStock = Number(rec.openingStock) || 0;
            }
            if (q === 'Q4' || !s.fyClosingStock) {
              s.fyClosingStock = Number(rec.closingStock) || 0;
            }
          });
        });

        const list = Array.from(clientMap.values());
        setSummaries(list);
        if (list.length > 0) {
          setSelectedClient(list[0].clientId);
        }
      } catch (err) {
        console.error('Failed to load annual summary:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAnnualData();
  }, [financialYear]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const activeRecord = summaries.find(s => s.clientId === selectedClient) || summaries[0];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            Form GSTR-4 (Annual Consolidation) &bull; FY {financialYear}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            4-Quarter consolidated turnover, purchases, tax liabilities and closing inventory
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Back to Quarterly View
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-medium">Consolidating 4 Quarters...</p>
        </div>
      ) : summaries.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <FileSpreadsheet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-700">No Annual Records for FY {financialYear}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Enter quarterly ledger data to view annual consolidation.</p>
        </div>
      ) : (
        <div className="p-6 space-y-5">
          {/* Client Selector */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500 shrink-0">Client:</span>
            {summaries.map(s => (
              <button
                key={s.clientId}
                onClick={() => setSelectedClient(s.clientId)}
                className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedClient === s.clientId
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{s.clientCode} — {s.clientName}</span>
              </button>
            ))}
          </div>

          {activeRecord && (
            <div className="space-y-5">
              {/* Annual Top Summary Strip */}
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-500 block">FY Aggregate Turnover</span>
                  <strong className="text-base font-bold font-mono text-gray-900 mt-0.5 block">
                    {formatCurrency(activeRecord.totalSales)}
                  </strong>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-500 block">FY Total CMP-08 Tax</span>
                  <strong className="text-base font-bold font-mono text-emerald-800 mt-0.5 block">
                    {formatCurrency(activeRecord.totalCmp08TaxPaid)}
                  </strong>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-500 block">FY Total Purchases</span>
                  <strong className="text-base font-bold font-mono text-gray-900 mt-0.5 block">
                    {formatCurrency(activeRecord.totalPurchases)}
                  </strong>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-500 block">Year-End Closing Stock</span>
                  <strong className="text-base font-bold font-mono text-gray-900 mt-0.5 block">
                    {formatCurrency(activeRecord.fyClosingStock)}
                  </strong>
                </div>
              </div>

              {/* 4 Quarters Breakdown Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Quarter</th>
                      <th className="py-2.5 px-3 text-right">Opening Stock (₹)</th>
                      <th className="py-2.5 px-3 text-right">Purchases (₹)</th>
                      <th className="py-2.5 px-3 text-right">RCM Taxable (₹)</th>
                      <th className="py-2.5 px-3 text-right">RCM Tax (₹)</th>
                      <th className="py-2.5 px-3 text-right">Turnover (₹)</th>
                      <th className="py-2.5 px-3 text-right">Tax on Sales (₹)</th>
                      <th className="py-2.5 px-3 text-right">Total CMP-08 Tax (₹)</th>
                      <th className="py-2.5 px-3 text-right font-bold text-gray-900">Closing Stock (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {['q1', 'q2', 'q3', 'q4'].map((qKey) => {
                      const qData = (activeRecord as any)[qKey];
                      const qLabel = qKey.toUpperCase();
                      if (!qData) {
                        return (
                          <tr key={qKey} className="hover:bg-gray-50/50 text-gray-400">
                            <td className="py-2 px-3 font-semibold text-gray-600">{qLabel}</td>
                            <td className="py-2 px-3 text-right font-mono">—</td>
                            <td className="py-2 px-3 text-right font-mono">—</td>
                            <td className="py-2 px-3 text-right font-mono">—</td>
                            <td className="py-2 px-3 text-right font-mono">—</td>
                            <td className="py-2 px-3 text-right font-mono">—</td>
                            <td className="py-2 px-3 text-right font-mono">—</td>
                            <td className="py-2 px-3 text-right font-mono">—</td>
                            <td className="py-2 px-3 text-right font-mono">—</td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={qKey} className="hover:bg-gray-50/50">
                          <td className="py-2.5 px-3 font-bold text-gray-900">{qLabel}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-gray-800">{formatCurrency(qData.openingStock || 0)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-gray-800">{formatCurrency(qData.totalPurchases || 0)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-gray-800">{formatCurrency(qData.rcmTaxableValue || 0)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-amber-700">{formatCurrency(qData.rcmTaxPayable || 0)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-gray-800">{formatCurrency(qData.actualSales || 0)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-gray-800">{formatCurrency(qData.taxPayableOnSales || 0)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">{formatCurrency(qData.totalCmp08Tax || 0)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">{formatCurrency(qData.closingStock || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-300 font-bold text-gray-900">
                      <td className="py-2.5 px-3">FY Total</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(activeRecord.fyOpeningStock)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(activeRecord.totalPurchases)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(activeRecord.totalRcmTaxable)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-700">{formatCurrency(activeRecord.totalRcmTax)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(activeRecord.totalSales)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(activeRecord.totalTaxOnSales)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-800">{formatCurrency(activeRecord.totalCmp08TaxPaid)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-900">{formatCurrency(activeRecord.fyClosingStock)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
