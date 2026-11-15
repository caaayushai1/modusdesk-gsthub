'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  FileText, 
  FileCheck2, 
  Check, 
  Calculator, 
  Trash2,
  ExternalLink
} from 'lucide-react';
import { computeCompositionQuarter } from '@/lib/composition-calculator';
import { CompositionInwardModal } from './composition-inward-modal';
import { Cmp08FilingModal } from './cmp08-filing-modal';
import { 
  getGuestLedger, 
  getGuestClients, 
  saveGuestLedgerRow, 
  deleteGuestClient 
} from '@/lib/composition-guest-storage';

export interface LedgerRowData {
  id: string;
  clientId: string;
  clientCode: string;
  clientName: string;
  gstin: string;
  financialYear: string;
  quarter: string;
  openingStock: number;
  prevQuarterClosingStock: number | null;
  totalPurchases: number;
  rcmTaxableValue: number;
  rcmTaxPayable: number;
  gpMargin: number;
  salesMode: 'ACTUAL' | 'DERIVED';
  actualSales: number;
  targetClosingStock?: number;
  taxRateOnSales: number;
  taxPayableOnSales: number;
  totalCmp08Tax: number;
  closingStock: number;
  status: string;
  notes?: string;
  inwardInvoiceCount?: number;
  isDirty?: boolean;
}

interface CompositionLedgerTableProps {
  financialYear: string;
  quarter: string;
  isGuestMode?: boolean;
  onRefreshNeeded?: () => void;
  onLaunchCompanion?: (gstin: string) => void;
  searchTerm?: string;
}

