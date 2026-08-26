import React from 'react';
import type { MatrixMetrics } from '@/lib/matrix-types';
import { Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface MatrixSummaryCardsProps {
  metrics: MatrixMetrics;
  selectedPeriod: string;
}

export function MatrixSummaryCards({ metrics, selectedPeriod }: MatrixSummaryCardsProps) {
  const gstr1Pct = metrics.gstr1Percentage || 0;
  const gstr3bPct = metrics.gstr3bPercentage || 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total GSTINs */}
      <div className="card-enterprise p-5 bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-label-caps text-slate-500">Practice GSTINs</span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-jetbrains text-3xl font-bold tracking-tight text-slate-900">
            {metrics.totalGstins}
          </span>
          <span className="text-body-sm text-slate-400">active accounts</span>
        </div>
        <div className="mt-3 flex justify-between text-body-sm text-slate-500 border-t border-slate-100 pt-2">
          <span>Pending Action:</span>
          <span className="font-jetbrains font-semibold text-slate-800">{metrics.pendingCount}</span>
        </div>
      </div>

      {/* 2. GSTR-1 Compliance */}
      <div className="card-enterprise p-5 bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-label-caps text-slate-500">GSTR-1 Outward</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-jetbrains text-3xl font-bold tracking-tight text-emerald-600">
            {gstr1Pct}%
          </span>
          <span className="text-body-sm text-slate-500">
            ({metrics.gstr1FiledCount}/{metrics.totalGstins})
          </span>
        </div>
        <div className="mt-3">
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${gstr1Pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. GSTR-3B Compliance */}
      <div className="card-enterprise p-5 bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-label-caps text-slate-500">GSTR-3B Summary</span>
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-jetbrains text-3xl font-bold tracking-tight text-teal-600">
            {gstr3bPct}%
          </span>
          <span className="text-body-sm text-slate-500">
            ({metrics.gstr3bFiledCount}/{metrics.totalGstins})
          </span>
        </div>
        <div className="mt-3">
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-teal-500 transition-all duration-500"
              style={{ width: `${gstr3bPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Overdue Filings */}
      <div className="card-enterprise p-5 bg-white border border-rose-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-label-caps text-rose-700">Overdue Returns</span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center animate-pulse">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-jetbrains text-3xl font-bold tracking-tight text-rose-600">
            {metrics.overdueCount}
          </span>
          <span className="text-body-sm text-rose-500 font-medium">pending action</span>
        </div>
        <div className="mt-3 flex justify-between text-body-sm text-rose-600 border-t border-rose-100 pt-2">
          <span>Fully Filed Clients:</span>
          <span className="font-jetbrains font-bold text-slate-900">{metrics.fullyFiledCount}</span>
        </div>
      </div>
    </div>
  );
}
