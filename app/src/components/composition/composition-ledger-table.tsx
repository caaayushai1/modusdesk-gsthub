'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Save, 
  RotateCcw, 
  Zap, 
  FileText, 
  FileCheck2, 
  ArrowRight, 
  Download, 
  Check, 
  AlertCircle,
  HelpCircle,
  Layers,
  ChevronDown,
  Calculator,
  PlusCircle,
  CheckCircle2
} from 'lucide-react';
import { computeCompositionQuarter } from '@/lib/composition-calculator';
import { CompositionInwardModal } from './composition-inward-modal';
import { Cmp08FilingModal } from './cmp08-filing-modal';

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
  onRefreshNeeded?: () => void;
  onLaunchCompanion?: (gstin: string) => void;
  searchTerm?: string;
}

export function CompositionLedgerTable({
  financialYear,
  quarter,
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
      try {
        const res = await fetch(`/api/composition/ledger?fy=${financialYear}&quarter=${quarter}`);
        if (!res.ok) throw new Error('Failed to fetch ledger');
        const data = await res.json();
        
        // Also fetch practice clients if ledger is currently empty
        let initialRows: LedgerRowData[] = (data.records || []).map((r: any) => ({
          ...r,
          isDirty: false
        }));

        if (initialRows.length === 0) {
          // Check if clients are available to auto-seed initial ledger rows
          try {
            const clientRes = await fetch('/api/clients');
            const clientData = await clientRes.json();
            if (clientData.clients && clientData.clients.length > 0) {
              initialRows = clientData.clients.map((c: any) => {
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
                  id: `temp_${c.id}`,
                  clientId: c.id,
                  clientCode: c.clientCode || c.code || '---',
                  clientName: c.clientName || c.name || 'Client',
                  gstin: c.gstin,
                  financialYear,
                  quarter,
                  openingStock: 0,
                  prevQuarterClosingStock: null,
                  totalPurchases: 0,
                  rcmTaxableValue: 0,
                  rcmTaxPayable: 0,
                  gpMargin: 10.0,
                  salesMode: 'ACTUAL',
                  actualSales: 0,
                  taxRateOnSales: 1.0,
                  taxPayableOnSales: comp.taxPayableOnSales,
                  totalCmp08Tax: comp.totalCmp08Tax,
                  closingStock: comp.closingStock,
                  status: 'DRAFT',
                  inwardInvoiceCount: 0,
                  isDirty: false
                };
              });
            }
          } catch (e) {
            console.warn('Could not auto-seed practice clients:', e);
          }
        }

        setRows(initialRows);
      } catch (err) {
        console.error('Error loading ledger:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLedger();
  }, [financialYear, quarter]);

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

        return updated;
      })
    );
  };

  // Carry forward previous quarter's closing stock to opening stock
  const handleApplyPrevClosingStock = (id: string, prevClosing: number) => {
    handleFieldChange(id, 'openingStock', prevClosing);
  };

  // Save row to backend
  const handleSaveRow = async (row: LedgerRowData) => {
    setSavingId(row.id);
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
      setTimeout(() => setSaveSuccessId(null), 2500);

      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSavingId(null);
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
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            {/* Super Header Grouping */}
            <tr className="bg-gray-100 text-gray-500 font-semibold border-b border-gray-200 text-[11px] uppercase tracking-wider">
              <th className="py-2 px-3 border-r border-gray-200" colSpan={3}>Client Profile</th>
              <th className="py-2 px-3 border-r border-gray-200 bg-blue-50/50 text-blue-900" colSpan={4}>Inward Supplies (GSTR-2A)</th>
              <th className="py-2 px-3 border-r border-gray-200 bg-amber-50/50 text-amber-900" colSpan={3}>Turnover &amp; Margins</th>
              <th className="py-2 px-3 border-r border-gray-200 bg-emerald-50/60 text-emerald-950 font-bold" colSpan={3}>CMP-08 Tax &amp; Stock Audit</th>
              <th className="py-2 px-3 text-center">Actions</th>
            </tr>
            {/* Specific Column Headers */}
            <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 text-xs">
              <th className="py-3 px-3">#</th>
              <th className="py-3 px-3">Client Code &amp; Name</th>
              <th className="py-3 px-3 border-r border-gray-200">GSTIN</th>
              
              {/* Inward Supplies Group */}
              <th className="py-3 px-3 bg-blue-50/30">
                <div className="flex items-center space-x-1">
                  <span>Opening Stock (₹)</span>
                  <span title="Previous quarter closing stock or manual opening">
                    <HelpCircle className="w-3 h-3 text-gray-400" />
                  </span>
                </div>
              </th>
              <th className="py-3 px-3 bg-blue-50/30">
                <div className="flex items-center space-x-1">
                  <span>Purchases (₹)</span>
                  <span title="Inclusive of Tax, excluding RCM purchases">
                    <HelpCircle className="w-3 h-3 text-gray-400" />
                  </span>
                </div>
              </th>
              <th className="py-3 px-3 bg-blue-50/30">RCM Taxable (₹)</th>
              <th className="py-3 px-3 border-r border-gray-200 bg-blue-50/30">GST in RCM (₹)</th>

              {/* Turnover Group */}
              <th className="py-3 px-3 bg-amber-50/30">GP %</th>
              <th className="py-3 px-3 bg-amber-50/30">Mode</th>
              <th className="py-3 px-3 border-r border-gray-200 bg-amber-50/30">Sales Turnover (₹)</th>

              {/* Statutory Tax & Stock Group */}
              <th className="py-3 px-3 bg-emerald-50/30 text-emerald-900">Tax on Sales (1%)</th>
              <th className="py-3 px-3 bg-emerald-50/30 text-emerald-900">Total CMP-08 Tax</th>
              <th className="py-3 px-3 border-r border-gray-200 bg-emerald-100/50 text-emerald-950 font-extrabold">
                Closing Stock (₹)
              </th>

              <th className="py-3 px-3 text-center">Controls</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={14} className="py-16 text-center text-gray-500">
                  <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <span className="text-xs">Loading Composition Ledger Matrix...</span>
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-16 text-center text-gray-500">
                  <Calculator className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">No Composition Ledger Entries Found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Click &quot;1-Click Import GSTR-2A&quot; or add clients to calculate quarterly stock &amp; tax.
                  </p>
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr 
                  key={row.id} 
                  className={`hover:bg-gray-50/75 transition-colors ${row.isDirty ? 'bg-amber-50/20' : ''}`}
                >
                  <td className="py-3 px-3 text-gray-400 font-mono text-[11px]">{idx + 1}</td>
                  
                  {/* Client Code & Name */}
                  <td className="py-3 px-3 font-medium">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-800 border border-gray-200">
                        {row.clientCode}
                      </span>
                      <span className="font-semibold text-gray-900 truncate max-w-[150px]" title={row.clientName}>
                        {row.clientName}
                      </span>
                    </div>
                  </td>

                  {/* GSTIN */}
                  <td className="py-3 px-3 font-mono text-gray-600 border-r border-gray-200">
                    <span className="text-[11px] bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                      {row.gstin}
                    </span>
                  </td>

                  {/* Opening Stock */}
                  <td className="py-3 px-3 bg-blue-50/15">
                    <div className="space-y-1">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={row.openingStock || ''}
                        onChange={(e) => handleFieldChange(row.id, 'openingStock', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24 px-2 py-1 text-right font-mono font-medium border border-gray-200 rounded-md focus:ring-1 focus:ring-emerald-500 bg-white shadow-2xs"
                      />
                      {row.prevQuarterClosingStock !== null && row.openingStock !== row.prevQuarterClosingStock && (
                        <button
                          onClick={() => handleApplyPrevClosingStock(row.id, row.prevQuarterClosingStock!)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center space-x-0.5 underline block"
                          title="Click to copy closing stock of previous quarter"
                        >
                          <span>Auto: {formatCurrency(row.prevQuarterClosingStock)}</span>
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Purchases (incl Tax, excl RCM) */}
                  <td className="py-3 px-3 bg-blue-50/15">
                    <div className="space-y-1">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={row.totalPurchases || ''}
                        onChange={(e) => handleFieldChange(row.id, 'totalPurchases', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24 px-2 py-1 text-right font-mono font-medium border border-gray-200 rounded-md focus:ring-1 focus:ring-emerald-500 bg-white shadow-2xs"
                      />
                      {row.inwardInvoiceCount !== undefined && row.inwardInvoiceCount > 0 && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 block text-center">
                          {row.inwardInvoiceCount} GSTR-2A inv
                        </span>
                      )}
                    </div>
                  </td>

                  {/* RCM Taxable */}
                  <td className="py-3 px-3 bg-blue-50/15">
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={row.rcmTaxableValue || ''}
                      onChange={(e) => handleFieldChange(row.id, 'rcmTaxableValue', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-20 px-2 py-1 text-right font-mono border border-gray-200 rounded-md focus:ring-1 focus:ring-emerald-500 bg-white shadow-2xs"
                    />
                  </td>

                  {/* GST in RCM */}
                  <td className="py-3 px-3 border-r border-gray-200 bg-blue-50/15">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={row.rcmTaxPayable || ''}
                      onChange={(e) => handleFieldChange(row.id, 'rcmTaxPayable', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-20 px-2 py-1 text-right font-mono font-bold text-amber-700 border border-gray-200 rounded-md focus:ring-1 focus:ring-emerald-500 bg-white shadow-2xs"
                    />
                  </td>

                  {/* GP Margin % */}
                  <td className="py-3 px-3 bg-amber-50/15">
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={row.gpMargin || ''}
                        onChange={(e) => handleFieldChange(row.id, 'gpMargin', parseFloat(e.target.value) || 0)}
                        className="w-14 px-1.5 py-1 text-right font-mono font-medium border border-gray-200 rounded-md focus:ring-1 focus:ring-emerald-500 bg-white shadow-2xs"
                      />
                      <span className="text-gray-500 text-[11px]">%</span>
                    </div>
                  </td>

                  {/* Sales Mode */}
                  <td className="py-3 px-3 bg-amber-50/15">
                    <button
                      onClick={() => handleFieldChange(row.id, 'salesMode', row.salesMode === 'ACTUAL' ? 'DERIVED' : 'ACTUAL')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-tight border transition-colors ${
                        row.salesMode === 'ACTUAL'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                      title={row.salesMode === 'ACTUAL' ? 'Mode A: Actual Client Sales' : 'Mode B: Derived from Desired Stock'}
                    >
                      {row.salesMode === 'ACTUAL' ? 'Actual' : 'Derived'}
                    </button>
                  </td>

                  {/* Sales Turnover */}
                  <td className="py-3 px-3 border-r border-gray-200 bg-amber-50/15">
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={row.actualSales || ''}
                      onChange={(e) => handleFieldChange(row.id, 'actualSales', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-24 px-2 py-1 text-right font-mono font-bold text-gray-900 border border-gray-200 rounded-md focus:ring-1 focus:ring-emerald-500 bg-white shadow-2xs"
                    />
                  </td>

                  {/* Tax on Sales (1%) */}
                  <td className="py-3 px-3 bg-emerald-50/20 font-mono text-right text-emerald-800 font-semibold">
                    {formatCurrency(row.taxPayableOnSales)}
                  </td>

                  {/* Total CMP-08 Tax */}
                  <td className="py-3 px-3 bg-emerald-50/20 font-mono text-right font-extrabold text-emerald-900">
                    {formatCurrency(row.totalCmp08Tax)}
                  </td>

                  {/* Audited Closing Stock */}
                  <td className="py-3 px-3 border-r border-gray-200 bg-emerald-100/30 text-right">
                    <span className="font-mono font-extrabold text-sm text-emerald-950 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 shadow-2xs inline-block">
                      {formatCurrency(row.closingStock)}
                    </span>
                  </td>

                  {/* Action Controls */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      {/* Save Row Button */}
                      <button
                        onClick={() => handleSaveRow(row)}
                        disabled={savingId === row.id}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          row.isDirty
                            ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-xs'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                        title="Save Row"
                      >
                        {savingId === row.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : saveSuccessId === row.id ? (
                          <Check className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Invoices View */}
                      <button
                        onClick={() => setActiveInwardRecord(row)}
                        className="p-1.5 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
                        title="View GSTR-2A Inward Invoices"
                      >
                        <FileText className="w-3.5 h-3.5 text-gray-700" />
                      </button>

                      {/* CMP-08 Return Draft */}
                      <button
                        onClick={() => setActiveCmp08Record(row)}
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        title="CMP-08 Return Statement & JSON"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                      </button>

                      {/* 1-Click Quick Login */}
                      {onLaunchCompanion && (
                        <button
                          onClick={() => onLaunchCompanion(row.gstin)}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                          title="1-Click Login to GST Portal"
                        >
                          <Zap className="w-3.5 h-3.5 fill-white" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Totals Summary Footer */}
          {filteredRows.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100/90 font-bold border-t-2 border-gray-300 text-xs">
                <td className="py-3 px-3 text-gray-700" colSpan={3}>
                  TOTALS ({filteredRows.length} Composite Clients)
                </td>
                <td className="py-3 px-3 text-right font-mono text-gray-900 bg-blue-50/40">
                  {formatCurrency(totalOpeningStock)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-gray-900 bg-blue-50/40">
                  {formatCurrency(totalPurchases)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-gray-900 bg-blue-50/40">
                  {formatCurrency(totalRcmTaxable)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-amber-800 bg-blue-50/40 border-r border-gray-200">
                  {formatCurrency(totalRcmTax)}
                </td>
                <td className="py-3 px-3 text-center bg-amber-50/40" colSpan={2}>
                  <span className="text-[11px] text-gray-500 uppercase tracking-tight">Turnover Total</span>
                </td>
                <td className="py-3 px-3 text-right font-mono text-gray-900 bg-amber-50/40 border-r border-gray-200 font-extrabold">
                  {formatCurrency(totalSales)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-800 bg-emerald-50/40">
                  {formatCurrency(totalSalesTax)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-950 bg-emerald-50/40 text-sm font-extrabold">
                  {formatCurrency(totalCmp08Tax)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-950 bg-emerald-100/60 border-r border-gray-200 text-sm font-extrabold">
                  {formatCurrency(totalClosingStock)}
                </td>
                <td className="py-3 px-3 text-center text-gray-400">
                  &bull;
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Inward Invoices Modal */}
      {activeInwardRecord && (
        <CompositionInwardModal
          isOpen={true}
          onClose={() => setActiveInwardRecord(null)}
          clientId={activeInwardRecord.clientId}
          clientCode={activeInwardRecord.clientCode}
          clientName={activeInwardRecord.clientName}
          gstin={activeInwardRecord.gstin}
          financialYear={financialYear}
          quarter={quarter}
        />
      )}

      {/* CMP-08 Return Draft Modal */}
      {activeCmp08Record && (
        <Cmp08FilingModal
          isOpen={true}
          onClose={() => setActiveCmp08Record(null)}
          record={activeCmp08Record}
          onLaunchCompanion={onLaunchCompanion}
        />
      )}
    </div>
  );
}
