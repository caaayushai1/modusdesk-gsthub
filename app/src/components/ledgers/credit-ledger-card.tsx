import React from 'react';
import type { CreditLedgerBalance } from '@/lib/ledger-types';

interface CreditLedgerCardProps {
  credit: CreditLedgerBalance;
}

export function CreditLedgerCard({ credit }: CreditLedgerCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
            Form GST PMT-02
          </span>
          <h3 className="mt-1 text-base font-bold text-gray-900">Electronic Credit Ledger</h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400 block font-medium">Total Credit Available</span>
          <span className="text-2xl font-black text-blue-600">{formatCurrency(credit.totalCredit)}</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* IGST */}
        <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-3.5">
          <span className="text-[11px] font-bold text-blue-900 uppercase">Integrated Tax (IGST)</span>
          <div className="mt-1.5 text-lg font-extrabold text-blue-700">{formatCurrency(credit.igst)}</div>
        </div>

        {/* CGST */}
        <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-3.5">
          <span className="text-[11px] font-bold text-indigo-900 uppercase">Central Tax (CGST)</span>
          <div className="mt-1.5 text-lg font-extrabold text-indigo-700">{formatCurrency(credit.cgst)}</div>
        </div>

        {/* SGST */}
        <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-3.5">
          <span className="text-[11px] font-bold text-indigo-900 uppercase">State/UT Tax (SGST)</span>
          <div className="mt-1.5 text-lg font-extrabold text-indigo-700">{formatCurrency(credit.sgst)}</div>
        </div>

        {/* Cess */}
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3.5">
          <span className="text-[11px] font-bold text-gray-700 uppercase">GST Compensation Cess</span>
          <div className="mt-1.5 text-lg font-extrabold text-gray-800">{formatCurrency(credit.cess)}</div>
        </div>
      </div>
    </div>
  );
}
