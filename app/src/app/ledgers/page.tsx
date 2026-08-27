'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { CreditLedgerBalance, CashLedgerBalance } from '@/lib/ledger-types';
import { CreditLedgerCard } from '@/components/ledgers/credit-ledger-card';
import { CashLedgerCard } from '@/components/ledgers/cash-ledger-card';
import { useGSTClients } from '@/lib/use-gst-clients';
import { RefreshCw } from 'lucide-react';

export default function LedgersPage() {
  const { clients } = useGSTClients();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [creditLedger, setCreditLedger] = useState<CreditLedgerBalance | null>(null);
  const [cashLedger, setCashLedger] = useState<CashLedgerBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0];
  }, [clients, selectedClientId]);

  const fetchLedgers = useCallback(async () => {
    if (!selectedClientId) return;
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
          {clients.length > 0 ? (
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-semibold outline-none focus:border-emerald-500 focus:bg-white cursor-pointer max-w-[240px]"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-slate-400 font-mono">No clients registered</span>
          )}

          <button
            onClick={fetchLedgers}
            disabled={isLoading || !selectedClientId}
            className="w-24 h-8 flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer select-none"
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
      ) : creditLedger || cashLedger ? (
        <div className="space-y-3.5">
          {/* Electronic Credit Ledger */}
          {creditLedger && <CreditLedgerCard credit={creditLedger} />}

          {/* Electronic Cash Ledger */}
          {cashLedger && <CashLedgerCard cash={cashLedger} />}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs text-slate-400 font-medium">
            Select a client and click Refresh to load live Electronic Cash & Credit ledger balances.
          </p>
        </div>
      )}
    </div>
  );
}
