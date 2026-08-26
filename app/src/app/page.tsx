import { QuickLoginCard } from '@/components/quick-login-card';

export default function HubDashboard() {
  return (
    <div>
      {/* Welcome Banner */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">GST Practice Hub</h2>
        <p className="mt-1 text-sm text-gray-500">
          Automate GST portal interactions, track filing compliance, and reconcile ITC — all from one place.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 1-Click Login Card */}
        <QuickLoginCard />

        {/* Placeholder Cards for Future Modules */}
        <div className="w-full max-w-md rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6">
          <h3 className="text-sm font-medium text-gray-400">📊 Filing Status Matrix</h3>
          <p className="mt-1 text-xs text-gray-400">Coming in Milestone 2</p>
        </div>

        <div className="w-full max-w-md rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6">
          <h3 className="text-sm font-medium text-gray-400">📥 Bulk Return Downloader</h3>
          <p className="mt-1 text-xs text-gray-400">Coming in Milestone 3</p>
        </div>

        <div className="w-full max-w-md rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6">
          <h3 className="text-sm font-medium text-gray-400">🔄 GSTR-2B vs Tally Reco</h3>
          <p className="mt-1 text-xs text-gray-400">Coming in Milestone 4</p>
        </div>

        <div className="w-full max-w-md rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6">
          <h3 className="text-sm font-medium text-gray-400">💰 Ledger Dashboard</h3>
          <p className="mt-1 text-xs text-gray-400">Coming in Milestone 5</p>
        </div>

        <div className="w-full max-w-md rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6">
          <h3 className="text-sm font-medium text-gray-400">📋 CA MIS Reports</h3>
          <p className="mt-1 text-xs text-gray-400">Coming in Milestone 5</p>
        </div>
      </div>
    </div>
  );
}
