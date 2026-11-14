'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Download, 
  FileSpreadsheet, 
  Layers, 
  PlusCircle, 
  Search, 
  TrendingUp, 
  Zap, 
  BarChart3, 
  Calendar,
  ShieldCheck,
  RefreshCw,
  ArrowUpDown
} from 'lucide-react';
import { CompositionLedgerTable } from '@/components/composition/composition-ledger-table';
import { CompositionImportModal } from '@/components/composition/composition-import-modal';
import { Gstr4AnnualSummary } from '@/components/composition/gstr4-annual-summary';
import { QuickLoginModal } from '@/components/quick-login/quick-login-modal';

export default function CompositionSchemePage() {
  const [financialYear, setFinancialYear] = useState('2026-27');
  const [quarter, setQuarter] = useState('Q2');
  const [viewMode, setViewMode] = useState<'QUARTERLY' | 'ANNUAL'>('QUARTERLY');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isQuickLoginOpen, setIsQuickLoginOpen] = useState(false);
  const [quickLoginTargetGstin, setQuickLoginTargetGstin] = useState<string | undefined>(undefined);

  // Stats for the current quarter
  const [stats, setStats] = useState({
    clientCount: 0,
    totalPurchases: 0,
    totalTurnover: 0,
    totalTax: 0,
    totalClosingStock: 0,
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch summary stats
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch(`/api/composition/ledger?fy=${financialYear}&quarter=${quarter}`);
        if (!res.ok) return;
        const data = await res.json();
        const records = data.records || [];

        const totalPurchases = records.reduce((s: number, r: any) => s + (r.totalPurchases || 0), 0);
        const totalTurnover = records.reduce((s: number, r: any) => s + (r.actualSales || 0), 0);
        const totalTax = records.reduce((s: number, r: any) => s + (r.totalCmp08Tax || 0), 0);
        const totalClosingStock = records.reduce((s: number, r: any) => s + (r.closingStock || 0), 0);

        setStats({
          clientCount: records.length,
          totalPurchases,
          totalTurnover,
          totalTax,
          totalClosingStock,
        });
      } catch (err) {
        console.error('Failed to load composition stats:', err);
      }
    }

    loadStats();
  }, [financialYear, quarter, refreshTrigger]);

  const handleLaunchCompanion = (gstin: string) => {
    setQuickLoginTargetGstin(gstin);
    setIsQuickLoginOpen(true);
  };

  const handleExportCsv = () => {
    window.location.href = `/api/composition/export?fy=${financialYear}&quarter=${quarter}`;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const quarterLabels: Record<string, string> = {
    Q1: 'Q1 (Apr - Jun)',
    Q2: 'Q2 (Jul - Sep)',
    Q3: 'Q3 (Oct - Dec)',
    Q4: 'Q4 (Jan - Mar)'
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              SECTION 10 COMPLIANCE
            </span>
            <span className="text-xs text-gray-400">&bull;</span>
            <span className="text-xs font-semibold text-gray-500">Chartered Accountant Practice Suite</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            GST Composition Scheme &amp; Stock Audit Ledger
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Quarterly Form CMP-08 filing, 1-Click GSTR-2A Ingestion, RCM cash liability segregation, and auto closing stock audit.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* 1-Click Import Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>1-Click Import GSTR-2A</span>
          </button>

          {/* Toggle View Mode Button */}
          <button
            onClick={() => setViewMode(prev => prev === 'QUARTERLY' ? 'ANNUAL' : 'QUARTERLY')}
            className={`inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
              viewMode === 'ANNUAL'
                ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-purple-600" />
            <span>{viewMode === 'ANNUAL' ? 'Quarterly CMP-08 View' : 'Annual GSTR-4 View'}</span>
          </button>

          {/* Export to Excel / CSV */}
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {/* Quick Login Top Button */}
          <button
            onClick={() => {
              setQuickLoginTargetGstin(undefined);
              setIsQuickLoginOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors"
          >
            <Zap className="w-3.5 h-3.5 fill-emerald-600" />
            <span>Quick Login</span>
          </button>
        </div>
      </div>

      {/* Control Strip: FY Selector, Quarter Selector, and Client Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* FY & Quarter Selection */}
        <div className="flex items-center flex-wrap gap-3">
          {/* FY Select */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-500">Financial Year:</span>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="2026-27">FY 2026-27</option>
              <option value="2025-26">FY 2025-26</option>
              <option value="2024-25">FY 2024-25</option>
            </select>
          </div>

          {/* Quarter Pills (only in Quarterly mode) */}
          {viewMode === 'QUARTERLY' && (
            <div className="flex items-center bg-gray-100 p-1 rounded-xl space-x-1">
              {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuarter(q)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    quarter === q
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {quarterLabels[q]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search client code, name, GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Clients */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Composite Clients</span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {quarter} ({financialYear})
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.clientCount}</div>
          <div className="text-[11px] text-gray-400 mt-1">Section 10 Taxpayers Enrolled</div>
        </div>

        {/* Card 2: Purchases */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Inward Purchases</span>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Tax Capitalized
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">
            {formatCurrency(stats.totalPurchases)}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">From GSTR-2A Invoices (Excl. RCM)</div>
        </div>

        {/* Card 3: Declared Turnover */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Aggregate Turnover</span>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              Sales Output
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">
            {formatCurrency(stats.totalTurnover)}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">CMP-08 Table 3(a) Outward Supplies</div>
        </div>

        {/* Card 4: Total CMP-08 Tax Due */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Total CMP-08 Tax Due</span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Table 3(c)
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-800 mt-2 font-mono">
            {formatCurrency(stats.totalTax)}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">Sales 1% Tax + RCM Cash Liability</div>
        </div>
      </div>

      {/* Main Content: Either Quarterly Ledger Table OR Annual GSTR-4 Consolidation */}
      {viewMode === 'ANNUAL' ? (
        <Gstr4AnnualSummary
          financialYear={financialYear}
          onClose={() => setViewMode('QUARTERLY')}
        />
      ) : (
        <CompositionLedgerTable
          financialYear={financialYear}
          quarter={quarter}
          searchTerm={searchTerm}
          onRefreshNeeded={() => setRefreshTrigger(prev => prev + 1)}
          onLaunchCompanion={handleLaunchCompanion}
        />
      )}

      {/* Import Modal */}
      <CompositionImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        selectedQuarter={quarter}
        selectedFy={financialYear}
        onImportSuccess={() => setRefreshTrigger(prev => prev + 1)}
      />

      {/* Quick Login Modal */}
      <QuickLoginModal
        isOpen={isQuickLoginOpen}
        onClose={() => setIsQuickLoginOpen(false)}
        initialGstin={quickLoginTargetGstin}
      />
    </div>
  );
}
