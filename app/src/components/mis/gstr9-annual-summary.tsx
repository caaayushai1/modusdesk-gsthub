'use client';

import React from 'react';
import type { GSTR9OutwardRow, GSTR9TaxPaidRow } from '@/lib/mis-types';

interface GSTR9AnnualSummaryProps {
  outwardRows: GSTR9OutwardRow[];
  taxPaidRows: GSTR9TaxPaidRow[];
}

export function GSTR9AnnualSummary({ outwardRows, taxPaidRows }: GSTR9AnnualSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* 1. Table 4 Outward Supplies */}
      <div className="card-enterprise bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            Form GSTR-9 — Table 4: Outward Supplies during the Financial Year
          </h3>
          <span className="text-xs text-slate-300">Auto-Synthesized from GSTR-1 & 3B</span>
        </div>

        <div className="overflow-x-auto table-scroll">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold text-slate-700">Nature of Supply</th>
                <th className="py-3 px-3 font-bold text-slate-700 text-right">Taxable Value</th>
                <th className="py-3 px-3 font-bold text-slate-700 text-right">IGST</th>
                <th className="py-3 px-3 font-bold text-slate-700 text-right">CGST</th>
                <th className="py-3 px-3 font-bold text-slate-700 text-right">SGST</th>
                <th className="py-3 px-3 font-bold text-emerald-900 text-right bg-emerald-50/40">Total Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-jetbrains">
              {outwardRows.map((row, idx) => (
                <tr key={idx} className={row.natureOfSupply.startsWith('4N') ? 'bg-slate-100/70 font-bold' : 'hover:bg-slate-50/80'}>
                  <td className="py-3 px-4 font-sans text-slate-900 font-medium">{row.natureOfSupply}</td>
                  <td className="py-3 px-3 text-right font-medium text-slate-900">{formatCurrency(row.taxableValue)}</td>
                  <td className="py-3 px-3 text-right text-slate-700">{row.igst > 0 ? formatCurrency(row.igst) : '—'}</td>
                  <td className="py-3 px-3 text-right text-slate-700">{row.cgst > 0 ? formatCurrency(row.cgst) : '—'}</td>
                  <td className="py-3 px-3 text-right text-slate-700">{row.sgst > 0 ? formatCurrency(row.sgst) : '—'}</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-800 bg-emerald-50/20">{formatCurrency(row.totalTax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Table 9 Tax Paid */}
      <div className="card-enterprise bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            Form GSTR-9 — Table 9: Details of Tax Paid as Declared in Returns Filed
          </h3>
          <span className="text-xs text-slate-300">Statutory Discharge Summary</span>
        </div>

        <div className="overflow-x-auto table-scroll">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold text-slate-700">Tax Description</th>
                <th className="py-3 px-4 font-bold text-slate-700 text-right">Tax Payable</th>
                <th className="py-3 px-4 font-bold text-emerald-900 text-right bg-emerald-50/40">Paid Through Cash</th>
                <th className="py-3 px-4 font-bold text-teal-900 text-right bg-teal-50/40">Paid Through ITC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-jetbrains">
              {taxPaidRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-sans font-bold text-slate-900">{row.taxHead}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-900">{formatCurrency(row.taxPayable)}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-800 bg-emerald-50/20">{formatCurrency(row.paidViaCash)}</td>
                  <td className="py-3 px-4 text-right font-bold text-teal-800 bg-teal-50/20">{formatCurrency(row.paidViaItc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
