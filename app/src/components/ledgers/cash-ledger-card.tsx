import React from 'react';
import type { CashLedgerBalance } from '@/lib/ledger-types';

interface CashLedgerCardProps {
  cash: CashLedgerBalance;
}

export function CashLedgerCard({ cash }: CashLedgerCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
            Form GST PMT-05
          </span>
          <h3 className="mt-1 text-base font-bold text-gray-900">Electronic Cash Ledger</h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400 block font-medium">Total Cash Balance</span>
          <span className="text-2xl font-black text-emerald-600">{formatCurrency(cash.totalCash)}</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* IGST Cash */}
        <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-3.5">
          <span className="text-[11px] font-bold text-emerald-900 uppercase">IGST Cash</span>
          <div className="mt-1.5 text-lg font-extrabold text-emerald-700">{formatCurrency(cash.igst.total)}</div>
          <span className="text-[10px] text-gray-400">Tax: {formatCurrency(cash.igst.tax)}</span>
        </div>

        {/* CGST Cash */}
        <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-3.5">
          <span className="text-[11px] font-bold text-emerald-900 uppercase">CGST Cash</span>
          <div className="mt-1.5 text-lg font-extrabold text-emerald-700">{formatCurrency(cash.cgst.total)}</div>
          <span className="text-[10px] text-gray-400">Tax: {formatCurrency(cash.cgst.tax)}</span>
        </div>

        {/* SGST Cash */}
        <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-3.5">
          <span className="text-[11px] font-bold text-emerald-900 uppercase">SGST Cash</span>
          <div className="mt-1.5 text-lg font-extrabold text-emerald-700">{formatCurrency(cash.sgst.total)}</div>
          <span className="text-[10px] text-gray-400">Tax: {formatCurrency(cash.sgst.tax)}</span>
        </div>

        {/* Cess Cash */}
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3.5">
          <span className="text-[11px] font-bold text-gray-700 uppercase">Cess Cash</span>
          <div className="mt-1.5 text-lg font-extrabold text-gray-800">{formatCurrency(cash.cess.total)}</div>
          <span className="text-[10px] text-gray-400">Tax: {formatCurrency(cash.cess.tax)}</span>
        </div>
      </div>
    </div>
  );
}
