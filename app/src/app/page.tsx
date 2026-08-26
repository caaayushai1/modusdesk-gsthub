import Link from 'next/link';
import { QuickLoginCard } from '@/components/quick-login-card';

export default function HubDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
          GST Practice Workspace
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Statutory GST automation engine: 1-click portal login, live filing matrix, bulk downloads, and ITC reconciliation.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 1. 1-Click Login Card (Active) */}
        <QuickLoginCard />

        {/* 2. Live Filing Status Matrix (Active Milestone 2) */}
        <Link
          href="/matrix"
          className="group block rounded-xl border border-blue-200 bg-linear-to-br from-blue-50/60 to-white p-6 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🌐</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              Live & Active
            </span>
          </div>
          <h3 className="mt-3 text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            Practice Filing Matrix
          </h3>
          <p className="mt-1 text-xs text-gray-600">
            Real-time compliance grid tracking GSTR-1, GSTR-3B, and GSTR-2B filing statuses for all clients with Smart Delta Sync.
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
            Open Practice Matrix →
          </div>
        </Link>

        {/* 3. Bulk Return Downloader (Active Milestone 3) */}
        <Link
          href="/downloader"
          className="group block rounded-xl border border-blue-200 bg-linear-to-br from-indigo-50/60 to-white p-6 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">📥</span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
              Live & Active
            </span>
          </div>
          <h3 className="mt-3 text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
            Bulk Return Downloader
          </h3>
          <p className="mt-1 text-xs text-gray-600">
            Preview-First statutory extractor: Multi-period mass extraction of GSTR-1, 3B, 2B & ARN receipts with in-browser preview.
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
            Open Downloader Studio →
          </div>
        </Link>

        {/* 4. GSTR-2B vs Tally Reco (Active Milestone 4) */}
        <Link
          href="/reco"
          className="group block rounded-xl border border-blue-200 bg-linear-to-br from-emerald-50/60 to-white p-6 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">📊</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              Live & Active
            </span>
          </div>
          <h3 className="mt-3 text-base font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
            2B vs Purchase Reco
          </h3>
          <p className="mt-1 text-xs text-gray-600">
            Intelligent 5-bucket matching engine: Fuzzy invoice normalization, at-risk ITC calculation & 1-click vendor notices.
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
            Open Reco Studio →
          </div>
        </Link>

        {/* 5. Ledger Dashboard (Active Milestone 5) */}
        <Link
          href="/ledgers"
          className="group block rounded-xl border border-blue-200 bg-linear-to-br from-purple-50/60 to-white p-6 shadow-xs hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">💰</span>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
              Live & Active
            </span>
          </div>
          <h3 className="mt-3 text-base font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
            Ledger & Offset Studio
          </h3>
          <p className="mt-1 text-xs text-gray-600">
            Real-time cash and credit ledgers with interactive Rule 88A tax offset and PMT-06 cash challan calculator.
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-purple-600 group-hover:translate-x-1 transition-transform">
            Open Ledgers Studio →
          </div>
        </Link>

        {/* 6. CA MIS Reports (Active Milestone 5) */}
        <Link
          href="/mis"
          className="group block rounded-xl border border-blue-200 bg-linear-to-br from-indigo-50/60 to-white p-6 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">📋</span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
              Live & Active
            </span>
          </div>
          <h3 className="mt-3 text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
            CA MIS Suite
          </h3>
          <p className="mt-1 text-xs text-gray-600">
            Statutory cross-reconciliations: Rule 88C (GSTR-1 vs 3B), Rule 88D (2B vs 3B), and Annual GSTR-9 schedules.
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
            Open CA MIS Suite →
          </div>
        </Link>
      </div>
    </div>
  );
}
