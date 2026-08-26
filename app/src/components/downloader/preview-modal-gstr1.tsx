'use client';

import React, { useState } from 'react';
import type { GSTR1PreviewData } from '@/lib/downloader-types';
import { Download, X } from 'lucide-react';

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
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportCsv = () => {
    let csv = `GSTR-1 TABLE 4 B2B INVOICES - ${data.legalName} (${data.gstin}) - Period: ${data.period}\n`;
    csv += 'Customer GSTIN,Customer Name,Invoice No,Date,POS,Taxable Value,IGST,CGST,SGST,Total Tax\n';

    data.b2bInvoices.forEach((inv) => {
      const totalTax = inv.igst + inv.cgst + inv.sgst;
      csv += `"${inv.customerGstin}","${inv.customerName}","${inv.invoiceNumber}","${inv.invoiceDate}","${inv.pos}",${inv.taxableValue},${inv.igst},${inv.cgst},${inv.sgst},${totalTax}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR1_B2B_${data.gstin}_${data.period}.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="border-b border-slate-200 bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              G1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Form GSTR-1 In-Browser Statutory Preview
                </h2>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  {data.period}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {data.legalName} • <span className="font-jetbrains">{data.gstin}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary Totals Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 border-b border-slate-200 px-6 py-3.5 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Invoices</span>
            <span className="font-jetbrains font-bold text-slate-800 text-sm">{data.totals?.b2bInvoiceCount || data.b2bInvoices.length}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Taxable Value</span>
            <span className="font-jetbrains font-bold text-slate-900 text-sm">{formatCurrency(data.totals?.totalTaxable || 0)}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">IGST</span>
            <span className="font-jetbrains font-bold text-emerald-700 text-sm">{formatCurrency(data.totals?.totalIgst || 0)}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">CGST + SGST</span>
            <span className="font-jetbrains font-bold text-teal-700 text-sm">{formatCurrency((data.totals?.totalCgst || 0) + (data.totals?.totalSgst || 0))}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Tax Liability</span>
            <span className="font-jetbrains font-black text-slate-900 text-sm">{formatCurrency(data.totals?.totalLiability || 0)}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-white space-x-6">
          <button
            onClick={() => setActiveTab('b2b')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'b2b'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Table 4: B2B Invoices ({data.b2bInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab('hsn')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'hsn'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Table 12: HSN Summary ({data.hsnSummary.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[480px] overflow-y-auto custom-scrollbar">
          {activeTab === 'b2b' ? (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Customer Entity</th>
                    <th className="py-2.5 px-3">Invoice No</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">POS</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value</th>
                    <th className="py-2.5 px-3 text-right">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-jetbrains">
                  {data.b2bInvoices.map((inv, idx) => {
                    const totalTax = inv.igst + inv.cgst + inv.sgst;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-semibold text-slate-900">{inv.customerName}</div>
                          <div className="font-jetbrains text-[10px] text-slate-500">{inv.customerGstin}</div>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-3 text-slate-600">{inv.invoiceDate}</td>
                        <td className="py-2.5 px-3 text-slate-600">{inv.pos}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-900">{formatCurrency(inv.taxableValue)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatCurrency(totalTax)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">HSN Code</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">UQC</th>
                    <th className="py-2.5 px-3 text-right">Total Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                    <th className="py-2.5 px-3 text-right">Taxable</th>
                    <th className="py-2.5 px-3 text-right">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-jetbrains">
                  {data.hsnSummary.map((hsn, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{hsn.hsnCode}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">{hsn.description}</td>
                      <td className="py-2.5 px-3 text-slate-600">{hsn.uqc}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{hsn.totalQty}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{hsn.rate}%</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-900">{formatCurrency(hsn.taxableValue)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatCurrency(hsn.totalTax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-between items-center text-xs text-slate-500">
          <span>Official ARN: {data.arn || 'ARN-VERIFIED-SYSTEM'}</span>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white hover:bg-slate-100 px-4 py-1.5 font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
