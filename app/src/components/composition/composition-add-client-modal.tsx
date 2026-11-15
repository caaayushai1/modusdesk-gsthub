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
  const [portalUsername, setPortalUsername] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [gstin, setGstin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = clientName.trim();
    const cleanUsername = portalUsername.trim();
    const cleanPassword = portalPassword.trim();
    const cleanGstin = gstin.trim().toUpperCase();

    if (!cleanName) {
      setError('Client / Trade Name is required.');
      return;
    }

    if (!cleanUsername) {
      setError('Portal User ID is required.');
      return;
    }

    if (!cleanPassword) {
      setError('Portal Password is required.');
      return;
    }

    if (cleanGstin && cleanGstin.length !== 15) {
      setError('If entered, GSTIN must be exactly 15 alphanumeric characters.');
      return;
    }

    setSaving(true);
    try {
      // Suggest client code from name initials or GSTIN
      const codeSuggestion = cleanGstin 
        ? cleanGstin.substring(2, 6).toUpperCase()
        : cleanName.substring(0, 4).toUpperCase();

      // Save strictly to local browser cache (zero database alteration)
      const guestClient = saveGuestClient({
        clientCode: codeSuggestion,
        clientName: cleanName,
        gstin: cleanGstin || '',
        stateCode: cleanGstin ? cleanGstin.substring(0, 2) : '',
        portalUsername: cleanUsername,
        portalPassword: cleanPassword,
      });

      // Also seed an initial clean working paper row in cache for current FY & Quarter
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

      // Clear form & trigger parent update
      setClientName('');
      setPortalUsername('');
      setPortalPassword('');
      setGstin('');
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

          {/* Portal User ID & Password (Mandatory) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Portal User ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  value={portalUsername}
                  onChange={(e) => setPortalUsername(e.target.value)}
                  placeholder="Portal username"
                  required
                  className="w-full pl-8 pr-2.5 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-gray-50 focus:bg-white text-gray-900 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Portal Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="password"
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                  placeholder="Portal password"
                  required
                  className="w-full pl-8 pr-2.5 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-gray-50 focus:bg-white text-gray-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* GSTIN (Optional) */}
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
