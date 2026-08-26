'use client';

import React, { useState } from 'react';
import type { GSTR3BPreviewData } from '@/lib/downloader-types';

interface PreviewModalGSTR3BProps {
  data: GSTR3BPreviewData;
  onClose: () => void;
}

export function PreviewModalGSTR3B({ data, onClose }: PreviewModalGSTR3BProps) {
  const [activeTab, setActiveTab] = useState<'3.1' | '4' | '6.1'>('3.1');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleExportCsv = () => {
    const headers = ['Nature of Supplies', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Cess'];
    const rows = data.table31.map((item) => [
      `"${item.natureOfSupplies}"`,
      item.taxableValue,
      item.igst,
      item.cgst,
      item.sgst,
      item.cess,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR3B_${data.gstin}_${data.period}.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-200">
        {/* Modal Header */}
        <div className="border-b border-gray-200 bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white">
              GSTR-3B
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

        {/* Modal Tab Navigation */}
        <div className="border-b border-gray-200 bg-white px-6 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('3.1')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === '3.1'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            📊 Table 3.1: Tax Liability on Outward Supplies
          </button>
          <button
            onClick={() => setActiveTab('4')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === '4'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            💳 Table 4: Eligible & Ineligible ITC
          </button>
          <button
            onClick={() => setActiveTab('6.1')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === '6.1'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            💵 Table 6.1: Payment of Tax (Cash vs Credit)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[480px] overflow-y-auto">
          {/* TAB 3.1: Tax Liability */}
          {activeTab === '3.1' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-100/75 text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Nature of Supplies</th>
                      <th className="py-2.5 px-3 text-right">Taxable Value</th>
                      <th className="py-2.5 px-3 text-right">IGST</th>
                      <th className="py-2.5 px-3 text-right">CGST</th>
                      <th className="py-2.5 px-3 text-right">SGST</th>
                      <th className="py-2.5 px-3 text-right">Cess</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.table31.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80">
                        <td className="py-2.5 px-3 font-medium text-gray-800">{row.natureOfSupplies}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-gray-900">{formatCurrency(row.taxableValue)}</td>
                        <td className="py-2.5 px-3 text-right text-gray-600">{row.igst > 0 ? formatCurrency(row.igst) : '—'}</td>
                        <td className="py-2.5 px-3 text-right text-gray-600">{row.cgst > 0 ? formatCurrency(row.cgst) : '—'}</td>
                        <td className="py-2.5 px-3 text-right text-gray-600">{row.sgst > 0 ? formatCurrency(row.sgst) : '—'}</td>
                        <td className="py-2.5 px-3 text-right text-gray-600">{row.cess > 0 ? formatCurrency(row.cess) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Eligible & Ineligible ITC */}
          {activeTab === '4' && (
            <div className="space-y-6">
              {/* Eligible ITC */}
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  (A) Input Tax Credit (ITC) Available
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-100/75 text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Details</th>
                        <th className="py-2 px-3 text-right">IGST</th>
                        <th className="py-2 px-3 text-right">CGST</th>
                        <th className="py-2 px-3 text-right">SGST</th>
                        <th className="py-2 px-3 text-right">Cess</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.table4Itc.eligibleItc.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80">
                          <td className="py-2 px-3 font-medium text-gray-800">{row.heading}</td>
                          <td className="py-2 px-3 text-right text-gray-700">{row.igst > 0 ? formatCurrency(row.igst) : '—'}</td>
                          <td className="py-2 px-3 text-right text-gray-700">{row.cgst > 0 ? formatCurrency(row.cgst) : '—'}</td>
                          <td className="py-2 px-3 text-right text-gray-700">{row.sgst > 0 ? formatCurrency(row.sgst) : '—'}</td>
                          <td className="py-2 px-3 text-right text-gray-700">{row.cess > 0 ? formatCurrency(row.cess) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Net ITC Available Card */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900">Total Net Eligible ITC Claimed in 3B:</span>
                  <div className="text-xs text-emerald-700 mt-0.5">
                    IGST: {formatCurrency(data.table4Itc.netItcAvailable.igst)} | CGST: {formatCurrency(data.table4Itc.netItcAvailable.cgst)} | SGST: {formatCurrency(data.table4Itc.netItcAvailable.sgst)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-700">{formatCurrency(data.table4Itc.netItcAvailable.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6.1: Tax Paid */}
          {activeTab === '6.1' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100/75 text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Tax Description</th>
                    <th className="py-2.5 px-3 text-right">Total Tax Payable</th>
                    <th className="py-2.5 px-3 text-right">Paid via ITC Credit</th>
                    <th className="py-2.5 px-3 text-right font-bold text-indigo-700">Paid in Cash</th>
                    <th className="py-2.5 px-3 text-right">Interest / Fees</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.table61Payment.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80">
                      <td className="py-2.5 px-3 font-semibold text-gray-900">{row.taxHead}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-gray-900">{formatCurrency(row.totalTaxPayable)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 font-medium">{formatCurrency(row.paidViaItc)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-indigo-900">{formatCurrency(row.paidViaCash)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-500">{formatCurrency(row.interest + row.lateFee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex justify-between items-center text-xs text-gray-500">
          <span>Official Form GSTR-3B Statutory Structure</span>
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
