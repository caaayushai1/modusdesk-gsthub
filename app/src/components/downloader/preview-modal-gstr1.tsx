'use client';

import React, { useState } from 'react';
import type { GSTR1PreviewData } from '@/lib/downloader-types';

interface PreviewModalGSTR1Props {
  data: GSTR1PreviewData;
  onClose: () => void;
}

export function PreviewModalGSTR1({ data, onClose }: PreviewModalGSTR1Props) {
  const [activeTab, setActiveTab] = useState<'b2b' | 'hsn'>('b2b');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleExportCsv = () => {
    const headers = ['Customer GSTIN', 'Customer Name', 'Invoice No', 'Invoice Date', 'Invoice Value', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'POS'];
    const rows = data.b2bInvoices.map((inv) => [
      `"${inv.customerGstin}"`,
      `"${inv.customerName}"`,
      `"${inv.invoiceNumber}"`,
      `"${inv.invoiceDate}"`,
      inv.invoiceValue,
      inv.taxableValue,
      inv.igst,
      inv.cgst,
      inv.sgst,
      `"${inv.pos}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR1_${data.gstin}_${data.period}.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-200">
        {/* Modal Header */}
        <div className="border-b border-gray-200 bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white">
              GSTR-1
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {data.legalName}
                <span className="text-xs font-normal text-slate-300 font-mono">({data.gstin})</span>
              </h2>
              <p className="text-xs text-slate-400">
                Period: <span className="font-semibold text-white">{data.period}</span> | ARN: <span className="font-mono text-emerald-400">{data.arn}</span> | Filed On: {new Date(data.filingDate).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              📥 Export CSV
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Totals Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 border-b border-gray-200 p-4 text-xs">
          <div>
            <span className="text-gray-500 block">Total Taxable Value</span>
            <span className="text-base font-extrabold text-gray-900">{formatCurrency(data.totals.totalTaxable)}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Integrated Tax (IGST)</span>
            <span className="text-base font-bold text-blue-600">{formatCurrency(data.totals.totalIgst)}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Central + State Tax (CGST+SGST)</span>
            <span className="text-base font-bold text-indigo-600">{formatCurrency(data.totals.totalCgst + data.totals.totalSgst)}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Total Outward Tax Liability</span>
            <span className="text-base font-extrabold text-emerald-600">{formatCurrency(data.totals.totalLiability)}</span>
          </div>
        </div>

        {/* Modal Tab Navigation */}
        <div className="border-b border-gray-200 bg-white px-6 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('b2b')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'b2b'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            📋 Table 4: B2B Taxable Invoices ({data.b2bInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab('hsn')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'hsn'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            📦 Table 12: HSN Summary Schedule ({data.hsnSummary.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[460px] overflow-y-auto">
          {activeTab === 'b2b' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100/75 text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Customer / GSTIN</th>
                    <th className="py-2.5 px-3">Invoice Details</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value</th>
                    <th className="py-2.5 px-3 text-right">IGST</th>
                    <th className="py-2.5 px-3 text-right">CGST</th>
                    <th className="py-2.5 px-3 text-right">SGST</th>
                    <th className="py-2.5 px-3 text-right">Invoice Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.b2bInvoices.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-gray-900">{inv.customerName}</div>
                        <div className="font-mono text-[11px] text-gray-500">{inv.customerGstin}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-semibold text-gray-800">{inv.invoiceNumber}</div>
                        <div className="text-[10px] text-gray-400">{inv.invoiceDate} | {inv.pos}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-gray-900">{formatCurrency(inv.taxableValue)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">{inv.igst > 0 ? formatCurrency(inv.igst) : '—'}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">{inv.cgst > 0 ? formatCurrency(inv.cgst) : '—'}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">{inv.sgst > 0 ? formatCurrency(inv.sgst) : '—'}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900">{formatCurrency(inv.invoiceValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100/75 text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">HSN Code</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">UQC / Qty</th>
                    <th className="py-2.5 px-3 text-center">Rate</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value</th>
                    <th className="py-2.5 px-3 text-right">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.hsnSummary.map((hsn, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{hsn.hsnCode}</td>
                      <td className="py-2.5 px-3 text-gray-800">{hsn.description}</td>
                      <td className="py-2.5 px-3 text-center text-gray-500">{hsn.uqc} ({hsn.totalQty})</td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-900">{hsn.rate}%</td>
                      <td className="py-2.5 px-3 text-right font-medium text-gray-900">{formatCurrency(hsn.taxableValue)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatCurrency(hsn.totalTax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex justify-between items-center text-xs text-gray-500">
          <span>Official GST Common Portal Return Structure</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-200 hover:bg-gray-300 px-4 py-1.5 font-semibold text-gray-800 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
