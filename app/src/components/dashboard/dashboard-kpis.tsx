'use client';

import React from 'react';
import { Users, CheckCircle2, AlertCircle, Wallet } from 'lucide-react';

interface DashboardKPIsProps {
  kpis: {
    complianceRate: number;
    totalFiledThisMonth: number;
    totalPendingThisMonth: number;
    totalOverdueThisMonth: number;
    totalAtRiskItc: number;
    totalCreditLedgerBalance: number;
    totalCashLedgerBalance: number;
  };
  totalGstins: number;
  period: string;
}

export function DashboardKPIs({ kpis, totalGstins, period }: DashboardKPIsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Practice Filing Compliance */}
      <div className="card-enterprise p-5 bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-label-caps text-slate-500 font-bold">
            Filing Compliance Rate
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-jetbrains text-3xl font-bold tracking-tight text-emerald-600">
            {kpis.complianceRate}%
          </span>
          <span className="text-body-sm text-slate-500">
            ({kpis.totalFiledThisMonth}/{totalGstins} filed)
          </span>
        </div>
        <div className="mt-3">
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${kpis.complianceRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Practice Client Accounts */}
      <div className="card-enterprise p-5 bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-label-caps text-slate-500 font-bold">
            Active Practice GSTINs
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-jetbrains text-3xl font-bold tracking-tight text-slate-900">
            {totalGstins}
          </span>
          <span className="text-body-sm text-slate-400">across 10 entities</span>
        </div>
        <div className="mt-3 flex justify-between text-body-sm text-slate-500 border-t border-slate-100 pt-2">
          <span>Pending / Overdue:</span>
          <span className="font-jetbrains font-bold text-rose-600">
            {kpis.totalPendingThisMonth + kpis.totalOverdueThisMonth} accounts
          </span>
        </div>
      </div>

      {/* 3. At-Risk ITC from Defaulting Vendors */}
      <div className="card-enterprise p-5 bg-white border border-rose-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-label-caps text-rose-800 font-bold">
            At-Risk ITC (Rule 37A/88D)
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center animate-pulse">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-jetbrains text-3xl font-bold tracking-tight text-rose-600">
            {formatCurrency(kpis.totalAtRiskItc)}
          </span>
        </div>
        <div className="mt-3 flex justify-between text-body-sm text-rose-600 border-t border-rose-100 pt-2">
          <span>Action Required:</span>
          <span className="font-jetbrains font-bold text-rose-700">Vendor Notices Ready</span>
        </div>
      </div>

      {/* 4. Total Practice Credit Pool */}
      <div className="card-enterprise p-5 bg-white border border-teal-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-label-caps text-teal-800 font-bold">
            Electronic Credit Balances
          </span>
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-jetbrains text-3xl font-bold tracking-tight text-teal-600">
            {formatCurrency(kpis.totalCreditLedgerBalance)}
          </span>
        </div>
        <div className="mt-3 flex justify-between text-body-sm text-teal-700 border-t border-teal-100 pt-2">
          <span>Cash Ledger:</span>
          <span className="font-jetbrains font-bold text-teal-800">
            {formatCurrency(kpis.totalCashLedgerBalance)}
          </span>
        </div>
      </div>
    </div>
  );
}
