import React from 'react';
import type { GSTR2BVs3BMonthRow } from '@/lib/mis-types';

interface GSTR2BVs3BTableProps {
  rows: GSTR2BVs3BMonthRow[];
}

export function GSTR2BVs3BTable({ rows }: GSTR2BVs3BTableProps) {
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
          <span className="rounded bg-teal-600 px-2 py-0.5 text-xs font-bold uppercase">
            Rule 88D Audit
          </span>
          <h3 className="text-sm font-bold text-white">
            GSTR-2B vs GSTR-3B ITC Comparison (DRC-01C Excess Credit Risk)
          </h3>
        </div>
        <span className="text-xs text-slate-300">Financial Year 2026-2027</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-100/80 text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-4">Tax Period</th>
              <th className="py-2.5 px-4 text-right font-bold text-teal-900">GSTR-2B Available ITC</th>
              <th className="py-2.5 px-4 text-right font-bold text-indigo-900">GSTR-3B Claimed ITC</th>
              <th className="py-2.5 px-4 text-right">Excess Claim / Difference</th>
              <th className="py-2.5 px-4 text-center">Compliance Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50/80">
                <td className="py-3 px-4 font-semibold text-gray-900">{row.month}</td>
                <td className="py-3 px-4 text-right font-bold text-teal-700">{formatCurrency(row.gstr2bItc)}</td>
                <td className="py-3 px-4 text-right font-bold text-indigo-700">{formatCurrency(row.gstr3bItcClaimed)}</td>
                <td className={`py-3 px-4 text-right font-bold ${
                  row.excessClaim > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {row.excessClaim > 0 ? `+${formatCurrency(row.excessClaim)}` : '₹0'}
                </td>
                <td className="py-3 px-4 text-center">
                  {row.drc01cAlert ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 animate-pulse">
                      ⚠️ DRC-01C Risk (Claim &gt; 2B)
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
