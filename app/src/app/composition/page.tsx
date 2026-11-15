'use client';

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  Plus, 
  Search, 
  BarChart3, 
  Calendar
} from 'lucide-react';
import { CompositionLedgerTable } from '@/components/composition/composition-ledger-table';
import { CompositionImportModal } from '@/components/composition/composition-import-modal';
import { CompositionAddClientModal } from '@/components/composition/composition-add-client-modal';
import { Gstr4AnnualSummary } from '@/components/composition/gstr4-annual-summary';
import { QuickLoginModal } from '@/components/quick-login/quick-login-modal';
import { useGSTClients } from '@/lib/use-gst-clients';
import { getGuestLedger, getGuestClients } from '@/lib/composition-guest-storage';

export default function CompositionSchemePage() {
  const { staffInfo } = useGSTClients();
  const isGuestMode = !staffInfo;

  const [financialYear, setFinancialYear] = useState('2026-27');
  const [quarter, setQuarter] = useState('Q2');
  const [viewMode, setViewMode] = useState<'QUARTERLY' | 'ANNUAL'>('QUARTERLY');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
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
      if (isGuestMode) {
        // Guest mode: load stats from localStorage
        const guestRows = getGuestLedger(financialYear, quarter);
        const guestClients = getGuestClients();
        const clientCount = guestRows.length > 0 ? guestRows.length : guestClients.length;

        const totalPurchases = guestRows.reduce((s, r) => s + (r.totalPurchases || 0), 0);
        const totalTurnover = guestRows.reduce((s, r) => s + (r.actualSales || 0), 0);
        const totalTax = guestRows.reduce((s, r) => s + (r.totalCmp08Tax || 0), 0);
        const totalClosingStock = guestRows.reduce((s, r) => s + (r.closingStock || 0), 0);

        setStats({
          clientCount,
          totalPurchases,
          totalTurnover,
          totalTax,
          totalClosingStock,
        });
        return;
      }

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
  }, [financialYear, quarter, refreshTrigger, isGuestMode]);

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
    <div className="space-y-5">
      {/* Top Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Composition Scheme
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Quarterly CMP-08 filing, purchase ledger, and stock audit
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Add Client Button */}
          <button
            onClick={() => setIsAddClientModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client</span>
          </button>

          {/* Import GSTR-2A Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Import GSTR-2A</span>
          </button>

          {/* Toggle View Mode Button */}
          <button
            onClick={() => setViewMode(prev => prev === 'QUARTERLY' ? 'ANNUAL' : 'QUARTERLY')}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              viewMode === 'ANNUAL'
                ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
            <span>{viewMode === 'ANNUAL' ? 'Quarterly View' : 'Annual GSTR-4'}</span>
          </button>

          {/* Export to CSV */}
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-gray-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Control Strip: FY Selector, Quarter Selector, and Client Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* FY & Quarter Selection */}
        <div className="flex items-center flex-wrap gap-3">
          {/* FY Select */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-500">FY:</span>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="text-xs font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              <option value="2026-27">2026-27</option>
              <option value="2025-26">2025-26</option>
              <option value="2024-25">2024-25</option>
            </select>
          </div>

          {/* Quarter Buttons (only in Quarterly mode) */}
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
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search code, name, GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:ring-1 focus:ring-emerald-500 bg-gray-50 focus:bg-white outline-none"
          />
        </div>
      </div>

      {/* Metric Cards Banner (Simple, Minimal, CA-Focused) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Clients */}
        <div className="bg-white p-3.5 rounded-xl border border-gray-200">
          <span className="text-xs text-gray-500 font-medium">Clients</span>
          <div className="text-xl font-bold text-gray-900 mt-1">{stats.clientCount}</div>
        </div>

        {/* Card 2: Purchases */}
        <div className="bg-white p-3.5 rounded-xl border border-gray-200">
          <span className="text-xs text-gray-500 font-medium">Purchases (incl. Tax)</span>
          <div className="text-xl font-bold text-gray-900 mt-1 font-mono">
            {formatCurrency(stats.totalPurchases)}
          </div>
        </div>

        {/* Card 3: Declared Turnover */}
        <div className="bg-white p-3.5 rounded-xl border border-gray-200">
          <span className="text-xs text-gray-500 font-medium">Turnover</span>
          <div className="text-xl font-bold text-gray-900 mt-1 font-mono">
            {formatCurrency(stats.totalTurnover)}
          </div>
        </div>

        {/* Card 4: Total CMP-08 Tax Due */}
        <div className="bg-white p-3.5 rounded-xl border border-gray-200">
          <span className="text-xs text-gray-500 font-medium">CMP-08 Tax Due</span>
          <div className="text-xl font-bold text-emerald-800 mt-1 font-mono">
            {formatCurrency(stats.totalTax)}
          </div>
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
          key={`${financialYear}-${quarter}-${refreshTrigger}`}
          financialYear={financialYear}
          quarter={quarter}
          searchTerm={searchTerm}
          isGuestMode={isGuestMode}
          onRefreshNeeded={() => setRefreshTrigger(prev => prev + 1)}
          onLaunchCompanion={handleLaunchCompanion}
        />
      )}

      {/* Add Client Modal */}
      <CompositionAddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        financialYear={financialYear}
        quarter={quarter}
        isGuestMode={isGuestMode}
        onClientAdded={() => setRefreshTrigger(prev => prev + 1)}
      />

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
