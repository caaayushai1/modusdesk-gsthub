'use client';

import React, { useState, useMemo } from 'react';
import type { CreditLedgerBalance } from '@/lib/ledger-types';
import { calculateRule88AOffset } from '@/lib/ledger-types';
import { Calculator, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface ITCOffsetSimulatorProps {
  credit: CreditLedgerBalance;
}

export function ITCOffsetSimulator({ credit }: ITCOffsetSimulatorProps) {
  const [igstLiability, setIgstLiability] = useState(1500000);
  const [cgstLiability, setCgstLiability] = useState(800000);
  const [sgstLiability, setSgstLiability] = useState(800000);
  const [cessLiability, setCessLiability] = useState(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const offsetResult = useMemo(() => {
    return calculateRule88AOffset(
      {
        igstLiability,
        cgstLiability,
        sgstLiability,
        cessLiability,
      },
      credit
    );
  }, [igstLiability, cgstLiability, sgstLiability, cessLiability, credit]);

  return (
    <div className="card-enterprise p-6 bg-white border border-slate-200 shadow-xs space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Rule 88A Engine
              </span>
              <h3 className="text-headline-sm font-bold text-slate-900">
                Tax Liability Offset & PMT-06 Cash Challan Simulator
              </h3>
            </div>
            <p className="text-body-sm text-slate-500 mt-0.5">
              Simulate monthly GSTR-3B tax payment to compute optimal credit utilization and exact cash challan required.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Input Row: Gross Tax Liability */}
      <div>
        <label className="text-label-caps text-slate-700 block mb-2 font-bold">
          Step 1: Enter Tentative Gross Tax Liability for the Month:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-body-sm font-medium text-slate-600 mb-1">IGST Liability (₹)</label>
            <input
              type="number"
              value={igstLiability}
              onChange={(e) => setIgstLiability(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/70 px-3.5 py-2 font-jetbrains text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-slate-600 mb-1">CGST Liability (₹)</label>
            <input
              type="number"
              value={cgstLiability}
              onChange={(e) => setCgstLiability(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/70 px-3.5 py-2 font-jetbrains text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-slate-600 mb-1">SGST Liability (₹)</label>
            <input
              type="number"
              value={sgstLiability}
              onChange={(e) => setSgstLiability(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/70 px-3.5 py-2 font-jetbrains text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-slate-600 mb-1">Cess Liability (₹)</label>
            <input
              type="number"
              value={cessLiability}
              onChange={(e) => setCessLiability(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/70 px-3.5 py-2 font-jetbrains text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* 2. Simulation Results: 3 Output Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Total Liability Card */}
        <div className="card-enterprise p-5 bg-slate-50/80 border border-slate-200 text-xs space-y-2">
          <span className="text-label-caps text-slate-500 block">
            Gross Tax Liability
          </span>
          <div className="font-jetbrains text-2xl font-bold text-slate-900">
            {formatCurrency(offsetResult.totalTaxPayable)}
          </div>
          <div className="border-t border-slate-200 pt-2 space-y-1 text-slate-500 text-[11px] font-jetbrains">
            <div className="flex justify-between">
              <span>IGST:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(igstLiability)}</span>
            </div>
            <div className="flex justify-between">
              <span>CGST + SGST:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(cgstLiability + sgstLiability)}</span>
            </div>
          </div>
        </div>

        {/* Credit Utilized Card */}
        <div className="card-enterprise p-5 bg-emerald-50/40 border border-emerald-200 text-xs space-y-2">
          <span className="text-label-caps text-emerald-800 block">
            Total ITC Credit Utilized (Rule 88A)
          </span>
          <div className="font-jetbrains text-2xl font-bold text-emerald-700">
            {formatCurrency(offsetResult.totalCreditUtilized)}
          </div>
          <div className="border-t border-emerald-100 pt-2 space-y-1 text-emerald-900 text-[11px] font-jetbrains">
            <div className="flex justify-between">
              <span>IGST Credit Offset:</span>
              <span className="font-semibold">{formatCurrency(offsetResult.utilizedIgst.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>CGST + SGST Credit Offset:</span>
              <span className="font-semibold">{formatCurrency(offsetResult.utilizedCgst.total + offsetResult.utilizedSgst.total)}</span>
            </div>
          </div>
        </div>

        {/* Net Cash Required Card */}
        <div className="card-enterprise p-5 bg-teal-50/60 border border-teal-300 text-xs space-y-2">
          <span className="text-label-caps text-teal-900 block font-bold">
            💵 Net Cash Required (Challan PMT-06)
          </span>
          <div className="font-jetbrains text-2xl font-bold text-teal-800">
            {formatCurrency(offsetResult.netCashPayable.total)}
          </div>
          <div className="border-t border-teal-200 pt-2 space-y-1 text-teal-900 text-[11px] font-jetbrains">
            <div className="flex justify-between">
              <span>IGST Cash:</span>
              <span className="font-bold">{formatCurrency(offsetResult.netCashPayable.igst)}</span>
            </div>
            <div className="flex justify-between">
              <span>CGST + SGST Cash:</span>
              <span className="font-bold">{formatCurrency(offsetResult.netCashPayable.cgst + offsetResult.netCashPayable.sgst)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
