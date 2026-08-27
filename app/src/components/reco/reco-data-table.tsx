'use client';

import React, { useState, useMemo } from 'react';
import type { RecoLineItem, RecoBucket } from '@/lib/reco-types';
import { X } from 'lucide-react';

interface RecoDataTableProps {
  items: RecoLineItem[];
  onOpenVendorNotice: (item: RecoLineItem) => void;
}

export function RecoDataTable({ items, onOpenVendorNotice }: RecoDataTableProps) {
  // In-column filter states
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterGstin, setFilterGstin] = useState('');
  const [filterBucket, setFilterBucket] = useState('ALL');
  const [filterInvoice, setFilterInvoice] = useState('');

  const hasActiveFilters =
    Boolean(filterSupplier) ||
    Boolean(filterGstin) ||
    Boolean(filterInvoice) ||
    filterBucket !== 'ALL';

  const resetFilters = () => {
    setFilterSupplier('');
    setFilterGstin('');
    setFilterInvoice('');
    setFilterBucket('ALL');
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterSupplier && !item.supplierName.toLowerCase().includes(filterSupplier.toLowerCase().trim())) {
        return false;
      }
      if (filterGstin && !item.supplierGstin.toLowerCase().includes(filterGstin.toLowerCase().trim())) {
        return false;
      }
      if (filterInvoice && !item.invoiceNumber.toLowerCase().includes(filterInvoice.toLowerCase().trim())) {
        return false;
      }
      if (filterBucket !== 'ALL' && item.bucket !== filterBucket) {
        return false;
      }
      return true;
    });
  }, [items, filterSupplier, filterGstin, filterInvoice, filterBucket]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderBucket = (bucket: RecoBucket) => {
    switch (bucket) {
      case 'MISSING_IN_2B':
        return <span className="font-semibold text-rose-600 text-xs whitespace-nowrap">Missing in 2B</span>;
      case 'VALUE_MISMATCH':
        return <span className="font-semibold text-rose-600 text-xs whitespace-nowrap">Value Diff</span>;
      case 'EXACT_MATCH':
        return <span className="text-slate-700 font-normal text-xs whitespace-nowrap">Exact Match</span>;
      case 'MISSING_IN_BOOKS':
        return <span className="text-slate-700 font-normal text-xs whitespace-nowrap">In 2B Only</span>;
      case 'INELIGIBLE':
        return <span className="text-slate-700 font-normal text-xs whitespace-nowrap">Sec 17(5)</span>;
      default:
        return <span className="text-slate-700 font-normal text-xs whitespace-nowrap">{bucket}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead className="bg-slate-50/80 border-b border-slate-200/80 sticky top-0 z-10 select-none">
            {/* Row 1: Single Line Column Titles */}
            <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-700 whitespace-nowrap">
              <th className="py-2.5 px-3.5 whitespace-nowrap">Supplier Name</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Supplier GSTIN</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Match Status</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Books Invoice</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Books Tax</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">2B Tax</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Tax Diff</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Actions</th>
            </tr>

            {/* Row 2: In-Column Filters */}
            <tr className="border-t border-slate-200/60 bg-slate-50/40 text-xs font-normal whitespace-nowrap">
              {/* Supplier Name */}
              <th className="p-1.5 px-3.5">
                <input
                  type="text"
                  value={filterSupplier}
                  onChange={(e) => setFilterSupplier(e.target.value)}
                  placeholder="Filter supplier"
                  className="min-w-[180px] w-full px-2 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500"
                />
              </th>

              {/* Supplier GSTIN */}
              <th className="p-1.5 px-3.5">
                <input
                  type="text"
                  value={filterGstin}
                  onChange={(e) => setFilterGstin(e.target.value)}
                  placeholder="Filter GSTIN"
                  className="w-32 px-2 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 font-mono"
                />
              </th>

              {/* Match Status Bucket */}
              <th className="p-1.5 px-3.5">
                <select
                  value={filterBucket}
                  onChange={(e) => setFilterBucket(e.target.value)}
                  className="w-28 px-1.5 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 text-slate-700 cursor-pointer"
                >
                  <option value="ALL">All Buckets</option>
                  <option value="EXACT_MATCH">Exact Match</option>
                  <option value="VALUE_MISMATCH">Value Diff</option>
                  <option value="MISSING_IN_2B">Missing in 2B</option>
                  <option value="MISSING_IN_BOOKS">In 2B Only</option>
                  <option value="INELIGIBLE">Sec 17(5)</option>
                </select>
              </th>

              {/* Books Invoice */}
              <th className="p-1.5 px-3.5">
                <input
                  type="text"
                  value={filterInvoice}
                  onChange={(e) => setFilterInvoice(e.target.value)}
                  placeholder="Filter inv no."
                  className="w-24 px-2 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 font-mono"
                />
              </th>

              <th className="p-1.5 px-3.5" />
              <th className="p-1.5 px-3.5" />
              <th className="p-1.5 px-3.5" />

              {/* Reset Action */}
              <th className="p-1.5 px-3.5 text-right">
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10.5px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors cursor-pointer"
                    title="Clear filters"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400 text-xs whitespace-nowrap">
                  No reconciliation line items match the selected filter.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isMismatch = Math.abs(item.taxDiff) > 1 || item.bucket === 'MISSING_IN_2B';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Supplier Legal Name */}
                    <td className="py-2.5 px-3.5 text-slate-700 text-xs font-normal whitespace-nowrap">
                      {item.supplierName}
                    </td>

                    {/* GSTIN */}
                    <td className="py-2.5 px-3.5 text-slate-700 font-mono text-xs font-normal whitespace-nowrap">
                      {item.supplierGstin}
                    </td>

                    {/* Match Status */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {renderBucket(item.bucket)}
                    </td>

                    {/* Books Invoice */}
                    <td className="py-2.5 px-3.5 text-slate-700 font-mono text-xs font-normal whitespace-nowrap">
                      {item.invoiceNumber || '—'}
                    </td>

                    {/* Books Tax */}
                    <td className="py-2.5 px-3.5 text-right font-mono text-xs text-slate-700 font-normal whitespace-nowrap">
                      {item.booksInvoice?.totalTax ? formatCurrency(item.booksInvoice.totalTax) : '—'}
                    </td>

                    {/* 2B Tax */}
                    <td className="py-2.5 px-3.5 text-right font-mono text-xs text-slate-700 font-normal whitespace-nowrap">
                      {item.gstr2bInvoice?.totalTax ? formatCurrency(item.gstr2bInvoice.totalTax) : '—'}
                    </td>

                    {/* Tax Difference */}
                    <td className={`py-2.5 px-3.5 text-right font-mono text-xs whitespace-nowrap ${isMismatch ? 'text-rose-600 font-semibold' : 'text-slate-700 font-normal'}`}>
                      {item.taxDiff !== 0 ? formatCurrency(item.taxDiff) : '₹0'}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      {item.bucket === 'MISSING_IN_2B' || item.bucket === 'VALUE_MISMATCH' ? (
                        <button
                          onClick={() => onOpenVendorNotice(item)}
                          className="px-2 py-0.5 text-[11px] font-normal rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="Generate Vendor Communication Notice"
                        >
                          Notice
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
