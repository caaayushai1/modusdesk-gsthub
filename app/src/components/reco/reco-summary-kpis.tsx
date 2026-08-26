import React from 'react';
import type { RecoSummary } from '@/lib/reco-types';

interface RecoSummaryKpisProps {
  summary: RecoSummary;
  period: string;
}

export function RecoSummaryKpis({ summary, period }: RecoSummaryKpisProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Eligible Claimable ITC */}
      <div className="rounded-xl border border-emerald-200 bg-linear-to-br from-emerald-50/60 to-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Eligible Claimable ITC
          </span>
          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
            Safe for GSTR-3B
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-emerald-600">
            {formatCurrency(summary.eligibleClaimableItc)}
          </span>
        </div>
        <div className="mt-3 flex justify-between text-xs text-emerald-700">
          <span>Matched Invoices:</span>
          <span className="font-bold">{summary.exactMatchCount + summary.valueMismatchCount} invoices</span>
        </div>
      </div>

      {/* 2. At-Risk ITC (Missing in 2B) */}
      <div className="rounded-xl border border-rose-200 bg-linear-to-br from-rose-50/60 to-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
            At-Risk ITC (Missing in 2B)
          </span>
          <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700 animate-pulse">
            Vendor Defaulters
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-rose-600">
            {formatCurrency(summary.atRiskItcMissingIn2b)}
          </span>
        </div>
        <div className="mt-3 flex justify-between text-xs text-rose-700">
          <span>Defaulting Suppliers:</span>
          <span className="font-bold">{summary.missingIn2bCount} invoices missing</span>
        </div>
      </div>

      {/* 3. Unclaimed ITC (Missing in Books) */}
      <div className="rounded-xl border border-blue-200 bg-linear-to-br from-blue-50/60 to-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
            Unclaimed ITC (In 2B Only)
          </span>
          <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
            Pending Tally Entry
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-blue-600">
            {formatCurrency(summary.unclaimedItcMissingInBooks)}
          </span>
        </div>
        <div className="mt-3 flex justify-between text-xs text-blue-700">
          <span>Unrecorded Purchases:</span>
          <span className="font-bold">{summary.missingInBooksCount} invoices</span>
        </div>
      </div>

      {/* 4. Value Discrepancies */}
      <div className="rounded-xl border border-amber-200 bg-linear-to-br from-amber-50/60 to-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Value Mismatch Difference
          </span>
          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
            Rate Diff
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-amber-600">
            {formatCurrency(summary.valueMismatchTaxDiff)}
          </span>
        </div>
        <div className="mt-3 flex justify-between text-xs text-amber-700">
          <span>Mismatched Items:</span>
          <span className="font-bold">{summary.valueMismatchCount} invoices</span>
        </div>
      </div>
    </div>
  );
}
