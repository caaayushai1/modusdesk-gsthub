'use client';

import React, { useState } from 'react';
import { X, User, Lock, Building, FileCheck } from 'lucide-react';
import { computeCompositionQuarter } from '@/lib/composition-calculator';
import { saveGuestClient, saveGuestLedgerRow } from '@/lib/composition-guest-storage';

interface CompositionAddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  financialYear: string;
  quarter: string;
  isGuestMode?: boolean;
  onClientAdded: () => void;
}

export function CompositionAddClientModal({
  isOpen,
  onClose,
  financialYear,
  quarter,
  onClientAdded,
}: CompositionAddClientModalProps) {
  const [clientName, setClientName] = useState('');
  const [gstin, setGstin] = useState('');
  const [portalUsername, setPortalUsername] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [taxRate, setTaxRate] = useState('1.0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = clientName.trim();
    const cleanGstin = gstin.trim().toUpperCase();
    const cleanUsername = portalUsername.trim();
    const cleanPassword = portalPassword.trim();

    if (!cleanName) {
      setError('Client / Trade Name is required.');
      return;
    }

    if (!cleanGstin || cleanGstin.length !== 15) {
      setError('Valid 15-digit GSTIN is required.');
      return;
    }

    setSaving(true);
    try {
      // Generate a clean client code from name initials or GSTIN state/pan
      const codeSuggestion = cleanGstin.substring(2, 6).toUpperCase();

      // Save strictly to local browser cache (does not touch or affect database)
      const guestClient = saveGuestClient({
        clientCode: codeSuggestion,
        clientName: cleanName,
        gstin: cleanGstin,
        stateCode: cleanGstin.substring(0, 2),
        portalUsername: cleanUsername || undefined,
        portalPassword: cleanPassword || undefined,
      });

      // Also seed an initial clean working paper row in cache for current FY & Quarter
      const rateNum = parseFloat(taxRate) || 1.0;
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
        gstin: cleanGstin,
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
        taxRateOnSales: rateNum,
        taxPayableOnSales: 0,
        totalCmp08Tax: 0,
        closingStock: computed.closingStock,
        status: 'DRAFT',
      });

      // Clear form & trigger parent update
      setClientName('');
      setGstin('');
      setPortalUsername('');
      setPortalPassword('');
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
          <h2 className="text-base font-bold text-gray-900">Add Client</h2>
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

          {/* Client / Trade Name */}
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

          {/* GSTIN */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              GSTIN <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileCheck className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="15-digit GSTIN (e.g. 18ADKPN2167Q2ZR)"
                maxLength={15}
                required
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-gray-50 focus:bg-white text-gray-900 font-mono uppercase"
              />
            </div>
          </div>

          {/* Portal User ID & Password (Important for GSTR-2A import & Quick Login) */}
          <div className="pt-1 border-t border-gray-100">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-2">
              GST Portal Credentials (for GSTR-2A Import & Quick Login)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Portal User ID</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={portalUsername}
                    onChange={(e) => setPortalUsername(e.target.value)}
                    placeholder="Portal username"
                    className="w-full pl-8 pr-2.5 py-1.5 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-gray-50 focus:bg-white text-gray-900 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Portal Password</label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="password"
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    placeholder="Portal password"
                    className="w-full pl-8 pr-2.5 py-1.5 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-gray-50 focus:bg-white text-gray-900 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Composition Rate */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Composition Tax Rate</label>
            <select
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-gray-50 text-gray-800"
            >
              <option value="1.0">1% (0.5% CGST + 0.5% SGST) — Traders &amp; Manufacturers</option>
              <option value="5.0">5% (2.5% CGST + 2.5% SGST) — Restaurants &amp; Catering</option>
              <option value="6.0">6% (3% CGST + 3% SGST) — Section 10(2A) Service Providers</option>
            </select>
          </div>

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
              {saving ? 'Adding...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
