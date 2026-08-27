'use client';

import React from 'react';
import { Users, AlertTriangle, KeyRound, Zap, ShieldCheck } from 'lucide-react';

interface DashboardKPIsProps {
  totalGstins: number;
  totalPending: number;
  totalCredentialsSaved: number;
  companionOnline: boolean;
}

export function DashboardKPIs({
  totalGstins,
  totalPending,
  totalCredentialsSaved,
  companionOnline,
}: DashboardKPIsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {/* 1. Active GST Clients / Registrations */}
      <div className="group bg-white p-3 rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all duration-150 select-none">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-600 truncate">
            Active GSTINs
          </span>
          <div className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Users className="w-3 h-3" />
          </div>
        </div>
        <div className="mt-1.5 h-7 flex items-baseline">
          <span className="text-xl font-mono font-bold text-slate-900 tracking-tight leading-none">
            {totalGstins}
          </span>
        </div>
        <div className="mt-0.5 text-[10px] text-slate-400 font-medium truncate">
          Practice registrations
        </div>
      </div>

      {/* 2. Pending / Overdue Filings */}
      <div
        className={`group p-3 rounded-xl border transition-all duration-150 select-none ${
          totalPending > 0
            ? 'bg-rose-50/25 border-rose-200/90 hover:border-rose-300 hover:shadow-xs'
            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-medium truncate ${
              totalPending > 0 ? 'text-rose-900 font-semibold' : 'text-slate-600'
            }`}
          >
            Pending filings
          </span>
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
              totalPending > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
          </div>
        </div>
        <div className="mt-1.5 h-7 flex items-baseline">
          <span
            className={`text-xl font-mono font-bold tracking-tight leading-none ${
              totalPending > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {totalPending}
          </span>
        </div>
        <div
          className={`mt-0.5 text-[10px] font-medium truncate ${
            totalPending > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'
          }`}
        >
          {totalPending > 0 ? 'Action required' : 'All up to date'}
        </div>
      </div>

      {/* 3. 1-Click Saved Logins */}
      <div className="group bg-white p-3 rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all duration-150 select-none">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-600 truncate">
            Saved Logins
          </span>
          <div className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <KeyRound className="w-3 h-3" />
          </div>
        </div>
        <div className="mt-1.5 h-7 flex items-baseline">
          <span className="text-xl font-mono font-bold text-slate-900 tracking-tight leading-none">
            {totalCredentialsSaved}
          </span>
        </div>
        <div className="mt-0.5 text-[10px] text-slate-400 font-medium truncate">
          AES-256 encrypted
        </div>
      </div>

      {/* 4. Automated Portal Agent Status */}
      <div className="group bg-white p-3 rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all duration-150 select-none">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-600 truncate">
            Portal Auto-Login
          </span>
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
              companionOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Zap className="w-3 h-3" />
          </div>
        </div>
        <div className="mt-1.5 h-7 flex items-baseline">
          <span
            className={`text-sm sm:text-base font-bold tracking-tight leading-none ${
              companionOnline ? 'text-emerald-700' : 'text-slate-500'
            }`}
          >
            {companionOnline ? 'Online / Ready' : 'Offline'}
          </span>
        </div>
        <div className="mt-0.5 text-[10px] text-slate-400 font-medium truncate">
          Desktop Companion
        </div>
      </div>
    </div>
  );
}
