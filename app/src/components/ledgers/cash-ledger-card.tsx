import React from 'react';
import type { CashLedgerBalance } from '@/lib/ledger-types';
import { Wallet, ShieldCheck } from 'lucide-react';

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
    <div className="card-enterprise p-6 bg-white border border-slate-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-800">
                Form GST PMT-05
              </span>
              <h3 className="text-headline-sm font-bold text-slate-900">
                Electronic Cash Ledger
              </h3>
            </div>
            <p className="text-body-sm text-slate-500 mt-0.5">
              Available cash balance deposited via Challan PMT-06 ready for statutory tax discharge.
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-label-caps text-slate-400 block">Total Cash Balance</span>
          <span className="font-jetbrains text-2xl font-bold tracking-tight text-teal-600">
            {formatCurrency(cash.totalCash)}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* IGST Cash */}
        <div className="rounded-xl bg-teal-50/40 border border-teal-100 p-4">
          <span className="text-label-caps text-teal-900 block font-bold">IGST Cash</span>
          <div className="font-jetbrains mt-1.5 text-lg font-bold text-teal-700">
            {formatCurrency(cash.igst.total)}
          </div>
          <span className="text-[10px] text-slate-400 font-jetbrains">Tax: {formatCurrency(cash.igst.tax)}</span>
        </div>

        {/* CGST Cash */}
        <div className="rounded-xl bg-teal-50/40 border border-teal-100 p-4">
          <span className="text-label-caps text-teal-900 block font-bold">CGST Cash</span>
          <div className="font-jetbrains mt-1.5 text-lg font-bold text-teal-700">
            {formatCurrency(cash.cgst.total)}
          </div>
          <span className="text-[10px] text-slate-400 font-jetbrains">Tax: {formatCurrency(cash.cgst.tax)}</span>
        </div>

        {/* SGST Cash */}
        <div className="rounded-xl bg-teal-50/40 border border-teal-100 p-4">
          <span className="text-label-caps text-teal-900 block font-bold">SGST Cash</span>
          <div className="font-jetbrains mt-1.5 text-lg font-bold text-teal-700">
            {formatCurrency(cash.sgst.total)}
          </div>
          <span className="text-[10px] text-slate-400 font-jetbrains">Tax: {formatCurrency(cash.sgst.tax)}</span>
        </div>

        {/* Cess Cash */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <span className="text-label-caps text-slate-700 block font-bold">Cess Cash</span>
          <div className="font-jetbrains mt-1.5 text-lg font-bold text-slate-800">
            {formatCurrency(cash.cess.total)}
          </div>
          <span className="text-[10px] text-slate-400 font-jetbrains">Tax: {formatCurrency(cash.cess.tax)}</span>
        </div>
      </div>
    </div>
  );
}
