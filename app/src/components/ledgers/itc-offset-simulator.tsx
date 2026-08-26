'use client';

import React, { useState, useMemo } from 'react';
import type { CreditLedgerBalance } from '@/lib/ledger-types';
import { calculateRule88AOffset } from '@/lib/ledger-types';

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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-700">
            Rule 88A Statutory Algorithm
          </span>
          <h3 className="mt-1 text-base font-bold text-gray-900">
            Interactive Tax Liability Offset & Cash Challan Simulator
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Simulate monthly GSTR-3B tax payment to compute optimal credit utilization and exact cash challan required.
          </p>
        </div>
      </div>

      {/* 1. Input Row: Gross Tax Liability */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-2">
          Step 1: Enter Tentative Gross Tax Liability for the Month:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">IGST Liability (₹)</label>
            <input
              type="number"
              value={igstLiability}
              onChange={(e) => setIgstLiability(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-900 focus:border-purple-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">CGST Liability (₹)</label>
            <input
              type="number"
              value={cgstLiability}
              onChange={(e) => setCgstLiability(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-900 focus:border-purple-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">SGST Liability (₹)</label>
            <input
              type="number"
              value={sgstLiability}
              onChange={(e) => setSgstLiability(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-900 focus:border-purple-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Cess Liability (₹)</label>
            <input
              type="number"
              value={cessLiability}
              onChange={(e) => setCessLiability(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-900 focus:border-purple-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Simulation Results: 3 Output Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Total Liability Card */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/75 p-4 text-xs space-y-2">
          <span className="font-bold text-gray-600 uppercase tracking-wider block text-[10px]">
            Gross Tax Liability
          </span>
          <div className="text-2xl font-black text-gray-900">
            {formatCurrency(offsetResult.totalTaxPayable)}
          </div>
          <div className="border-t border-gray-200 pt-2 space-y-1 text-gray-500 text-[11px]">
            <div className="flex justify-between">
              <span>IGST:</span>
              <span className="font-semibold text-gray-800">{formatCurrency(igstLiability)}</span>
            </div>
            <div className="flex justify-between">
              <span>CGST + SGST:</span>
              <span className="font-semibold text-gray-800">{formatCurrency(cgstLiability + sgstLiability)}</span>
            </div>
          </div>
        </div>

        {/* Credit Utilized Card */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 text-xs space-y-2">
          <span className="font-bold text-blue-800 uppercase tracking-wider block text-[10px]">
            Total ITC Credit Utilized (Rule 88A)
          </span>
          <div className="text-2xl font-black text-blue-700">
            {formatCurrency(offsetResult.totalCreditUtilized)}
          </div>
          <div className="border-t border-blue-100 pt-2 space-y-1 text-blue-900 text-[11px]">
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
        <div className="rounded-xl border border-purple-300 bg-purple-50/60 p-4 text-xs space-y-2">
          <span className="font-bold text-purple-900 uppercase tracking-wider block text-[10px]">
            💵 Net Cash Required (Challan PMT-06)
          </span>
          <div className="text-2xl font-black text-purple-800">
            {formatCurrency(offsetResult.netCashPayable.total)}
          </div>
          <div className="border-t border-purple-200 pt-2 space-y-1 text-purple-900 text-[11px]">
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
