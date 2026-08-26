'use client';

import React from 'react';
import type { GSTR2BPreviewData } from '@/lib/downloader-types';
import { Download, X } from 'lucide-react';

interface PreviewModalGSTR2BProps {
  data: GSTR2BPreviewData;
  onClose: () => void;
}

export function PreviewModalGSTR2B({ data, onClose }: PreviewModalGSTR2BProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportCsv = () => {
    let csv = `GSTR-2B SUPPLIER-WISE ITC SUMMARY - ${data.legalName} (${data.gstin}) - Period: ${data.period}\n`;
    csv += 'Supplier GSTIN,Supplier Legal Entity,Invoice Count,Taxable Value,IGST,CGST,SGST,Total ITC Available,Filing Date,3B Filed\n';

    data.suppliers.forEach((s) => {
      csv += `"${s.supplierGstin}","${s.supplierName}",${s.invoiceCount},${s.taxableValue},${s.igst},${s.cgst},${s.sgst},${s.totalItcAvailable},"${s.gstr1FilingDate}","${s.gstr3bFiled}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR2B_${data.gstin}_${data.period}.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="border-b border-slate-200 bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              2B
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Form GSTR-2B Auto-Drafted ITC Statement Preview
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border-b border-slate-200 px-6 py-3.5 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total B2B Invoices</span>
            <span className="font-jetbrains font-bold text-slate-800 text-sm">{data.totals?.totalB2BInvoices || data.suppliers.length}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Taxable Value</span>
            <span className="font-jetbrains font-bold text-slate-900 text-sm">{formatCurrency(data.totals?.totalTaxable || 0)}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Eligible ITC Available</span>
            <span className="font-jetbrains font-bold text-emerald-700 text-sm">{formatCurrency(data.totals?.totalEligibleItc || 0)}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Ineligible ITC</span>
            <span className="font-jetbrains font-bold text-slate-500 text-sm">{formatCurrency(data.totals?.totalIneligibleItc || 0)}</span>
          </div>
        </div>

        {/* Content Body: Supplier-wise breakdown */}
        <div className="p-6 max-h-[480px] overflow-y-auto custom-scrollbar">
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Supplier Legal Entity</th>
                  <th className="py-2.5 px-3 text-center">Invoices</th>
                  <th className="py-2.5 px-3 text-right">Taxable Value</th>
                  <th className="py-2.5 px-3 text-right">IGST</th>
                  <th className="py-2.5 px-3 text-right">CGST + SGST</th>
                  <th className="py-2.5 px-3 text-right">Total ITC Available</th>
                  <th className="py-2.5 px-3 text-center">GSTR-1 Filed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-jetbrains">
                {data.suppliers.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-semibold text-slate-900">{s.supplierName}</div>
                      <div className="font-jetbrains text-[10px] text-slate-500">{s.supplierGstin}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-700">{s.invoiceCount}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-900">{formatCurrency(s.taxableValue)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700">{s.igst > 0 ? formatCurrency(s.igst) : '—'}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700">{formatCurrency(s.cgst + s.sgst)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatCurrency(s.totalItcAvailable)}</td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span className="inline-block rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {s.gstr1FilingDate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-between items-center text-xs text-slate-500">
          <span>Static Auto-Drafted Statement (Rule 60(7))</span>
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
