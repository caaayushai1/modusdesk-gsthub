'use client';

import React, { useState, useEffect } from 'react';
import { DashboardKPIs } from '@/components/dashboard/dashboard-kpis';
import { UpcomingDeadlinesCard } from '@/components/dashboard/upcoming-deadlines-card';
import { DefaulterWatchlist, WatchlistItem } from '@/components/dashboard/defaulter-watchlist';
import { RecentActivityFeed, ActivityItem } from '@/components/dashboard/recent-activity-feed';
import { checkCompanionHealth } from '@/lib/companion-client';
import { useGSTClients } from '@/lib/use-gst-clients';

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
  recentActivities: ActivityItem[];
  defaulterWatchlist: WatchlistItem[];
}

export default function DashboardPage() {
  const { clients, isLoading: isClientsLoading } = useGSTClients();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companionOnline, setCompanionOnline] = useState(false);

  // Check Desktop Companion health on port 9090
  useEffect(() => {
    let isMounted = true;
    const checkCompanion = async () => {
      const health = await checkCompanionHealth();
      if (isMounted) {
        setCompanionOnline(health.status === 'HEALTHY');
      }
    };

    checkCompanion();
    const interval = setInterval(checkCompanion, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch live dashboard metrics
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setDashboardData(json.data);
          } else if (json.practiceOverview) {
            setDashboardData(json);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const totalGstins = clients.length > 0 ? clients.length : (dashboardData?.practiceOverview?.totalGstins || 0);
  const totalPending = dashboardData?.kpis?.totalPendingThisMonth || 0;
  const totalCredentialsSaved = clients.length; // Active client credential linkages

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Simple, Clean Heading "Dashboard" Matching ModusDesk Core */}
      <div className="flex items-center justify-between">
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          Dashboard
        </h1>
      </div>

      {isLoading && isClientsLoading ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="inline-block h-7 w-7 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Loading practice compliance overview...
          </p>
        </div>
      ) : (
        /* Main Split Layout: Left 2 Columns (4 Cards + Statutory Calendar) & Right 1 Column (Watchlist + Livestream) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          
          {/* Left Column (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-4">
            {/* 2. Compact 4-Card Metric Grid */}
            <DashboardKPIs
              totalGstins={totalGstins}
              totalPending={totalPending}
              totalCredentialsSaved={totalCredentialsSaved}
              companionOnline={companionOnline}
            />

            {/* 3. Statutory GST Compliance Calendar */}
            <UpcomingDeadlinesCard />
          </div>

          {/* Right Column (lg:col-span-1) */}
          <div className="lg:col-span-1 space-y-4">
            {/* 6a. Action Watchlist */}
            <DefaulterWatchlist items={dashboardData?.defaulterWatchlist || []} />

            {/* 6b. Compliance Live Stream */}
            <RecentActivityFeed activities={dashboardData?.recentActivities || []} />
          </div>
        </div>
      )}
    </div>
  );
}
