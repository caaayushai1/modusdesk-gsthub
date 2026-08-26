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
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="border-b border-gray-200 bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            Form GSTR-9 — Table 4: Details of Outward Supplies made during the Financial Year
          </h3>
          <span className="text-xs text-slate-300">Auto-Synthesized from GSTR-1 & 3B</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-100/80 text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Nature of Supply</th>
                <th className="py-2.5 px-3 text-right">Taxable Value</th>
                <th className="py-2.5 px-3 text-right">IGST</th>
                <th className="py-2.5 px-3 text-right">CGST</th>
                <th className="py-2.5 px-3 text-right">SGST</th>
                <th className="py-2.5 px-3 text-right font-bold text-slate-900">Total Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {outwardRows.map((row, idx) => (
                <tr key={idx} className={row.natureOfSupply.startsWith('4N') ? 'bg-slate-50 font-bold' : 'hover:bg-gray-50/80'}>
                  <td className="py-3 px-4 text-gray-900">{row.natureOfSupply}</td>
                  <td className="py-3 px-3 text-right font-medium text-gray-900">{formatCurrency(row.taxableValue)}</td>
                  <td className="py-3 px-3 text-right text-gray-700">{row.igst > 0 ? formatCurrency(row.igst) : '—'}</td>
                  <td className="py-3 px-3 text-right text-gray-700">{row.cgst > 0 ? formatCurrency(row.cgst) : '—'}</td>
                  <td className="py-3 px-3 text-right text-gray-700">{row.sgst > 0 ? formatCurrency(row.sgst) : '—'}</td>
                  <td className="py-3 px-3 text-right font-black text-emerald-700">{formatCurrency(row.totalTax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Table 9 Tax Paid */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="border-b border-gray-200 bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            Form GSTR-9 — Table 9: Details of Tax Paid as Declared in Returns Filed
          </h3>
          <span className="text-xs text-slate-300">Statutory Discharge Summary</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-100/80 text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Tax Description</th>
                <th className="py-2.5 px-4 text-right">Tax Payable</th>
                <th className="py-2.5 px-4 text-right font-bold text-indigo-900">Paid Through Cash</th>
                <th className="py-2.5 px-4 text-right font-bold text-blue-900">Paid Through ITC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {taxPaidRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/80">
                  <td className="py-3 px-4 font-semibold text-gray-900">{row.taxHead}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(row.taxPayable)}</td>
                  <td className="py-3 px-4 text-right font-bold text-indigo-700">{formatCurrency(row.paidViaCash)}</td>
                  <td className="py-3 px-4 text-right font-bold text-blue-700">{formatCurrency(row.paidViaItc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
