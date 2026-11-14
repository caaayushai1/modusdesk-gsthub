'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Download,
  Filter,
  DollarSign,
  TrendingUp,
  Tag
} from 'lucide-react';

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
        const queryParams = new URLSearchParams({
          clientId,
          fy: financialYear,
          quarter,
          type: filterType
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
  const rcmCount = filteredInvoices.filter(inv => inv.isRcm).length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700 border border-emerald-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {clientCode}
                </span>
                <h2 className="text-lg font-bold text-gray-900">{clientName}</h2>
                <span className="text-xs text-gray-500 font-mono">({gstin})</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                GSTR-2A Inward Invoices &bull; <strong className="text-gray-700">{quarter} ({financialYear})</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metric Strip */}
        <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-gray-50/50 border-b border-gray-100">
          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-xs">
            <span className="text-xs text-gray-500 font-medium">Invoices Found</span>
            <div className="text-base font-bold text-gray-900 mt-0.5">{filteredInvoices.length}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-xs">
            <span className="text-xs text-gray-500 font-medium">Total Taxable Value</span>
            <div className="text-base font-bold text-gray-900 mt-0.5">{formatCurrency(totalTaxable)}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-xs">
            <span className="text-xs text-gray-500 font-medium">Total Tax Paid</span>
            <div className="text-base font-bold text-emerald-700 mt-0.5">{formatCurrency(totalTax)}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-xs">
            <span className="text-xs text-gray-500 font-medium">Total Invoice Value (Cost)</span>
            <div className="text-base font-bold text-gray-900 mt-0.5">{formatCurrency(totalValue)}</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-6 py-3 flex items-center justify-between gap-4 border-b border-gray-100">
          <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'ALL'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setFilterType('REGULAR')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'REGULAR'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Regular Purchases
            </button>
            <button
              onClick={() => setFilterType('RCM')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'RCM'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Reverse Charge (RCM)
            </button>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoice, GSTIN, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
        </div>

        {/* Invoice List Table */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs">Loading inward invoices...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-14 text-gray-500">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No inward invoices found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No GSTR-2A invoices found for this quarter. Use the &quot;1-Click Import GSTR-2A&quot; button to fetch or upload purchase data.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/75">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Supplier GSTIN & Name</th>
                  <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                  <th className="py-2.5 px-3 text-right">CGST (₹)</th>
                  <th className="py-2.5 px-3 text-right">SGST (₹)</th>
                  <th className="py-2.5 px-3 text-right">IGST (₹)</th>
                  <th className="py-2.5 px-3 text-right font-bold text-gray-900">Total Invoice (₹)</th>
                  <th className="py-2.5 px-3 text-center">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td className="py-2.5 px-3 text-gray-600">{inv.invoiceDate}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-mono text-gray-800">{inv.supplierGstin}</div>
                      {inv.supplierName && (
                        <div className="text-[11px] text-gray-500 truncate max-w-[200px]">{inv.supplierName}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-700">{formatCurrency(inv.taxableValue)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-600">{formatCurrency(inv.cgst)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-600">{formatCurrency(inv.sgst)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-600">{formatCurrency(inv.igst)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">{formatCurrency(inv.invoiceValue)}</td>
                    <td className="py-2.5 px-3 text-center">
                      {inv.isRcm ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                          RCM Sec 9(3)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Regular B2B
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
          <div className="text-gray-500">
            Purchases include GST as cost. RCM purchases are segregated for CMP-08 cash liability.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
