'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Lock, Building, FileCheck, CheckCircle2, Loader2, Search } from 'lucide-react';
import { computeCompositionQuarter } from '@/lib/composition-calculator';
import { saveGuestClient, saveGuestLedgerRow } from '@/lib/composition-guest-storage';
import { useGSTClients, GSTClient } from '@/lib/use-gst-clients';

interface CompositionAddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  financialYear: string;
  quarter: string;
  onClientAdded: () => void;
}

export function CompositionAddClientModal({
  isOpen,
  onClose,
  financialYear,
  quarter,
  onClientAdded,
}: CompositionAddClientModalProps) {
  const { clients: modusDeskClients, staffInfo } = useGSTClients();
  const isLoggedIn = !!staffInfo || modusDeskClients.length > 0;

  const [mode, setMode] = useState<'MODUSDESK' | 'CUSTOM'>('MODUSDESK');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientSearch, setClientSearch] = useState('');

  // Form Fields
  const [clientName, setClientName] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [portalUsername, setPortalUsername] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [gstin, setGstin] = useState('');

  const [saving, setSaving] = useState(false);
  const [isLoadingCreds, setIsLoadingCreds] = useState(false);
  const [hasVaultCreds, setHasVaultCreds] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync mode and default client selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSaving(false);
      setClientSearch('');
      if (isLoggedIn && modusDeskClients.length > 0) {
        setMode('MODUSDESK');
        const first = modusDeskClients[0];
        setSelectedClientId(first.id);
        setClientName(first.clientName || first.name);
        setClientCode(first.clientCode || first.code || '');
        setGstin(first.gstin || '');
        loadCredentials(first.id, first.gstin || '');
      } else {
        setMode('CUSTOM');
        setSelectedClientId('');
        setClientName('');
        setClientCode('');
        setPortalUsername('');
        setPortalPassword('');
        setGstin('');
        setHasVaultCreds(false);
      }
    }
  }, [isOpen, isLoggedIn, modusDeskClients]);

  // Load live decrypted credentials from ModusDesk vault
  const loadCredentials = async (cId: string, cGstin: string) => {
    try {
      setIsLoadingCreds(true);
      setHasVaultCreds(false);
      setPortalUsername('');
      setPassword('');

      const res = await fetch(`/api/clients/credentials?clientId=${encodeURIComponent(cId)}&gstin=${encodeURIComponent(cGstin)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.credentials) {
          if (json.credentials.username) setPortalUsername(json.credentials.username);
          if (json.credentials.password) {
            setPortalPassword(json.credentials.password);
            setHasVaultCreds(true);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load credentials from ModusDesk:', err);
    } finally {
      setIsLoadingCreds(false);
    }
  };

  const setPassword = (pwd: string) => {
    setPortalPassword(pwd);
  };

  const handleSelectClient = (cId: string) => {
    setSelectedClientId(cId);
    const client = modusDeskClients.find(c => c.id === cId);
    if (client) {
      setClientName(client.clientName || client.name);
      setClientCode(client.clientCode || client.code || '');
      setGstin(client.gstin || '');
      loadCredentials(client.id, client.gstin || '');
    }
  };

  if (!isOpen) return null;

  const filteredModusDeskClients = modusDeskClients.filter(c => {
    const term = clientSearch.toLowerCase();
    const name = (c.clientName || c.name || '').toLowerCase();
    const code = (c.clientCode || c.code || '').toLowerCase();
    const g = (c.gstin || '').toLowerCase();
    return name.includes(term) || code.includes(term) || g.includes(term);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = clientName.trim();
    const cleanUsername = portalUsername.trim();
    const cleanPassword = portalPassword.trim();
    const cleanGstin = gstin.trim().toUpperCase();

    if (!cleanName) {
      setError('Client Name is required.');
      return;
    }

    if (cleanGstin && cleanGstin.length !== 15) {
      setError('If entered, GSTIN must be exactly 15 characters.');
      return;
    }

    setSaving(true);
    try {
      const codeSuggestion = clientCode || (cleanGstin ? cleanGstin.substring(2, 6).toUpperCase() : cleanName.substring(0, 4).toUpperCase());
      const effectiveClientId = selectedClientId || `client_${Date.now()}`;

      // 1. If user is logged in, try to persist to database ledger
      if (isLoggedIn) {
        try {
          const res = await fetch('/api/composition/ledger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId: effectiveClientId,
              clientCode: codeSuggestion,
              clientName: cleanName,
              gstin: cleanGstin || '',
              financialYear,
              quarter,
              openingStock: 0,
              totalPurchases: 0,
              rcmTaxableValue: 0,
              rcmTaxPayable: 0,
              gpMargin: 10,
              actualSales: 0,
              taxRateOnSales: 1.0,
            })
          });

          if (!res.ok) {
            console.warn('API save returned non-200, caching locally');
          }
        } catch (apiErr) {
          console.warn('API save network/db error, caching locally:', apiErr);
        }
      }

      // 2. Also cache in guest storage so credentials & client details are instantly accessible offline/companion
      const guestClient = saveGuestClient({
        id: effectiveClientId,
        clientCode: codeSuggestion,
        clientName: cleanName,
        gstin: cleanGstin || '',
        stateCode: cleanGstin ? cleanGstin.substring(0, 2) : '',
        portalUsername: cleanUsername,
        portalPassword: cleanPassword,
      });

      const computed = computeCompositionQuarter({
        openingStock: 0,
        totalPurchases: 0,
        rcmTaxableValue: 0,
        rcmTaxPayable: 0,
        gpMarginPercent: 10,
        salesMode: 'ACTUAL',
        actualSales: 0,
      });

      saveGuestLedgerRow({
        id: `guest_row_${guestClient.id}_${financialYear}_${quarter}`,
        clientId: guestClient.id,
        clientCode: codeSuggestion,
        clientName: cleanName,
        gstin: cleanGstin || '',
        financialYear,
        quarter,
        openingStock: 0,
        prevQuarterClosingStock: null,
        totalPurchases: 0,
        rcmTaxableValue: 0,
        rcmTaxPayable: 0,
        gpMargin: 10,
        salesMode: 'ACTUAL',
        actualSales: 0,
        taxRateOnSales: 1.0,
        taxPayableOnSales: 0,
        totalCmp08Tax: 0,
        closingStock: computed.closingStock,
        status: 'DRAFT',
      });

      onClientAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error adding client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Add Client to Quarter</h2>
            <p className="text-xs text-gray-500 mt-0.5">{quarter} &bull; FY {financialYear}</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {/* Logged in mode selector */}
          {isLoggedIn && modusDeskClients.length > 0 && (
            <div className="flex rounded-xl bg-gray-100 p-1 mb-2">
              <button
                type="button"
                onClick={() => setMode('MODUSDESK')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'MODUSDESK'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Select from ModusDesk ({modusDeskClients.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('CUSTOM');
                  setSelectedClientId('');
                  setClientName('');
                  setGstin('');
                  setPortalUsername('');
                  setPortalPassword('');
                  setHasVaultCreds(false);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'CUSTOM'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Enter Manually
              </button>
            </div>
          )}

          {/* Mode 1: Select from ModusDesk */}
          {mode === 'MODUSDESK' && isLoggedIn && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Select Client <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleSelectClient(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-gray-50 focus:bg-white text-gray-900 font-medium"
                >
                  {filteredModusDeskClients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.clientName || c.name} {c.gstin ? `(${c.gstin})` : `[${c.clientCode || c.code}]`}
                    </option>
                  ))}
                </select>
              </div>

              {/* ModusDesk Vault Status Banner */}
              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-1.5">
                  {isLoadingCreds ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
                  ) : hasVaultCreds ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span className="font-medium text-gray-700">
                    {isLoadingCreds 
                      ? 'Fetching credentials from ModusDesk vault...' 
                      : hasVaultCreds 
                      ? 'Portal credentials linked from ModusDesk Vault' 
                      : 'Credentials not in Vault (enter below)'}
                  </span>
                </div>
                {portalUsername && (
                  <span className="font-mono text-gray-600 font-semibold">{portalUsername}</span>
                )}
              </div>
            </div>
          )}

          {/* Mode 2: Manual / Custom or Missing Credentials */}
          {(mode === 'CUSTOM' || !hasVaultCreds) && (
            <div className="space-y-3">
              {mode === 'CUSTOM' && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Client / Trade Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Subhasish Nath Traders"
                      required
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-gray-50 focus:bg-white text-gray-900 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Portal User ID & Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Portal User ID
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={portalUsername}
                      onChange={(e) => setPortalUsername(e.target.value)}
                      placeholder="User ID"
                      className="w-full pl-8 pr-2.5 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-gray-50 focus:bg-white text-gray-900 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Portal Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="password"
                      value={portalPassword}
                      onChange={(e) => setPortalPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full pl-8 pr-2.5 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-gray-50 focus:bg-white text-gray-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* GSTIN */}
              {mode === 'CUSTOM' && (
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    GSTIN <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <FileCheck className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      placeholder="15-digit GSTIN (optional)"
                      maxLength={15}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-gray-50 focus:bg-white text-gray-900 font-mono uppercase"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add to Ledger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
