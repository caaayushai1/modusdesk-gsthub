'use client';

import React from 'react';
import type { GSTR2BPreviewData } from '@/lib/downloader-types';

interface PreviewModalGSTR2BProps {
  data: GSTR2BPreviewData;
  onClose: () => void;
}

export function PreviewModalGSTR2B({ data, onClose }: PreviewModalGSTR2BProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleExportCsv = () => {
    const headers = ['Supplier GSTIN', 'Supplier Name', 'Invoice Count', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Total ITC', 'GSTR-1 Filed On', '3B Filed'];
    const rows = data.suppliers.map((s) => [
      `"${s.supplierGstin}"`,
      `"${s.supplierName}"`,
      s.invoiceCount,
      s.taxableValue,
      s.igst,
      s.cgst,
      s.sgst,
      s.totalItcAvailable,
      `"${s.gstr1FilingDate}"`,
      `"${s.gstr3bFiled}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR2B_${data.gstin}_${data.period}.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-200">
        {/* Modal Header */}
        <div className="border-b border-gray-200 bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white">
              GSTR-2B
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {data.legalName}
                <span className="text-xs font-normal text-slate-300 font-mono">({data.gstin})</span>
              </h2>
              <p className="text-xs text-slate-400">
                Period: <span className="font-semibold text-white">{data.period}</span> | Auto-Generated On: {new Date(data.generationDate).toLocaleDateString('en-IN')} | Status: <span className="text-teal-400 font-semibold">{data.status}</span>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-teal-50/50 border-b border-teal-100 p-4 text-xs">
          <div>
            <span className="text-gray-500 block">Total B2B Invoices</span>
            <span className="text-base font-extrabold text-gray-900">{data.totals.totalB2BInvoices} invoices</span>
          </div>
          <div>
            <span className="text-gray-500 block">Total Taxable Value</span>
            <span className="text-base font-bold text-gray-900">{formatCurrency(data.totals.totalTaxable)}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Ineligible ITC (Sec 17(5))</span>
            <span className="text-base font-bold text-rose-600">{formatCurrency(data.totals.totalIneligibleItc)}</span>
          </div>
          <div>
            <span className="text-teal-900 block font-semibold">Total Eligible ITC Available</span>
            <span className="text-base font-extrabold text-teal-700">{formatCurrency(data.totals.totalEligibleItc)}</span>
          </div>
        </div>

        {/* Supplier Breakdown Table */}
        <div className="p-6 max-h-[460px] overflow-y-auto">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
            📋 Supplier-Wise ITC Summary (Part A - B2B Invoices)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-100/75 text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Supplier GSTIN & Name</th>
                  <th className="py-2.5 px-2 text-center">Invoices</th>
                  <th className="py-2.5 px-3 text-right">Taxable Value</th>
                  <th className="py-2.5 px-3 text-right">IGST</th>
                  <th className="py-2.5 px-3 text-right">CGST</th>
                  <th className="py-2.5 px-3 text-right">SGST</th>
                  <th className="py-2.5 px-3 text-right font-bold text-teal-900">Total ITC Available</th>
                  <th className="py-2.5 px-3 text-center">Supplier Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.suppliers.map((sup, idx) => (
                  <tr key={idx} className="hover:bg-teal-50/30">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-gray-900">{sup.supplierName}</div>
                      <div className="font-mono text-[11px] text-gray-500">{sup.supplierGstin}</div>
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-gray-700">{sup.invoiceCount}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-gray-900">{formatCurrency(sup.taxableValue)}</td>
                    <td className="py-2.5 px-3 text-right text-gray-600">{sup.igst > 0 ? formatCurrency(sup.igst) : '—'}</td>
                    <td className="py-2.5 px-3 text-right text-gray-600">{sup.cgst > 0 ? formatCurrency(sup.cgst) : '—'}</td>
                    <td className="py-2.5 px-3 text-right text-gray-600">{sup.sgst > 0 ? formatCurrency(sup.sgst) : '—'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-teal-700">{formatCurrency(sup.totalItcAvailable)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-700 border border-green-200">
                        GSTR-1 Filed ({sup.gstr1FilingDate})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex justify-between items-center text-xs text-gray-500">
          <span>Auto-Drafted Input Tax Credit Statement for ITC Reconciliation</span>
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
