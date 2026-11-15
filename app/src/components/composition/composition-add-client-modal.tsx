'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { computeCompositionQuarter } from '@/lib/composition-calculator';
import { saveGuestClient, saveGuestLedgerRow } from '@/lib/composition-guest-storage';

interface CompositionAddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  financialYear: string;
  quarter: string;
  isGuestMode: boolean;
  onClientAdded: () => void;
}

export function CompositionAddClientModal({
  isOpen,
  onClose,
  financialYear,
  quarter,
  isGuestMode,
  onClientAdded,
}: CompositionAddClientModalProps) {
  const [clientCode, setClientCode] = useState('');
  const [clientName, setClientName] = useState('');
  const [gstin, setGstin] = useState('');
  const [openingStock, setOpeningStock] = useState('');
  const [gpMargin, setGpMargin] = useState('10');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = clientCode.trim().toUpperCase();
    const cleanName = clientName.trim();
    const cleanGstin = gstin.trim().toUpperCase();

    if (!cleanCode || !cleanName || !cleanGstin) {
      setError('Client code, name, and GSTIN are required.');
      return;
    }

    if (cleanGstin.length !== 15) {
      setError('GSTIN must be exactly 15 alphanumeric characters.');
      return;
    }

    const opStockNum = parseFloat(openingStock) || 0;
    const gpMarginNum = parseFloat(gpMargin) || 10;

    setSaving(true);
    try {
      if (isGuestMode) {
        // Guest mode: save to local storage cache
        const guestClient = saveGuestClient({
          clientCode: cleanCode,
          clientName: cleanName,
          gstin: cleanGstin,
          stateCode: cleanGstin.substring(0, 2),
        });

        const computed = computeCompositionQuarter({
          openingStock: opStockNum,
          totalPurchases: 0,
          rcmTaxableValue: 0,
          rcmTaxPayable: 0,
          gpMarginPercent: gpMarginNum,
          salesMode: 'ACTUAL',
          actualSales: 0,
        });

        saveGuestLedgerRow({
          id: `guest_row_${guestClient.id}_${financialYear}_${quarter}`,
          clientId: guestClient.id,
          clientCode: cleanCode,
          clientName: cleanName,
          gstin: cleanGstin,
          financialYear,
          quarter,
          openingStock: opStockNum,
          prevQuarterClosingStock: null,
          totalPurchases: 0,
          rcmTaxableValue: 0,
          rcmTaxPayable: 0,
          gpMargin: gpMarginNum,
          salesMode: 'ACTUAL',
          actualSales: 0,
          taxRateOnSales: 1.0,
          taxPayableOnSales: 0,
          totalCmp08Tax: 0,
          closingStock: computed.closingStock,
          status: 'DRAFT',
        });
      } else {
        // Authenticated mode: save to DB
        const res = await fetch('/api/composition/ledger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: `client_${cleanCode.toLowerCase()}`,
            clientCode: cleanCode,
            clientName: cleanName,
            gstin: cleanGstin,
            financialYear,
            quarter,
            openingStock: opStockNum,
            gpMargin: gpMarginNum,
            salesMode: 'ACTUAL',
            actualSales: 0,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to save client to ledger');
        }
      }

      onClientAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error adding client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Add Client to Quarter</h2>
            <p className="text-xs text-gray-500 mt-0.5">{quarter} &bull; FY {financialYear}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Client Code</label>
              <input
                type="text"
                value={clientCode}
                onChange={(e) => setClientCode(e.target.value)}
                placeholder="e.g. 048A"
                required
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">GSTIN</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="15-digit GSTIN"
                maxLength={15}
                required
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Client / Trade Name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Subhasish Nath Traders"
              required
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Opening Stock (₹)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={openingStock}
                onChange={(e) => setOpeningStock(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono text-right"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Gross Profit Margin (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={gpMargin}
                onChange={(e) => setGpMargin(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono text-right"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add to Ledger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
