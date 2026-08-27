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
    <div className="space-y-3.5">
      {/* Table 4 Outward Supplies */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs sm:text-[13px] font-bold text-slate-900">
            Form GSTR-9 — Table 4: Outward Supplies during Financial Year
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 sticky top-0 z-10 select-none">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-700 whitespace-nowrap">
                <th className="py-2.5 px-3.5 whitespace-nowrap">Nature of Supply</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Taxable Value</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap">IGST</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap">CGST</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap">SGST</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Total Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {outwardRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3.5 text-slate-700 text-xs font-normal whitespace-nowrap">
                    {row.natureOfSupply}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono text-slate-700 text-xs font-normal whitespace-nowrap">
                    {formatCurrency(row.taxableValue)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono text-slate-700 text-xs font-normal whitespace-nowrap">
                    {formatCurrency(row.igst)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono text-slate-700 text-xs font-normal whitespace-nowrap">
                    {formatCurrency(row.cgst)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono text-slate-700 text-xs font-normal whitespace-nowrap">
                    {formatCurrency(row.sgst)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono text-slate-700 text-xs font-normal whitespace-nowrap">
                    {formatCurrency(row.totalTax)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 9 Tax Paid */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs sm:text-[13px] font-bold text-slate-900">
            Form GSTR-9 — Table 9: Details of Tax Paid as declared in returns
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 sticky top-0 z-10 select-none">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-700 whitespace-nowrap">
                <th className="py-2.5 px-3.5 whitespace-nowrap">Tax Head</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Tax Payable</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Paid via Cash</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Paid via ITC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {taxPaidRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3.5 text-slate-700 text-xs font-normal whitespace-nowrap">
                    {row.taxHead}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono text-slate-700 text-xs font-normal whitespace-nowrap">
                    {formatCurrency(row.taxPayable)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono text-slate-700 text-xs font-normal whitespace-nowrap">
                    {formatCurrency(row.paidViaCash)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono text-slate-700 text-xs font-normal whitespace-nowrap">
                    {formatCurrency(row.paidViaItc)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