export function CompositionLedgerTable({
  financialYear,
  quarter,
  isGuestMode = false,
  onRefreshNeeded,
  onLaunchCompanion,
  searchTerm = ''
}: CompositionLedgerTableProps) {
  const [rows, setRows] = useState<LedgerRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);
  
  // Modals state
  const [activeInwardRecord, setActiveInwardRecord] = useState<LedgerRowData | null>(null);
  const [activeCmp08Record, setActiveCmp08Record] = useState<LedgerRowData | null>(null);

  // Fetch rows
  useEffect(() => {
    async function fetchLedger() {
      setLoading(true);

      if (isGuestMode) {
        const guestClients = getGuestClients();
        const guestRows = getGuestLedger(financialYear, quarter);
        const existingIds = new Set(guestRows.map(r => r.clientId));

        const missingClients = guestClients.filter(c => !existingIds.has(c.id));
        const newRows: LedgerRowData[] = missingClients.map(c => {
          const comp = computeCompositionQuarter({
            openingStock: 0,
            totalPurchases: 0,
            rcmTaxableValue: 0,
            rcmTaxPayable: 0,
            gpMarginPercent: 10.0,
            salesMode: 'ACTUAL',
            actualSales: 0,
          });
          return {
            id: `guest_row_${c.id}_${financialYear}_${quarter}`,
            clientId: c.id,
            clientCode: c.clientCode || c.gstin.substring(2, 6),
            clientName: c.clientName,
            gstin: c.gstin,
            financialYear,
            quarter,
            openingStock: 0,
            prevQuarterClosingStock: null,
            totalPurchases: 0,
            rcmTaxableValue: 0,
            rcmTaxPayable: 0,
            gpMargin: 10.0,
            salesMode: 'ACTUAL' as const,
            actualSales: 0,
            taxRateOnSales: 1.0,
            taxPayableOnSales: comp.taxPayableOnSales,
            totalCmp08Tax: comp.totalCmp08Tax,
            closingStock: comp.closingStock,
            status: 'DRAFT',
            inwardInvoiceCount: 0,
            isDirty: false,
          };
        });

        const allRows = [...guestRows.map(r => ({ ...r, isDirty: false })), ...newRows];
        newRows.forEach(row => saveGuestLedgerRow(row));
        setRows(allRows);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/composition/ledger?fy=${financialYear}&quarter=${quarter}`);
        if (!res.ok) throw new Error('Failed to fetch ledger');
        const data = await res.json();
        
        let initialRows: LedgerRowData[] = (data.records || []).map((r: any) => ({
          ...r,
          isDirty: false
        }));

        setRows(initialRows);
      } catch (err) {
        console.error('Error loading ledger:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLedger();
  }, [financialYear, quarter, isGuestMode]);

  // Recalculate row on input changes
  const handleFieldChange = (
    id: string, 
    field: keyof LedgerRowData, 
    value: any
  ) => {
    setRows(prevRows => 
      prevRows.map(row => {
        if (row.id !== id) return row;

        const updated = { ...row, [field]: value, isDirty: true };

        // Recalculate using statutory composition engine
        const computed = computeCompositionQuarter({
          openingStock: Number(updated.openingStock) || 0,
          totalPurchases: Number(updated.totalPurchases) || 0,
          rcmTaxableValue: Number(updated.rcmTaxableValue) || 0,
          rcmTaxPayable: Number(updated.rcmTaxPayable) || 0,
          gpMarginPercent: Number(updated.gpMargin) || 10.0,
          salesMode: updated.salesMode,
          actualSales: Number(updated.actualSales) || 0,
          targetClosingStock: Number(updated.targetClosingStock) || 0,
          taxRatePercent: Number(updated.taxRateOnSales) || 1.0,
        });

        updated.actualSales = computed.sales;
        updated.taxPayableOnSales = computed.taxPayableOnSales;
        updated.totalCmp08Tax = computed.totalCmp08Tax;
        updated.closingStock = computed.closingStock;

        // Auto-save in guest mode
        if (isGuestMode) {
          saveGuestLedgerRow(updated);
        }

        return updated;
      })
    );
  };

  // Save row
  const handleSaveRow = async (row: LedgerRowData) => {
    setSavingId(row.id);

    if (isGuestMode) {
      saveGuestLedgerRow(row);
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, isDirty: false } : r));
      setSaveSuccessId(row.id);
      setTimeout(() => setSaveSuccessId(null), 2000);
      setSavingId(null);
      if (onRefreshNeeded) onRefreshNeeded();
      return;
    }

    try {
      const res = await fetch('/api/composition/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: row.clientId,
          clientCode: row.clientCode,
          clientName: row.clientName,
          gstin: row.gstin,
          financialYear: row.financialYear,
          quarter: row.quarter,
          openingStock: row.openingStock,
          totalPurchases: row.totalPurchases,
          rcmTaxableValue: row.rcmTaxableValue,
          rcmTaxPayable: row.rcmTaxPayable,
          gpMargin: row.gpMargin,
          salesMode: row.salesMode,
          actualSales: row.actualSales,
          targetClosingStock: row.targetClosingStock,
          taxRateOnSales: row.taxRateOnSales,
          notes: row.notes,
        }),
      });

      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();

      setRows(prev =>
        prev.map(r => r.id === row.id ? { ...r, id: data.ledger.id, isDirty: false } : r)
      );

      setSaveSuccessId(row.id);
      setTimeout(() => setSaveSuccessId(null), 2000);

      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  // Delete row (Guest mode)
  const handleDeleteRow = (id: string, clientId: string) => {
    if (confirm('Remove this client from the composition ledger?')) {
      if (isGuestMode) {
        deleteGuestClient(clientId);
      }
      setRows(prev => prev.filter(r => r.id !== id));
      if (onRefreshNeeded) onRefreshNeeded();
    }
  };

  // Filter rows
  const filteredRows = rows.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.clientName.toLowerCase().includes(term) ||
      r.clientCode.toLowerCase().includes(term) ||
      r.gstin.toLowerCase().includes(term)
    );
  });

  // Calculate totals
  const totalOpeningStock = filteredRows.reduce((sum, r) => sum + (Number(r.openingStock) || 0), 0);
  const totalPurchases = filteredRows.reduce((sum, r) => sum + (Number(r.totalPurchases) || 0), 0);
  const totalRcmTaxable = filteredRows.reduce((sum, r) => sum + (Number(r.rcmTaxableValue) || 0), 0);
  const totalRcmTax = filteredRows.reduce((sum, r) => sum + (Number(r.rcmTaxPayable) || 0), 0);
  const totalSales = filteredRows.reduce((sum, r) => sum + (Number(r.actualSales) || 0), 0);
  const totalSalesTax = filteredRows.reduce((sum, r) => sum + (Number(r.taxPayableOnSales) || 0), 0);
  const totalCmp08Tax = filteredRows.reduce((sum, r) => sum + (Number(r.totalCmp08Tax) || 0), 0);
  const totalClosingStock = filteredRows.reduce((sum, r) => sum + (Number(r.closingStock) || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200 text-xs">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Client</th>
              <th className="py-2.5 px-3">GSTIN</th>
              <th className="py-2.5 px-3 text-right">Opening Stock (₹)</th>
              <th className="py-2.5 px-3 text-right">Purchases (₹)</th>
              <th className="py-2.5 px-3 text-right">RCM Taxable (₹)</th>
              <th className="py-2.5 px-3 text-right">GST in RCM (₹)</th>
              <th className="py-2.5 px-3 text-right">GP %</th>
              <th className="py-2.5 px-3 text-center">Mode</th>
              <th className="py-2.5 px-3 text-right">Turnover (₹)</th>
              <th className="py-2.5 px-3 text-right">Tax on Sales (₹)</th>
              <th className="py-2.5 px-3 text-right">Total CMP-08 Tax (₹)</th>
              <th className="py-2.5 px-3 text-right font-bold text-gray-900">Closing Stock (₹)</th>
              <th className="py-2.5 px-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={14} className="py-12 text-center text-gray-500">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <span className="text-xs">Loading Composition Ledger...</span>
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-12 text-center text-gray-500">
                  <Calculator className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-700">No client records in this quarter</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Click &quot;+ Add Client&quot; above to create a client entry.
                  </p>
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr 
                  key={row.id} 
                  className={`hover:bg-gray-50/60 transition-colors ${row.isDirty ? 'bg-amber-50/30' : ''}`}
                >
                  <td className="py-2.5 px-3 text-gray-400 font-mono text-[11px]">{idx + 1}</td>
                  
                  {/* Client Code & Name */}
                  <td className="py-2.5 px-3 font-medium">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-gray-900">{row.clientCode}</span>
                      <span className="text-gray-400">&bull;</span>
                      <span className="text-gray-700 truncate max-w-[140px]" title={row.clientName}>
                        {row.clientName}
                      </span>
                    </div>
                  </td>

                  {/* GSTIN */}
                  <td className="py-2.5 px-3 font-mono text-gray-600 text-[11px]">
                    {row.gstin}
                  </td>

                  {/* Opening Stock */}
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={row.openingStock || ''}
                      onChange={(e) => handleFieldChange(row.id, 'openingStock', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-24 px-2 py-1 text-right font-mono border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                    />
                  </td>

                  {/* Purchases (incl Tax, excl RCM) */}
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={row.totalPurchases || ''}
                      onChange={(e) => handleFieldChange(row.id, 'totalPurchases', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-24 px-2 py-1 text-right font-mono border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                    />
                  </td>

                  {/* RCM Taxable */}
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={row.rcmTaxableValue || ''}
                      onChange={(e) => handleFieldChange(row.id, 'rcmTaxableValue', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-20 px-2 py-1 text-right font-mono border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                    />
                  </td>

                  {/* GST in RCM */}
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={row.rcmTaxPayable || ''}
                      onChange={(e) => handleFieldChange(row.id, 'rcmTaxPayable', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-20 px-2 py-1 text-right font-mono border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                    />
                  </td>

                  {/* GP Margin % */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={row.gpMargin || ''}
                        onChange={(e) => handleFieldChange(row.id, 'gpMargin', parseFloat(e.target.value) || 0)}
                        className="w-14 px-1.5 py-1 text-right font-mono border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                      />
                      <span className="text-gray-400 text-[11px]">%</span>
                    </div>
                  </td>

                  {/* Sales Mode */}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => handleFieldChange(row.id, 'salesMode', row.salesMode === 'ACTUAL' ? 'DERIVED' : 'ACTUAL')}
                      className="text-[11px] font-medium text-gray-700 hover:text-emerald-700 px-1.5 py-0.5 rounded border border-gray-200 hover:border-emerald-300"
                    >
                      {row.salesMode === 'ACTUAL' ? 'Actual' : 'Derived'}
                    </button>
                  </td>

                  {/* Sales Turnover */}
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={row.actualSales || ''}
                      onChange={(e) => handleFieldChange(row.id, 'actualSales', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-24 px-2 py-1 text-right font-mono font-medium text-gray-900 border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                    />
                  </td>

                  {/* Tax on Sales (1%) */}
                  <td className="py-2.5 px-3 text-right font-mono text-gray-800">
                    {formatCurrency(row.taxPayableOnSales)}
                  </td>

                  {/* Total CMP-08 Tax */}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                    {formatCurrency(row.totalCmp08Tax)}
                  </td>

                  {/* Closing Stock */}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                    {formatCurrency(row.closingStock)}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {/* Save Row Button */}
                      <button
                        onClick={() => handleSaveRow(row)}
                        disabled={savingId === row.id}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          row.isDirty
                            ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        }`}
                        title="Save Row"
                      >
                        {savingId === row.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : saveSuccessId === row.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Invoices View */}
                      <button
                        onClick={() => setActiveInwardRecord(row)}
                        className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                        title="View Invoices"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      {/* CMP-08 Filing Draft */}
                      <button
                        onClick={() => setActiveCmp08Record(row)}
                        className="p-1.5 rounded-lg border border-gray-200 bg-white text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="CMP-08 Summary"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Client Row */}
                      <button
                        onClick={() => handleDeleteRow(row.id, row.clientId)}
                        className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove Client"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Table Footer Totals */}
          {filteredRows.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-300 font-bold text-gray-900">
                <td className="py-2.5 px-3" colSpan={3}>
                  Total ({filteredRows.length} Clients)
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {formatCurrency(totalOpeningStock)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {formatCurrency(totalPurchases)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {formatCurrency(totalRcmTaxable)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-amber-700">
                  {formatCurrency(totalRcmTax)}
                </td>
                <td className="py-2.5 px-3 text-center" colSpan={2}>
                  —
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {formatCurrency(totalSales)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {formatCurrency(totalSalesTax)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                  {formatCurrency(totalCmp08Tax)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-gray-900">
                  {formatCurrency(totalClosingStock)}
                </td>
                <td className="py-2.5 px-3"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Inward Invoices Modal */}
      {activeInwardRecord && (
        <CompositionInwardModal
          isOpen={!!activeInwardRecord}
          onClose={() => setActiveInwardRecord(null)}
          clientId={activeInwardRecord.clientId}
          clientCode={activeInwardRecord.clientCode}
          clientName={activeInwardRecord.clientName}
          gstin={activeInwardRecord.gstin}
          financialYear={financialYear}
          quarter={quarter}
        />
      )}

      {/* CMP-08 Filing Modal */}
      {activeCmp08Record && (
        <Cmp08FilingModal
          isOpen={!!activeCmp08Record}
          onClose={() => setActiveCmp08Record(null)}
          record={activeCmp08Record}
          onLaunchCompanion={onLaunchCompanion}
        />
      )}
    </div>
  );
}
