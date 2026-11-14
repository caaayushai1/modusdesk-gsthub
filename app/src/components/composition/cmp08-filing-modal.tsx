'use client';

import React, { useState } from 'react';
import { 
  X, 
  FileCheck2, 
  Download, 
  Zap, 
  Copy, 
  Check, 
  Building2, 
  Calculator,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface CompositionLedgerRow {
  id: string;
  clientId: string;
  clientCode: string;
  clientName: string;
  gstin: string;
  financialYear: string;
  quarter: string;
  openingStock: number;
  totalPurchases: number;
  rcmTaxableValue: number;
  rcmTaxPayable: number;
  gpMargin: number;
  salesMode: string;
  actualSales: number;
  taxRateOnSales: number;
  taxPayableOnSales: number;
  totalCmp08Tax: number;
  closingStock: number;
  status: string;
  arn?: string | null;
}

interface Cmp08FilingModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: CompositionLedgerRow | null;
  onLaunchCompanion?: (gstin: string) => void;
}

export function Cmp08FilingModal({
  isOpen,
  onClose,
  record,
  onLaunchCompanion
}: Cmp08FilingModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !record) return null;

  const cgstSales = Math.round((record.taxPayableOnSales / 2) * 100) / 100;
  const sgstSales = Math.round((record.taxPayableOnSales / 2) * 100) / 100;
  const cgstRcm = Math.round((record.rcmTaxPayable / 2) * 100) / 100;
  const sgstRcm = Math.round((record.rcmTaxPayable / 2) * 100) / 100;

  const totalCgst = Math.round((cgstSales + cgstRcm) * 100) / 100;
  const totalSgst = Math.round((sgstSales + sgstRcm) * 100) / 100;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const generateCmp08Json = () => {
    const payload = {
      gstin: record.gstin,
      fp: record.quarter,
      fy: record.financialYear,
      table3: {
        outwardTaxableSupplies: {
          taxableVal: record.actualSales,
          iamt: 0,
          camt: cgstSales,
          samt: sgstSales,
          csamt: 0
        },
        inwardReverseCharge: {
          taxableVal: record.rcmTaxableValue,
          iamt: 0,
          camt: cgstRcm,
          samt: sgstRcm,
          csamt: 0
        },
        totalTaxPayable: {
          iamt: 0,
          camt: totalCgst,
          samt: totalSgst,
          csamt: 0,
          total: record.totalCmp08Tax
        }
      },
      stockReconciliation: {
        openingStock: record.openingStock,
        totalPurchases: record.totalPurchases,
        grossProfitMarginPercent: record.gpMargin,
        salesTurnover: record.actualSales,
        derivedClosingStock: record.closingStock
      },
      generatedAt: new Date().toISOString(),
      generator: 'ModusDesk GST Hub (Chartered Accountant Edition)'
    };

    return payload;
  };

  const handleDownloadJson = () => {
    const data = generateCmp08Json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CMP08_${record.gstin}_${record.financialYear}_${record.quarter}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    const data = generateCmp08Json();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl text-white backdrop-blur-xs">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-600 border border-emerald-500">
                  FORM GST CMP-08
                </span>
                <span className="text-sm font-semibold">{record.quarter} ({record.financialYear})</span>
              </div>
              <h2 className="text-lg font-bold mt-0.5">{record.clientName} ({record.clientCode})</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GSTIN & Registration Status Header */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-gray-500 font-medium">GSTIN:</span>{' '}
              <strong className="font-mono text-gray-800 text-sm">{record.gstin}</strong>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Tax Scheme:</span>{' '}
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Composition (Sec 10)
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">Rate:</span>
            <strong className="text-gray-800">{record.taxRateOnSales}% (0.5% CGST + 0.5% SGST)</strong>
          </div>
        </div>

        {/* Form CMP-08 Breakdown */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
          {/* Table 3: Summary of self-assessed liability */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                <span>Table 3. Summary of Self-Assessed Tax Liability</span>
              </h3>
              <span className="text-xs text-gray-500">Payment under Section 10(1) / (2A)</span>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Value (₹)</th>
                    <th className="py-2.5 px-3 text-right">IGST (₹)</th>
                    <th className="py-2.5 px-3 text-right">CGST (₹)</th>
                    <th className="py-2.5 px-3 text-right">SGST (₹)</th>
                    <th className="py-2.5 px-3 text-right font-bold text-gray-900">Total Tax (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Row 3(a): Outward Supplies */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 font-medium text-gray-800">
                      <div>3(a). Outward supplies (including exempt supplies)</div>
                      <div className="text-[11px] text-gray-400">Quarterly Outward Turnover subject to Composition Tax</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-gray-800">
                      {formatCurrency(record.actualSales)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-500">0.00</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-700">{formatCurrency(cgstSales)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-700">{formatCurrency(sgstSales)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(record.taxPayableOnSales)}
                    </td>
                  </tr>

                  {/* Row 3(b): Inward Supplies attracting RCM */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 font-medium text-gray-800">
                      <div>3(b). Inward supplies attracting reverse charge</div>
                      <div className="text-[11px] text-gray-400">Section 9(3) / 9(4) RCM Inward purchases (Must be paid in CASH)</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-gray-800">
                      {formatCurrency(record.rcmTaxableValue)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-500">0.00</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-700">{formatCurrency(cgstRcm)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-700">{formatCurrency(sgstRcm)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                      {formatCurrency(record.rcmTaxPayable)}
                    </td>
                  </tr>

                  {/* Row 3(c): Total Tax Payable */}
                  <tr className="bg-emerald-50/60 font-bold border-t-2 border-emerald-200">
                    <td className="py-3 px-3 text-emerald-950">
                      3(c). Total Tax Payable (3a + 3b)
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-950">
                      {formatCurrency(record.actualSales + record.rcmTaxableValue)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-950">0.00</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-950">{formatCurrency(totalCgst)}</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-950">{formatCurrency(totalSgst)}</td>
                    <td className="py-3 px-3 text-right font-mono text-base text-emerald-800 font-extrabold">
                      {formatCurrency(record.totalCmp08Tax)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Working Papers Stock Reconcilation Strip */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Calculator className="w-3.5 h-3.5 text-gray-500" />
                <span>Working Paper Inventory &amp; Stock Audit</span>
              </span>
              <span className="text-[11px] text-gray-500">Section 10 Statutory Reconciliation</span>
            </div>

            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-500 block">Opening Stock:</span>
                <strong className="font-mono text-gray-800 text-sm mt-0.5 block">
                  {formatCurrency(record.openingStock)}
                </strong>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-500 block">Purchases (incl. Tax):</span>
                <strong className="font-mono text-gray-800 text-sm mt-0.5 block">
                  {formatCurrency(record.totalPurchases)}
                </strong>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-500 block">Gross Profit Margin:</span>
                <strong className="font-mono text-gray-800 text-sm mt-0.5 block">
                  {record.gpMargin}%
                </strong>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-emerald-700 font-medium block">Audited Closing Stock:</span>
                <strong className="font-mono text-emerald-900 text-sm mt-0.5 block">
                  {formatCurrency(record.closingStock)}
                </strong>
              </div>
            </div>
          </div>

          {/* Compliance & Direct Filing Guidance */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong>Due Date &amp; Statutory Directives:</strong>
              <p>
                CMP-08 return must be filed by the 18th of the month following the quarter.
                Composition dealers cannot discharge RCM liability via ITC; the full amount of <strong>{formatCurrency(record.rcmTaxPayable)}</strong> must be paid directly from the Electronic Cash Ledger.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadJson}
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 text-gray-500" />
              <span>Download CMP-08 JSON</span>
            </button>
            <button
              onClick={handleCopyJson}
              className="inline-flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {onLaunchCompanion && (
              <button
                onClick={() => {
                  onLaunchCompanion(record.gstin);
                  onClose();
                }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>1-Click Launch GST Portal Filing</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
