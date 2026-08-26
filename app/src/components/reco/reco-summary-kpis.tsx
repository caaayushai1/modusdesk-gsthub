import React from 'react';
import type { RecoSummary } from '@/lib/reco-types';
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

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
      <div className="card-enterprise p-5 bg-white border border-emerald-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-label-caps text-emerald-800 font-bold">
            Eligible Claimable ITC
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-jetbrains text-3xl font-bold tracking-tight text-emerald-600">
            {formatCurrency(summary.eligibleClaimableItc)}
          </span>
        </div>
        <div className="mt-3 flex justify-between text-body-sm text-emerald-700 border-t border-emerald-100 pt-2">
          <span>Safe for GSTR-3B:</span>
          <span className="font-jetbrains font-bold">{summary.exactMatchCount + summary.valueMismatchCount} invoices</span>
        </div>
      </div>

      {/* 2. At-Risk ITC (Missing in 2B) */}
      <div className="card-enterprise p-5 bg-white border border-rose-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-label-caps text-rose-800 font-bold">
            At-Risk ITC (Missing in 2B)
          </span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center animate-pulse">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-jetbrains text-3xl font-bold tracking-tight text-rose-600">
            {formatCurrency(summary.atRiskItcMissingIn2b)}
          </span>
        </div>
        <div className="mt-3 flex justify-between text-body-sm text-rose-700 border-t border-rose-100 pt-2">
          <span>Defaulting Vendors:</span>
          <span className="font-jetbrains font-bold">{summary.missingIn2bCount} invoices</span>
        </div>
      </div>

      {/* 3. Unclaimed ITC (Missing in Books) */}
      <div className="card-enterprise p-5 bg-white border border-teal-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-label-caps text-teal-800 font-bold">
            Unclaimed ITC (In 2B Only)
          </span>
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-jetbrains text-3xl font-bold tracking-tight text-teal-600">
            {formatCurrency(summary.unclaimedItcMissingInBooks)}
          </span>
        </div>
        <div className="mt-3 flex justify-between text-body-sm text-teal-700 border-t border-teal-100 pt-2">
          <span>Unrecorded Purchases:</span>
          <span className="font-jetbrains font-bold">{summary.missingInBooksCount} invoices</span>
        </div>
      </div>

      {/* 4. Value Discrepancies */}
      <div className="card-enterprise p-5 bg-white border border-amber-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-label-caps text-amber-800 font-bold">
            Value Mismatch Difference
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-jetbrains text-3xl font-bold tracking-tight text-amber-600">
            {formatCurrency(summary.valueMismatchTaxDiff)}
          </span>
        </div>
        <div className="mt-3 flex justify-between text-body-sm text-amber-700 border-t border-amber-100 pt-2">
          <span>Rate Discrepancies:</span>
          <span className="font-jetbrains font-bold">{summary.valueMismatchCount} invoices</span>
        </div>
      </div>
    </div>
  );
}
