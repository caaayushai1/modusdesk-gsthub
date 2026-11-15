'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  FileText
} from 'lucide-react';
import { getGuestInvoices } from '@/lib/composition-guest-storage';

interface InwardInvoice {
  id: string;
  supplierGstin: string;
  supplierName: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalTax: number;
  isRcm: boolean;
  rate: number;
}

interface CompositionInwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientCode: string;
  clientName: string;
  gstin: string;
  financialYear: string;
  quarter: string;
}

export function CompositionInwardModal({
  isOpen,
  onClose,
  clientId,
  clientCode,
  clientName,
  gstin,
  financialYear,
  quarter
}: CompositionInwardModalProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'REGULAR' | 'RCM'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState<InwardInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !clientId) return;

    async function fetchInvoices() {
      setLoading(true);
      setError(null);
      try {
        // First check guest storage
        const guestInvoices = getGuestInvoices(clientId, financialYear, quarter);
        if (guestInvoices.length > 0) {
          let list = guestInvoices;
          if (filterType === 'RCM') list = list.filter(i => i.isRcm);
          if (filterType === 'REGULAR') list = list.filter(i => !i.isRcm);
          setInvoices(list.map(i => ({
            id: i.id,
            supplierGstin: i.supplierGstin,
            supplierName: i.supplierName || null,
            invoiceNumber: i.invoiceNumber,
            invoiceDate: i.invoiceDate,
            invoiceValue: i.invoiceValue,
            taxableValue: i.taxableValue,
            igst: i.igst,
            cgst: i.cgst,
            sgst: i.sgst,
            totalTax: i.totalTax,
            isRcm: i.isRcm,
            rate: i.rate,
          })));
          setLoading(false);
          return;
        }

        // Otherwise fetch from server
        const queryParams = new URLSearchParams({
          clientId,
          fy: financialYear,
          quarter,
          filter: filterType
        });
        const res = await fetch(`/api/composition/invoices?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Failed to load inward invoices');
        const data = await res.json();
        setInvoices(data.invoices || []);
      } catch (err: any) {
        setError(err.message || 'Error loading invoices');
      } finally {
        setLoading(false);
      }
    }

    fetchInvoices();
  }, [isOpen, clientId, financialYear, quarter, filterType]);

  if (!isOpen) return null;

  const filteredInvoices = invoices.filter(inv => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(term) ||
      inv.supplierGstin.toLowerCase().includes(term) ||
      (inv.supplierName && inv.supplierName.toLowerCase().includes(term))
    );
  });

  const totalTaxable = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.taxableValue) || 0), 0);
  const totalTax = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.totalTax) || ((Number(inv.cgst) || 0) + (Number(inv.sgst) || 0) + (Number(inv.igst) || 0))), 0);
  const totalValue = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.invoiceValue) || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-900">{clientCode}</span>
              <span className="text-gray-400">&bull;</span>
              <h2 className="text-sm font-bold text-gray-900">{clientName}</h2>
              <span className="text-xs text-gray-500 font-mono">({gstin})</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              GSTR-2A Inward Invoices &bull; {quarter} ({financialYear})
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metric Summary */}
        <div className="grid grid-cols-4 gap-3 px-6 py-3 bg-white border-b border-gray-100 text-xs">
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <span className="text-gray-500 block">Invoices Found</span>
            <strong className="text-gray-900 text-sm mt-0.5 block">{filteredInvoices.length}</strong>
          </div>
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <span className="text-gray-500 block">Total Taxable Value</span>
            <strong className="text-gray-900 text-sm mt-0.5 block font-mono">{formatCurrency(totalTaxable)}</strong>
          </div>
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <span className="text-gray-500 block">Total Tax Paid</span>
            <strong className="text-emerald-800 text-sm mt-0.5 block font-mono">{formatCurrency(totalTax)}</strong>
          </div>
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <span className="text-gray-500 block">Total Invoice Value (Cost)</span>
            <strong className="text-gray-900 text-sm mt-0.5 block font-mono">{formatCurrency(totalValue)}</strong>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-6 py-2.5 flex items-center justify-between gap-4 border-b border-gray-100 bg-white">
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'ALL'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setFilterType('REGULAR')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'REGULAR'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Regular Purchases
            </button>
            <button
              onClick={() => setFilterType('RCM')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'RCM'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              RCM Purchases
            </button>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoice or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              Loading invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-700">No Inward Invoices Found</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Use &quot;Import GSTR-2A&quot; to load invoices.</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Supplier GSTIN</th>
                    <th className="py-2.5 px-3">Supplier Name</th>
                    <th className="py-2.5 px-3">Invoice No</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                    <th className="py-2.5 px-3 text-right">Tax (₹)</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Total (₹)</th>
                    <th className="py-2.5 px-3 text-center">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvoices.map((inv, idx) => (
                    <tr key={inv.id || idx} className="hover:bg-gray-50/60">
                      <td className="py-2 px-3 text-gray-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-gray-800">{inv.supplierGstin}</td>
                      <td className="py-2 px-3 text-gray-700 truncate max-w-[180px]">{inv.supplierName || '—'}</td>
                      <td className="py-2 px-3 font-mono text-gray-800">{inv.invoiceNumber}</td>
                      <td className="py-2 px-3 text-gray-600 font-mono text-[11px]">{inv.invoiceDate}</td>
                      <td className="py-2 px-3 text-right font-mono text-gray-800">{formatCurrency(inv.taxableValue)}</td>
                      <td className="py-2 px-3 text-right font-mono text-gray-800">{formatCurrency(inv.totalTax)}</td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-gray-900">{formatCurrency(inv.invoiceValue)}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          inv.isRcm ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {inv.isRcm ? 'RCM' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
