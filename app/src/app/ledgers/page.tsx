'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { CreditLedgerBalance, CashLedgerBalance } from '@/lib/ledger-types';
import { CreditLedgerCard } from '@/components/ledgers/credit-ledger-card';
import { CashLedgerCard } from '@/components/ledgers/cash-ledger-card';
import { ITCOffsetSimulator } from '@/components/ledgers/itc-offset-simulator';
import { Wallet } from 'lucide-react';

import { useGSTClients } from '@/lib/use-gst-clients';

export default function LedgersPage() {
  const { clients } = useGSTClients();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [creditLedger, setCreditLedger] = useState<CreditLedgerBalance | null>(null);
  const [cashLedger, setCashLedger] = useState<CashLedgerBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0] || {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg font-bold text-slate-900">
              Electronic Ledgers & ITC Offset Studio
            </h1>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
              Section 49 Engine
            </span>
          </div>
          <p className="text-body-md text-slate-500 mt-1">
            Real-time Credit & Cash ledger monitoring with Section 49 / Rule 88A statutory tax payment simulator.
          </p>
        </div>

        {/* Client Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Target Client:</label>
          <div className="relative">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:border-emerald-500 outline-none cursor-pointer"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="card-enterprise p-16 text-center bg-white border border-slate-200 shadow-xs">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-body-sm text-slate-500 mt-3 font-medium">
            Loading electronic ledger balances...
          </p>
        </div>
      ) : (
        <>
          {/* Credit & Cash Ledger Cards */}
          <div className="grid grid-cols-1 gap-6">
            {creditLedger && <CreditLedgerCard credit={creditLedger} />}
            {cashLedger && <CashLedgerCard cash={cashLedger} />}
          </div>

          {/* Interactive Rule 88A Offset Simulator */}
          {creditLedger && <ITCOffsetSimulator credit={creditLedger} />}
        </>
      )}
    </div>
  );
}
