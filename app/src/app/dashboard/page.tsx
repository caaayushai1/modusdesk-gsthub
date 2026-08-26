'use client';

import React, { useState, useEffect } from 'react';
import { DashboardKPIs } from '@/components/dashboard/dashboard-kpis';
import { UpcomingDeadlinesCard } from '@/components/dashboard/upcoming-deadlines-card';
import { QuickLaunchpad } from '@/components/dashboard/quick-launchpad';
import { DefaulterWatchlist } from '@/components/dashboard/defaulter-watchlist';
import { RecentActivityFeed } from '@/components/dashboard/recent-activity-feed';
import { RefreshCw, LayoutDashboard, Zap, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  practiceOverview: {
    totalClients: number;
    totalGstins: number;
    monthlyClients: number;
    qrmpClients: number;
    activeFiscalYear: string;
    activePeriod: string;
  };
  kpis: {
    complianceRate: number;
    totalFiledThisMonth: number;
    totalPendingThisMonth: number;
    totalOverdueThisMonth: number;
    totalAtRiskItc: number;
    totalCreditLedgerBalance: number;
    totalCashLedgerBalance: number;
  };
  upcomingDeadlines: Array<{
    returnType: string;
    description: string;
    dueDate: string;
    daysRemaining: number;
    status: string;
    category: string;
  }>;
  recentActivities: Array<{
    id: string;
    timestamp: string;
    type: string;
    title: string;
    description: string;
    status: string;
  }>;
  defaulterWatchlist: Array<{
    clientCode: string;
    clientName: string;
    gstin: string;
    issue: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    action: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Executive Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg font-bold text-slate-900">
              Practice Executive Dashboard
            </h1>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
              Practice Command Center
            </span>
          </div>
          <p className="text-body-md text-slate-500 mt-1">
            Real-time compliance intelligence, upcoming filing cut-offs, at-risk ITC alerts, and practice workflow launcher.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Feed'}</span>
          </button>

          <Link
            href="/matrix"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-2xs shadow-emerald-600/20"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Filing Matrix</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="card-enterprise p-16 text-center bg-white border border-slate-200 shadow-xs">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-body-sm text-slate-500 mt-3 font-medium">
            Aggregating practice compliance metrics...
          </p>
        </div>
      ) : (
        data && (
          <>
            {/* 1. Top Executive KPIs */}
            <DashboardKPIs
              kpis={data.kpis}
              totalGstins={data.practiceOverview.totalGstins}
              period={data.practiceOverview.activePeriod}
            />

            {/* 2. Middle Row: Deadlines & Action Watchlist */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <UpcomingDeadlinesCard deadlines={data.upcomingDeadlines} />
              </div>
              <div className="lg:col-span-1">
                <DefaulterWatchlist items={data.defaulterWatchlist} />
              </div>
            </div>

            {/* 3. Bottom Row: Quick Launchpad & Compliance Live Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <QuickLaunchpad />
              </div>
              <div className="lg:col-span-1">
                <RecentActivityFeed activities={data.recentActivities} />
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
