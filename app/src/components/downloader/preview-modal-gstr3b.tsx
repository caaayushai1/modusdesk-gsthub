'use client';

import React, { useState } from 'react';
import type { GSTR3BPreviewData } from '@/lib/downloader-types';
import { Download, X } from 'lucide-react';

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
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportCsv = () => {
    let csv = `GSTR-3B SUMMARY - ${data.legalName} (${data.gstin}) - Period: ${data.period}\n`;
    csv += 'Section,Description,Taxable Value,IGST,CGST,SGST,Cess,Total\n';

    data.table31.forEach((row) => {
      const totalTax = row.igst + row.cgst + row.sgst + row.cess;
      csv += `"Table 3.1","${row.natureOfSupplies}",${row.taxableValue},${row.igst},${row.cgst},${row.sgst},${row.cess},${totalTax}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR3B_${data.gstin}_${data.period}.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="border-b border-slate-200 bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-xs">
              3B
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Form GSTR-3B Statutory Summary Preview
                </h2>
                <span className="rounded-full bg-teal-500/20 border border-teal-400/30 px-2 py-0.5 text-[10px] font-bold text-teal-300">
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-white space-x-6">
          <button
            onClick={() => setActiveTab('3.1')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === '3.1'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Table 3.1: Tax on Outward & Inward RCM Supplies
          </button>
          <button
            onClick={() => setActiveTab('4')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === '4'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Table 4: Eligible & Ineligible ITC
          </button>
          <button
            onClick={() => setActiveTab('6.1')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === '6.1'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Table 6.1: Payment of Tax (Cash vs Credit)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[480px] overflow-y-auto custom-scrollbar">
          {activeTab === '3.1' && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Nature of Supplies</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value</th>
                    <th className="py-2.5 px-3 text-right">IGST</th>
                    <th className="py-2.5 px-3 text-right">CGST</th>
                    <th className="py-2.5 px-3 text-right">SGST</th>
                    <th className="py-2.5 px-3 text-right">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-jetbrains">
                  {data.table31.map((row, idx) => {
                    const totalTax = row.igst + row.cgst + row.sgst + row.cess;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{row.natureOfSupplies}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-900">{formatCurrency(row.taxableValue)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-700">{formatCurrency(row.igst)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-700">{formatCurrency(row.cgst)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-700">{formatCurrency(row.sgst)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatCurrency(totalTax)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === '4' && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">ITC Category</th>
                    <th className="py-2.5 px-3 text-right">IGST</th>
                    <th className="py-2.5 px-3 text-right">CGST</th>
                    <th className="py-2.5 px-3 text-right">SGST</th>
                    <th className="py-2.5 px-3 text-right">Total ITC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-jetbrains">
                  {data.table4Itc.eligibleItc.map((row, idx) => {
                    const totalItc = row.igst + row.cgst + row.sgst + row.cess;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{row.heading}</td>
                        <td className="py-2.5 px-3 text-right text-slate-700">{formatCurrency(row.igst)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-700">{formatCurrency(row.cgst)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-700">{formatCurrency(row.sgst)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-teal-700">{formatCurrency(totalItc)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === '6.1' && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Tax Payable</th>
                    <th className="py-2.5 px-3 text-right">Paid via ITC</th>
                    <th className="py-2.5 px-3 text-right font-bold text-emerald-900">Paid in Cash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-jetbrains">
                  {data.table61Payment.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{row.taxHead}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-900">{formatCurrency(row.totalTaxPayable)}</td>
                      <td className="py-2.5 px-3 text-right text-indigo-700">{formatCurrency(row.paidViaItc)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatCurrency(row.paidViaCash)}</td>
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
