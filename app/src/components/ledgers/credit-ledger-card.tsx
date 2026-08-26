import React from 'react';
import type { CreditLedgerBalance } from '@/lib/ledger-types';
import { CreditCard, Wallet, ShieldCheck } from 'lucide-react';

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
    <div className="card-enterprise p-6 bg-white border border-slate-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Form GST PMT-02
              </span>
              <h3 className="text-headline-sm font-bold text-slate-900">
                Electronic Credit Ledger
              </h3>
            </div>
            <p className="text-body-sm text-slate-500 mt-0.5">
              Available Input Tax Credit balances accumulated across tax heads.
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-label-caps text-slate-400 block">Total Credit Available</span>
          <span className="font-jetbrains text-2xl font-bold tracking-tight text-emerald-600">
            {formatCurrency(credit.totalCredit)}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* IGST */}
        <div className="rounded-xl bg-emerald-50/40 border border-emerald-100 p-4">
          <span className="text-label-caps text-emerald-900 block font-bold">Integrated Tax (IGST)</span>
          <div className="font-jetbrains mt-1.5 text-lg font-bold text-emerald-700">
            {formatCurrency(credit.igst)}
          </div>
        </div>

        {/* CGST */}
        <div className="rounded-xl bg-teal-50/40 border border-teal-100 p-4">
          <span className="text-label-caps text-teal-900 block font-bold">Central Tax (CGST)</span>
          <div className="font-jetbrains mt-1.5 text-lg font-bold text-teal-700">
            {formatCurrency(credit.cgst)}
          </div>
        </div>

        {/* SGST */}
        <div className="rounded-xl bg-teal-50/40 border border-teal-100 p-4">
          <span className="text-label-caps text-teal-900 block font-bold">State/UT Tax (SGST)</span>
          <div className="font-jetbrains mt-1.5 text-lg font-bold text-teal-700">
            {formatCurrency(credit.sgst)}
          </div>
        </div>

        {/* Cess */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <span className="text-label-caps text-slate-700 block font-bold">Compensation Cess</span>
          <div className="font-jetbrains mt-1.5 text-lg font-bold text-slate-800">
            {formatCurrency(credit.cess)}
          </div>
        </div>
      </div>
    </div>
  );
}
