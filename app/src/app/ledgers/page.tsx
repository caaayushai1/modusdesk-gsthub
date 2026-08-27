'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { CreditLedgerBalance, CashLedgerBalance } from '@/lib/ledger-types';
import { CreditLedgerCard } from '@/components/ledgers/credit-ledger-card';
import { CashLedgerCard } from '@/components/ledgers/cash-ledger-card';
import { ITCOffsetSimulator } from '@/components/ledgers/itc-offset-simulator';
import { useGSTClients } from '@/lib/use-gst-clients';
import { RefreshCw } from 'lucide-react';

export default function LedgersPage() {
  const { clients } = useGSTClients();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [creditLedger, setCreditLedger] = useState<CreditLedgerBalance | null>(null);
  const [cashLedger, setCashLedger] = useState<CashLedgerBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Staging sample fallback clients if empty
  const effectiveClients = clients.length > 0 ? clients : [
    { id: 'stg-1', code: '001A', name: 'Apex Infotech Solutions Private Limited', gstin: '27AABCA1122D1Z4' },
    { id: 'stg-2', code: '002A', name: 'Bharat Pharma & Life Sciences LLP', gstin: '24BBBBB3344E1Z8' },
    { id: 'stg-3', code: '003A', name: 'Singhania Heavy Engineering Works', gstin: '27CCCCC5566F1Z1' },
    { id: 'stg-4', code: '004A', name: 'Zenith Logistics & Supply Chain Pvt Ltd', gstin: '29DDDDD7788G1Z9' },
    { id: 'stg-5', code: '005A', name: 'Kalyan Jewellers & Craftsmen Co', gstin: '33EEEEE9900H1Z2' },
  ];

  useEffect(() => {
    if (effectiveClients.length > 0 && !selectedClientId) {
      setSelectedClientId(effectiveClients[0].id);
    }
  }, [effectiveClients, selectedClientId]);

  const selectedClient = effectiveClients.find((c) => c.id === selectedClientId) || effectiveClients[0] || {
    id: 'none',
    code: '---',
    name: 'No client selected',
    gstin: '---'
  };

  const fetchLedgers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/ledgers?clientId=${selectedClientId}`);
      const json = await res.json();
      if (json.success) {
        setCreditLedger(json.creditLedger);
        setCashLedger(json.cashLedger);
      }
    } catch (err: unknown) {
      console.error('Failed to load ledgers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClientId]);

  useEffect(() => {
    fetchLedgers();
  }, [fetchLedgers]);

  return (
    <div className="space-y-3.5 max-w-7xl animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Ledgers & Offset
          </h1>
        </div>

        {/* Client Selector & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-semibold outline-none focus:border-emerald-500 focus:bg-white cursor-pointer max-w-[240px]"
          >
            {effectiveClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchLedgers}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Refresh latest electronic ledger balances"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs text-slate-400 font-medium">
            Loading electronic ledger balances...
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Credit & Cash Ledger Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {creditLedger && <CreditLedgerCard credit={creditLedger} />}
            {cashLedger && <CashLedgerCard cash={cashLedger} />}
          </div>

          {/* Interactive Rule 88A Offset Simulator */}
          {creditLedger && <ITCOffsetSimulator credit={creditLedger} />}
        </div>
      )}
    </div>
  );
}
