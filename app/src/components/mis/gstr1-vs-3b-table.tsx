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
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
      <div className="border-b border-gray-200 bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-bold uppercase">
            Rule 88C Audit
          </span>
          <h3 className="text-sm font-bold text-white">
            GSTR-1 vs GSTR-3B Tax Liability Comparison (DRC-01B Risk Analysis)
          </h3>
        </div>
        <span className="text-xs text-slate-300">Financial Year 2026-2027</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-100/80 text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-4">Tax Period</th>
              <th className="py-2.5 px-3 text-right">GSTR-1 Taxable</th>
              <th className="py-2.5 px-3 text-right font-bold text-blue-900">GSTR-1 Tax</th>
              <th className="py-2.5 px-3 text-right">GSTR-3B Taxable</th>
              <th className="py-2.5 px-3 text-right font-bold text-indigo-900">GSTR-3B Tax</th>
              <th className="py-2.5 px-3 text-right">Liability Gap</th>
              <th className="py-2.5 px-4 text-center">Compliance Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50/80">
                <td className="py-3 px-4 font-semibold text-gray-900">{row.month}</td>
                <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(row.gstr1Taxable)}</td>
                <td className="py-3 px-3 text-right font-bold text-blue-700">{formatCurrency(row.gstr1Tax)}</td>
                <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(row.gstr3bTaxable)}</td>
                <td className="py-3 px-3 text-right font-bold text-indigo-700">{formatCurrency(row.gstr3bTax)}</td>
                <td className={`py-3 px-3 text-right font-bold ${
                  row.taxDifference > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {row.taxDifference > 0 ? `+${formatCurrency(row.taxDifference)}` : '₹0'}
                </td>
                <td className="py-3 px-4 text-center">
                  {row.drc01bAlert ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 animate-pulse">
                      ⚠️ DRC-01B Risk (GSTR-1 &gt; 3B)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      ✓ Reconciled
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
