'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  CheckCircle2, 
  Download, 
  FileSpreadsheet, 
  TrendingUp, 
  Building2, 
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

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
        // Fetch all 4 quarters for this FY
        const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
        const results = await Promise.all(
          quarters.map(q => 
            fetch(`/api/composition/ledger?fy=${financialYear}&quarter=${q}`)
              .then(r => r.json())
              .then(d => d.records || [])
              .catch(() => [])
          )
        );

        // Group by client
        const clientMap = new Map<string, AnnualClientSummary>();

        quarters.forEach((q, idx) => {
          const recs = results[idx];
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
            s.totalPurchases += rec.totalPurchases || 0;
            s.totalRcmTaxable += rec.rcmTaxableValue || 0;
            s.totalRcmTax += rec.rcmTaxPayable || 0;
            s.totalSales += rec.actualSales || 0;
            s.totalTaxOnSales += rec.taxPayableOnSales || 0;
            s.totalCmp08TaxPaid += rec.totalCmp08Tax || 0;

            if (q === 'Q1') {
              s.fyOpeningStock = rec.openingStock || 0;
            }
            if (q === 'Q4' || !s.fyClosingStock) {
              s.fyClosingStock = rec.closingStock || 0;
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
      maximumFractionDigits: 2
    }).format(val);
  };

  const activeRecord = summaries.find(s => s.clientId === selectedClient) || summaries[0];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-700 border border-emerald-600">
                FORM GSTR-4 (ANNUAL CONSOLIDATION)
              </span>
              <span className="text-sm font-semibold">Financial Year {financialYear}</span>
            </div>
            <h2 className="text-base font-bold mt-0.5">Annual Stock &amp; CMP-08 Tax Consolidation Statement</h2>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Switch to Quarterly Ledger
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-medium">Consolidating 4 Quarters of GSTR-2A &amp; CMP-08 Ledgers...</p>
        </div>
      ) : summaries.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          <FileSpreadsheet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700">No Annual Records for FY {financialYear}</p>
          <p className="text-xs text-gray-400 mt-1">Import GSTR-2A or enter quarterly ledger values to see the annual consolidation.</p>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {/* Client Selector Pill Bar */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500 shrink-0 mr-1">Select Client:</span>
            {summaries.map(s => (
              <button
                key={s.clientId}
                onClick={() => setSelectedClient(s.clientId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  selectedClient === s.clientId
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="font-bold">{s.clientCode}</span>
                <span>- {s.clientName}</span>
              </button>
            ))}
          </div>

          {activeRecord && (
            <div className="space-y-6">
              {/* Annual Top Summary Strip */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <span className="text-xs text-emerald-800 font-semibold block">FY Aggregate Turnover</span>
                  <span className="text-xl font-bold font-mono text-emerald-950 mt-1 block">
                    {formatCurrency(activeRecord.totalSales)}
                  </span>
                  <span className="text-[11px] text-emerald-700 mt-0.5 block">CMP-08 Table 3(a) Total</span>
                </div>

                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <span className="text-xs text-emerald-800 font-semibold block">FY Total CMP-08 Tax Paid</span>
                  <span className="text-xl font-bold font-mono text-emerald-950 mt-1 block">
                    {formatCurrency(activeRecord.totalCmp08TaxPaid)}
                  </span>
                  <span className="text-[11px] text-emerald-700 mt-0.5 block">
                    Sales Tax: {formatCurrency(activeRecord.totalTaxOnSales)} + RCM: {formatCurrency(activeRecord.totalRcmTax)}
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="text-xs text-gray-600 font-semibold block">FY Total Inward Purchases</span>
                  <span className="text-xl font-bold font-mono text-gray-900 mt-1 block">
                    {formatCurrency(activeRecord.totalPurchases)}
                  </span>
                  <span className="text-[11px] text-gray-500 mt-0.5 block">GSTR-2A Inward (Tax Capitalized)</span>
                </div>

                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                  <span className="text-xs text-amber-800 font-semibold block">Year-End Closing Stock</span>
                  <span className="text-xl font-bold font-mono text-amber-950 mt-1 block">
                    {formatCurrency(activeRecord.fyClosingStock)}
                  </span>
                  <span className="text-[11px] text-amber-700 mt-0.5 block">
                    Opening (1 Apr): {formatCurrency(activeRecord.fyOpeningStock)}
                  </span>
                </div>
              </div>

              {/* 4 Quarters Breakdown Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Quarter-wise Breakdown (Q1 to Q4 Progression)
                  </h3>
                  <span className="text-xs text-gray-500 font-mono">GSTIN: {activeRecord.gstin}</span>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Quarter</th>
                      <th className="py-2.5 px-3 text-right">Opening Stock (₹)</th>
                      <th className="py-2.5 px-3 text-right">Purchases (₹)</th>
                      <th className="py-2.5 px-3 text-right">RCM Taxable (₹)</th>
                      <th className="py-2.5 px-3 text-right">RCM Tax (₹)</th>
                      <th className="py-2.5 px-3 text-right">Sales Turnover (₹)</th>
                      <th className="py-2.5 px-3 text-right">Tax on Sales (1%) (₹)</th>
                      <th className="py-2.5 px-3 text-right">Total CMP-08 Tax (₹)</th>
                      <th className="py-2.5 px-3 text-right font-bold text-emerald-800">Closing Stock (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
                      const qRec = (activeRecord as any)[q.toLowerCase()];
                      return (
                        <tr key={q} className="hover:bg-gray-50/60">
                          <td className="py-3 px-3 font-bold text-gray-900 flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>{q}</span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-gray-700">
                            {formatCurrency(qRec?.openingStock || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-gray-700">
                            {formatCurrency(qRec?.totalPurchases || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-gray-700">
                            {formatCurrency(qRec?.rcmTaxableValue || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-amber-700">
                            {formatCurrency(qRec?.rcmTaxPayable || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-medium text-gray-900">
                            {formatCurrency(qRec?.actualSales || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-emerald-700">
                            {formatCurrency(qRec?.taxPayableOnSales || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-900">
                            {formatCurrency(qRec?.totalCmp08Tax || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-700">
                            {formatCurrency(qRec?.closingStock || 0)}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Annual Consolidated Total Row */}
                    <tr className="bg-emerald-50 font-bold border-t-2 border-emerald-300">
                      <td className="py-3 px-3 text-emerald-950 uppercase">FY Total</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-950">
                        {formatCurrency(activeRecord.fyOpeningStock)} (Initial)
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-950">
                        {formatCurrency(activeRecord.totalPurchases)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-950">
                        {formatCurrency(activeRecord.totalRcmTaxable)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-900">
                        {formatCurrency(activeRecord.totalRcmTax)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-950">
                        {formatCurrency(activeRecord.totalSales)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-950">
                        {formatCurrency(activeRecord.totalTaxOnSales)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-950 text-sm font-extrabold">
                        {formatCurrency(activeRecord.totalCmp08TaxPaid)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-950 text-sm font-extrabold">
                        {formatCurrency(activeRecord.fyClosingStock)} (Final)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
