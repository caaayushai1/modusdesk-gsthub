'use client';

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
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs sm:text-[13px] font-bold text-slate-900">
          Electronic Cash Ledger
        </h3>
        <div className="text-right">
          <span className="text-[11px] text-slate-500 font-medium mr-1.5">Total Balance:</span>
          <span className="font-mono text-sm font-bold text-slate-900">
            {formatCurrency(cash.totalCash)}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* IGST */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
          <span className="text-[10.5px] text-slate-500 font-medium block">IGST Cash</span>
          <div className="font-mono mt-1 text-xs font-bold text-slate-800">
            {formatCurrency(cash.igst.total)}
          </div>
        </div>

        {/* CGST */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
          <span className="text-[10.5px] text-slate-500 font-medium block">CGST Cash</span>
          <div className="font-mono mt-1 text-xs font-bold text-slate-800">
            {formatCurrency(cash.cgst.total)}
          </div>
        </div>

        {/* SGST */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
          <span className="text-[10.5px] text-slate-500 font-medium block">SGST Cash</span>
          <div className="font-mono mt-1 text-xs font-bold text-slate-800">
            {formatCurrency(cash.sgst.total)}
          </div>
        </div>

        {/* Cess */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
          <span className="text-[10.5px] text-slate-500 font-medium block">Cess Cash</span>
          <div className="font-mono mt-1 text-xs font-bold text-slate-800">
            {formatCurrency(cash.cess.total)}
          </div>
        </div>
      </div>
    </div>
  );
}
