import React from 'react';
import type { MatrixMetrics } from '@/lib/matrix-types';

interface MatrixSummaryCardsProps {
  metrics: MatrixMetrics;
  period: string;
}

export function MatrixSummaryCards({ metrics, period }: MatrixSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Active GSTINs */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Active GST Registrations
          </span>
          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
            {period}
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-gray-900">{metrics.totalGstins}</span>
          <span className="text-xs text-gray-500">total clients</span>
        </div>
        <div className="mt-3 text-xs text-gray-600 flex justify-between items-center">
          <span>Fully Compliant (1 & 3B):</span>
          <span className="font-bold text-green-600">{metrics.fullyFiledCount}</span>
        </div>
      </div>

      {/* 2. GSTR-1 Compliance */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            GSTR-1 / IFF Filed
          </span>
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
            {metrics.gstr1Percentage}%
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-emerald-600">{metrics.gstr1FiledCount}</span>
          <span className="text-xs text-gray-500">/ {metrics.totalGstins} filed</span>
        </div>
        <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${metrics.gstr1Percentage}%` }}
          />
        </div>
      </div>

      {/* 3. GSTR-3B Compliance */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            GSTR-3B Filed
          </span>
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
            {metrics.gstr3bPercentage}%
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-indigo-600">{metrics.gstr3bFiledCount}</span>
          <span className="text-xs text-gray-500">/ {metrics.totalGstins} filed</span>
        </div>
        <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${metrics.gstr3bPercentage}%` }}
          />
        </div>
      </div>

      {/* 4. Action Required / Pending */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Pending Filings
          </span>
          {metrics.overdueCount > 0 ? (
            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 animate-pulse">
              {metrics.overdueCount} Overdue
            </span>
          ) : (
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
              In Progress
            </span>
          )}
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-amber-600">{metrics.pendingCount}</span>
          <span className="text-xs text-gray-500">pending completion</span>
        </div>
        <div className="mt-3 text-xs text-gray-500 flex justify-between">
          <span>Target due date:</span>
          <span className="font-semibold text-gray-800">20th of Month</span>
        </div>
      </div>
    </div>
  );
}
