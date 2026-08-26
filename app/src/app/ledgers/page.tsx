'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { CreditLedgerBalance, CashLedgerBalance } from '@/lib/ledger-types';
import { CreditLedgerCard } from '@/components/ledgers/credit-ledger-card';
import { CashLedgerCard } from '@/components/ledgers/cash-ledger-card';
import { ITCOffsetSimulator } from '@/components/ledgers/itc-offset-simulator';

const CLIENTS = [
  { id: 'client_001A', code: '001A', name: 'Acme Corporation Ltd.', gstin: '27AABCA1234F1Z5' },
  { id: 'client_001B', code: '001B', name: 'Acme Gujarat Logistics', gstin: '24AABCA1234F1Z1' },
  { id: 'client_002A', code: '002A', name: 'TechFlow Solutions LLP', gstin: '27AABCT9876H1Z9' },
];

export default function LedgersPage() {
  const [selectedClientId, setSelectedClientId] = useState('client_001A');
  const [creditLedger, setCreditLedger] = useState<CreditLedgerBalance | null>(null);
  const [cashLedger, setCashLedger] = useState<CashLedgerBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const selectedClient = CLIENTS.find((c) => c.id === selectedClientId) || CLIENTS[0];

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Electronic Ledgers & ITC Offset Studio
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Real-time Credit & Cash ledger monitoring with Section 49 / Rule 88A statutory tax payment simulator.
          </p>
        </div>

        {/* Client Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-700 whitespace-nowrap">Target Client:</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-xs focus:border-blue-500 outline-none cursor-pointer"
          >
            {CLIENTS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-xs">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-xs font-medium text-gray-500">Loading electronic ledger balances...</p>
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
