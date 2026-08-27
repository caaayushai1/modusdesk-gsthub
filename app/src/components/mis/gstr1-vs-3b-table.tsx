'use client';

import React from 'react';
import type { GSTR1Vs3BMonthRow } from '@/lib/mis-types';

interface GSTR1Vs3BTableProps {
  rows: GSTR1Vs3BMonthRow[];
}

export function GSTR1Vs3BTable({ rows }: GSTR1Vs3BTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-200/80 sticky top-0 z-10 select-none">
            <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-700 whitespace-nowrap">
              <th className="py-2.5 px-3.5 whitespace-nowrap">Tax Period</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">GSTR-1 Taxable</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">GSTR-1 Tax</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">GSTR-3B Taxable</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">GSTR-3B Tax</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Liability Gap</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-2.5 px-3.5 text-slate-700 text-xs font-normal whitespace-nowrap">
                  {row.month}
                </td>
                <td className="py-2.5 px-3.5 text-right font-mono text-slate-700 text-xs font-normal whitespace-nowrap">
                  {formatCurrency(row.gstr1Taxable)}
                </td>
                <td className="py-2.5 px-3.5 text-right font-mono text-slate-700 text-xs font-normal whitespace-nowrap">
                  {formatCurrency(row.gstr1Tax)}
                </td>
                <td className="py-2.5 px-3.5 text-right font-mono text-slate-700 text-xs font-normal whitespace-nowrap">
                  {formatCurrency(row.gstr3bTaxable)}
                </td>
                <td className="py-2.5 px-3.5 text-right font-mono text-slate-700 text-xs font-normal whitespace-nowrap">
                  {formatCurrency(row.gstr3bTax)}
                </td>
                <td className={`py-2.5 px-3.5 text-right font-mono text-xs whitespace-nowrap ${
                  row.taxDifference > 0 ? 'text-rose-600 font-semibold' : 'text-slate-700 font-normal'
                }`}>
                  {row.taxDifference > 0 ? `+${formatCurrency(row.taxDifference)}` : '₹0'}
                </td>
                <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                  {row.drc01bAlert ? (
                    <span className="font-semibold text-rose-600 text-xs">
                      DRC-01B Risk
                    </span>
                  ) : (
                    <span className="text-slate-700 text-xs font-normal">
                      Reconciled
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
