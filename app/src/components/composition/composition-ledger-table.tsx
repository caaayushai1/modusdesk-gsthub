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
import { AnnualGstr4Modal } from './annual-gstr4-modal';
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
  const [activeAnnualRecord, setActiveAnnualRecord] = useState<LedgerRowData | null>(null);

  // Fetch rows
  useEffect(() => {
    async function fetchLedger() {
      setLoading(true);

      // Handle ANNUAL Full-Year Consolidated Mode (Point e)
      if (quarter === 'ANNUAL') {
        const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
        const qRows = quarters.flatMap(q => getGuestLedger(financialYear, q));
        const guestClients = getGuestClients();

        const clientMap = new Map<string, LedgerRowData>();

        // Seed with all added clients
        guestClients.forEach(c => {
          clientMap.set(c.id, {
            id: `annual_row_${c.id}_${financialYear}`,
            clientId: c.id,
            clientCode: c.clientCode || (c.gstin ? c.gstin.substring(2, 6) : c.clientName.substring(0, 4).toUpperCase()),
            clientName: c.clientName,
            gstin: c.gstin || '',
            financialYear,
            quarter: 'ANNUAL',
            openingStock: 0,
            prevQuarterClosingStock: null,
            totalPurchases: 0,
            rcmTaxableValue: 0,
            rcmTaxPayable: 0,
            gpMargin: 10.0,
            salesMode: 'ACTUAL',
            actualSales: 0,
            taxRateOnSales: 1.0,
            taxPayableOnSales: 0,
            totalCmp08Tax: 0,
            closingStock: 0,
            status: 'ANNUAL_CONSOLIDATED',
            inwardInvoiceCount: 0,
            isDirty: false,
          });
        });

        // Consolidate across Q1..Q4
        qRows.forEach(row => {
          let s = clientMap.get(row.clientId);
          if (!s) {
            s = {
              id: `annual_row_${row.clientId}_${financialYear}`,
              clientId: row.clientId,
              clientCode: row.clientCode,
              clientName: row.clientName,
              gstin: row.gstin,
              financialYear,
              quarter: 'ANNUAL',
              openingStock: 0,
              prevQuarterClosingStock: null,
              totalPurchases: 0,
              rcmTaxableValue: 0,
              rcmTaxPayable: 0,
              gpMargin: row.gpMargin || 10,
              salesMode: 'ACTUAL',
              actualSales: 0,
              taxRateOnSales: 1.0,
              taxPayableOnSales: 0,
              totalCmp08Tax: 0,
              closingStock: 0,
              status: 'ANNUAL_CONSOLIDATED',
              inwardInvoiceCount: 0,
              isDirty: false,
            };
            clientMap.set(row.clientId, s);
          }

          if (row.quarter === 'Q1') {
            s.openingStock = Number(row.openingStock) || 0;
          }
          s.totalPurchases += Number(row.totalPurchases) || 0;
          s.rcmTaxableValue += Number(row.rcmTaxableValue) || 0;
          s.rcmTaxPayable += Number(row.rcmTaxPayable) || 0;
          s.actualSales += Number(row.actualSales) || 0;
          s.taxPayableOnSales += Number(row.taxPayableOnSales) || 0;
          s.totalCmp08Tax += Number(row.totalCmp08Tax) || 0;
          s.inwardInvoiceCount = (s.inwardInvoiceCount || 0) + (row.inwardInvoiceCount || 0);

          if (row.quarter === 'Q4' || s.closingStock === 0) {
            s.closingStock = Number(row.closingStock) || s.closingStock;
          }
        });

        // Calculate statutory closing stock if needed
        clientMap.forEach(s => {
          if (!s.closingStock) {
            const comp = computeCompositionQuarter({
              openingStock: s.openingStock,
              totalPurchases: s.totalPurchases,
              rcmTaxableValue: s.rcmTaxableValue,
              rcmTaxPayable: s.rcmTaxPayable,
              gpMarginPercent: s.gpMargin,
              salesMode: 'ACTUAL',
              actualSales: s.actualSales,
            });
            s.closingStock = comp.closingStock;
          }
        });

        setRows(Array.from(clientMap.values()));
        setLoading(false);
        return;
      }

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
        let initialRows: LedgerRowData[] = [];
        const res = await fetch(`/api/composition/ledger?fy=${financialYear}&quarter=${quarter}`);
        if (res.ok) {
          const data = await res.json();
          initialRows = (data.records || []).map((r: any) => ({
            ...r,
            isDirty: false
          }));
        }

        // Seamlessly merge with local cached rows so any added client is always rendered immediately
        const cachedLedger = getGuestLedger(financialYear, quarter);
        const existingIds = new Set(initialRows.map(r => r.clientId));
        cachedLedger.forEach(cachedRow => {
          if (!existingIds.has(cachedRow.clientId)) {
            initialRows.push({ ...cachedRow, isDirty: false });
            existingIds.add(cachedRow.clientId);
          }
        });

        // Also ensure any client added to guest/local storage is present even if newly added or across quarters
        const guestClients = getGuestClients();
        guestClients.forEach(c => {
          if (!existingIds.has(c.id)) {
            const comp = computeCompositionQuarter({
              openingStock: 0,
              totalPurchases: 0,
              rcmTaxableValue: 0,
              rcmTaxPayable: 0,
              gpMarginPercent: 10.0,
              salesMode: 'ACTUAL',
              actualSales: 0,
            });
            const newRow: LedgerRowData = {
              id: `guest_row_${c.id}_${financialYear}_${quarter}`,
              clientId: c.id,
              clientCode: c.clientCode || (c.gstin ? c.gstin.substring(2, 6) : c.clientName.substring(0, 4).toUpperCase()),
              clientName: c.clientName,
              gstin: c.gstin || '',
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
            saveGuestLedgerRow(newRow);
            initialRows.push(newRow);
            existingIds.add(c.id);
          }
        });

        setRows(initialRows);
      } catch (err) {
        console.error('Error loading ledger, falling back to local cache:', err);
        const cachedLedger = getGuestLedger(financialYear, quarter);
        setRows(cachedLedger.map(r => ({ ...r, isDirty: false })));
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

        // Auto-save to browser local cache (zero database alteration)
        saveGuestLedgerRow(updated);

        return updated;
      })
    );
  };

  // Save row strictly to browser local cache
  const handleSaveRow = async (row: LedgerRowData) => {
    setSavingId(row.id);
    saveGuestLedgerRow(row);
    setRows(prev => prev.map(r => r.id === row.id ? { ...r, isDirty: false } : r));
    setSaveSuccessId(row.id);
    setTimeout(() => setSaveSuccessId(null), 2000);
    setSavingId(null);
    if (onRefreshNeeded) onRefreshNeeded();
  };

  // Delete row from local cache
  const handleDeleteRow = (id: string, clientId: string) => {
    if (confirm('Remove this client from the composition ledger?')) {
      deleteGuestClient(clientId);
      setRows(prev => prev.filter(r => r.id !== id));
      if (onRefreshNeeded) onRefreshNeeded();
    }
  };

  // Filter rows
  const filteredRows = rows.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (r.clientName && r.clientName.toLowerCase().includes(term)) ||
      (r.clientCode && r.clientCode.toLowerCase().includes(term)) ||
      (r.gstin && r.gstin.toLowerCase().includes(term))
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
              <th className="py-2.5 px-3">Client</th>
              <th className="py-2.5 px-3">GSTIN</th>
              <th className="py-2.5 px-3 text-right">Opening Stock (₹)</th>
              <th className="py-2.5 px-3 text-right">Purchases (₹)</th>
              <th className="py-2.5 px-3 text-right">RCM Taxable (₹)</th>
              <th className="py-2.5 px-3 text-right">GST in RCM (₹)</th>
              <th className="py-2.5 px-3 text-right">GP %</th>
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
                <td colSpan={12} className="py-12 text-center text-gray-500">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <span className="text-xs">Loading Composition Ledger...</span>
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-gray-500">
                  <Calculator className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-700">No client records in this quarter</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Click &quot;+ Add Client&quot; above to create a client entry.
                  </p>
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr 
                  key={row.id} 
                  className={`hover:bg-gray-50/60 transition-colors ${row.isDirty ? 'bg-amber-50/30' : ''}`}
                >
                  {/* Client Name */}
                  <td className="py-2.5 px-3 font-semibold text-gray-900 truncate max-w-[160px]" title={row.clientName}>
                    {row.clientName}
                  </td>

                  {/* GSTIN */}
                  <td className="py-2.5 px-3 font-mono text-gray-600 text-[11px]">
                    {row.gstin || '—'}
                  </td>

                  {/* Opening Stock */}
                  <td className="py-2.5 px-3 text-right">
                    {quarter === 'ANNUAL' ? (
                      <span className="font-mono text-gray-800">{formatCurrency(row.openingStock)}</span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={row.openingStock || ''}
                        onChange={(e) => handleFieldChange(row.id, 'openingStock', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24 px-2 py-1 text-right font-mono border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                      />
                    )}
                  </td>

                  {/* Purchases (incl Tax, excl RCM) */}
                  <td className="py-2.5 px-3 text-right">
                    {quarter === 'ANNUAL' ? (
                      <span className="font-mono text-gray-800">{formatCurrency(row.totalPurchases)}</span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={row.totalPurchases || ''}
                        onChange={(e) => handleFieldChange(row.id, 'totalPurchases', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24 px-2 py-1 text-right font-mono border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                      />
                    )}
                  </td>

                  {/* RCM Taxable */}
                  <td className="py-2.5 px-3 text-right">
                    {quarter === 'ANNUAL' ? (
                      <span className="font-mono text-gray-800">{formatCurrency(row.rcmTaxableValue)}</span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={row.rcmTaxableValue || ''}
                        onChange={(e) => handleFieldChange(row.id, 'rcmTaxableValue', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-20 px-2 py-1 text-right font-mono border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                      />
                    )}
                  </td>

                  {/* GST in RCM */}
                  <td className="py-2.5 px-3 text-right">
                    {quarter === 'ANNUAL' ? (
                      <span className="font-mono text-gray-800">{formatCurrency(row.rcmTaxPayable)}</span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={row.rcmTaxPayable || ''}
                        onChange={(e) => handleFieldChange(row.id, 'rcmTaxPayable', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-20 px-2 py-1 text-right font-mono border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                      />
                    )}
                  </td>

                  {/* GP Margin % */}
                  <td className="py-2.5 px-3 text-right">
                    {quarter === 'ANNUAL' ? (
                      <span className="font-mono text-gray-700">{row.gpMargin}%</span>
                    ) : (
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
                    )}
                  </td>

                  {/* Sales Turnover (Manual Input in Quarterly, Aggregate in Annual) */}
                  <td className="py-2.5 px-3 text-right">
                    {quarter === 'ANNUAL' ? (
                      <span className="font-mono font-bold text-gray-900">{formatCurrency(row.actualSales)}</span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={row.actualSales || ''}
                        onChange={(e) => handleFieldChange(row.id, 'actualSales', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24 px-2 py-1 text-right font-mono font-medium text-gray-900 border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                      />
                    )}
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
                      {quarter !== 'ANNUAL' && (
                        /* Save Row Button */
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
                      )}

                      {/* Invoices View */}
                      <button
                        onClick={() => setActiveInwardRecord(row)}
                        className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                        title="View Invoices"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      {/* In Annual: GSTR-4 Summary | In Quarterly: CMP-08 Summary (Point e) */}
                      <button
                        onClick={() => {
                          if (quarter === 'ANNUAL') {
                            setActiveAnnualRecord(row);
                          } else {
                            setActiveCmp08Record(row);
                          }
                        }}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          quarter === 'ANNUAL'
                            ? 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
                            : 'border-gray-200 bg-white text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={quarter === 'ANNUAL' ? 'GSTR-4 Summary' : 'CMP-08 Summary'}
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
                <td className="py-2.5 px-3" colSpan={2}>
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
                <td className="py-2.5 px-3 text-center">
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

      {/* Annual GSTR-4 Summary Modal (Point e) */}
      {activeAnnualRecord && (
        <AnnualGstr4Modal
          isOpen={!!activeAnnualRecord}
          onClose={() => setActiveAnnualRecord(null)}
          clientId={activeAnnualRecord.clientId}
          clientName={activeAnnualRecord.clientName}
          clientCode={activeAnnualRecord.clientCode}
          gstin={activeAnnualRecord.gstin}
          financialYear={financialYear}
        />
      )}
    </div>
  );
}
