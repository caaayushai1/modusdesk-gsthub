'use client';

import React, { useState, useMemo } from 'react';
import type { RecoLineItem, RecoBucket } from '@/lib/reco-types';
import { X, ArrowUpDown } from 'lucide-react';

interface RecoDataTableProps {
  items: RecoLineItem[];
}

export function RecoDataTable({ items }: RecoDataTableProps) {
  // In-column filter states
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterGstin, setFilterGstin] = useState('');
  const [filterBucket, setFilterBucket] = useState('ALL');
  const [filterBooksInv, setFilterBooksInv] = useState('');
  const [filterBooksDate, setFilterBooksDate] = useState('');
  const [filter2bInv, setFilter2bInv] = useState('');
  const [filter2bDate, setFilter2bDate] = useState('');
  const [taxSort, setTaxSort] = useState<'NONE' | 'DIFF_HIGH_TO_LOW' | 'BOOKS_HIGH_TO_LOW' | '2B_HIGH_TO_LOW'>('NONE');

  const hasActiveFilters =
    Boolean(filterSupplier) ||
    Boolean(filterGstin) ||
    filterBucket !== 'ALL' ||
    Boolean(filterBooksInv) ||
    Boolean(filterBooksDate) ||
    Boolean(filter2bInv) ||
    Boolean(filter2bDate) ||
    taxSort !== 'NONE';

  const resetFilters = () => {
    setFilterSupplier('');
    setFilterGstin('');
    setFilterBucket('ALL');
    setFilterBooksInv('');
    setFilterBooksDate('');
    setFilter2bInv('');
    setFilter2bDate('');
    setTaxSort('NONE');
  };

  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      if (filterSupplier && !item.supplierName.toLowerCase().includes(filterSupplier.toLowerCase().trim())) {
        return false;
      }
      if (filterGstin && !item.supplierGstin.toLowerCase().includes(filterGstin.toLowerCase().trim())) {
        return false;
      }
      if (filterBucket !== 'ALL' && item.bucket !== filterBucket) {
        return false;
      }
      if (filterBooksInv && !item.booksInvoice?.invoiceNumber.toLowerCase().includes(filterBooksInv.toLowerCase().trim())) {
        return false;
      }
      if (filterBooksDate && !item.booksInvoice?.invoiceDate.includes(filterBooksDate.trim())) {
        return false;
      }
      if (filter2bInv && !item.gstr2bInvoice?.invoiceNumber.toLowerCase().includes(filter2bInv.toLowerCase().trim())) {
        return false;
      }
      if (filter2bDate && !item.gstr2bInvoice?.invoiceDate.includes(filter2bDate.trim())) {
        return false;
      }
      return true;
    });

    if (taxSort === 'DIFF_HIGH_TO_LOW') {
      result = [...result].sort((a, b) => Math.abs(b.taxDiff) - Math.abs(a.taxDiff));
    } else if (taxSort === 'BOOKS_HIGH_TO_LOW') {
      result = [...result].sort((a, b) => (b.booksInvoice?.totalTax || 0) - (a.booksInvoice?.totalTax || 0));
    } else if (taxSort === '2B_HIGH_TO_LOW') {
      result = [...result].sort((a, b) => (b.gstr2bInvoice?.totalTax || 0) - (a.gstr2bInvoice?.totalTax || 0));
    }

    return result;
  }, [items, filterSupplier, filterGstin, filterBucket, filterBooksInv, filterBooksDate, filter2bInv, filter2bDate, taxSort]);

  // Compute table summary totals
  const totals = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        acc.booksTaxable += item.booksInvoice?.taxableValue || 0;
        acc.booksTax += item.booksInvoice?.totalTax || 0;
        acc.gstr2bTaxable += item.gstr2bInvoice?.taxableValue || 0;
        acc.gstr2bTax += item.gstr2bInvoice?.totalTax || 0;
        acc.taxDiff += item.taxDiff || 0;
        return acc;
      },
      { booksTaxable: 0, booksTax: 0, gstr2bTaxable: 0, gstr2bTax: 0, taxDiff: 0 }
    );
  }, [filteredItems]);

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
      case 'HEAD_MISMATCH':
        return <span className="font-semibold text-rose-600 text-xs whitespace-nowrap">Head Mismatch</span>;
      case 'DATE_MISMATCH':
        return <span className="font-semibold text-rose-600 text-xs whitespace-nowrap">Date Diff</span>;
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
              <th className="py-2.5 px-3.5 whitespace-nowrap">Supplier Legal Name</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Supplier GSTIN</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Match Status</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Books Invoice Number</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Books Invoice Date</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Books Taxable Value</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Books Total Tax</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">GSTR-2B Invoice Number</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">GSTR-2B Invoice Date</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">GSTR-2B Taxable Value</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">GSTR-2B Total Tax</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Tax Difference</th>
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
                  className="min-w-[170px] w-full px-2 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500"
                />
              </th>

              {/* Supplier GSTIN */}
              <th className="p-1.5 px-3.5">
                <input
                  type="text"
                  value={filterGstin}
                  onChange={(e) => setFilterGstin(e.target.value)}
                  placeholder="Filter GSTIN"
                  className="w-28 px-2 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 font-mono"
                />
              </th>

              {/* Match Status */}
              <th className="p-1.5 px-3.5">
                <select
                  value={filterBucket}
                  onChange={(e) => setFilterBucket(e.target.value)}
                  className="w-28 px-1.5 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 text-slate-700 cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="EXACT_MATCH">Exact Match</option>
                  <option value="VALUE_MISMATCH">Value Diff</option>
                  <option value="HEAD_MISMATCH">Head Mismatch</option>
                  <option value="DATE_MISMATCH">Date Diff</option>
                  <option value="MISSING_IN_2B">Missing in 2B</option>
                  <option value="MISSING_IN_BOOKS">In 2B Only</option>
                  <option value="INELIGIBLE">Sec 17(5)</option>
                </select>
              </th>

              {/* Books Invoice Number */}
              <th className="p-1.5 px-3.5">
                <input
                  type="text"
                  value={filterBooksInv}
                  onChange={(e) => setFilterBooksInv(e.target.value)}
                  placeholder="Filter inv no."
                  className="w-28 px-2 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 font-mono"
                />
              </th>

              {/* Books Invoice Date */}
              <th className="p-1.5 px-3.5">
                <input
                  type="text"
                  value={filterBooksDate}
                  onChange={(e) => setFilterBooksDate(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="w-24 px-2 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 font-mono"
                />
              </th>

              {/* Books Taxable Value */}
              <th className="p-1.5 px-3.5 text-right" />

              {/* Books Total Tax */}
              <th className="p-1.5 px-3.5 text-right">
                <select
                  value={taxSort}
                  onChange={(e) => setTaxSort(e.target.value as any)}
                  className="w-24 px-1 py-1 text-[10.5px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 text-slate-700 cursor-pointer"
                >
                  <option value="NONE">Sort Tax</option>
                  <option value="BOOKS_HIGH_TO_LOW">Books High↓</option>
                  <option value="2B_HIGH_TO_LOW">2B High↓</option>
                  <option value="DIFF_HIGH_TO_LOW">Diff High↓</option>
                </select>
              </th>

              {/* GSTR-2B Invoice Number */}
              <th className="p-1.5 px-3.5">
                <input
                  type="text"
                  value={filter2bInv}
                  onChange={(e) => setFilter2bInv(e.target.value)}
                  placeholder="Filter 2B inv."
                  className="w-28 px-2 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 font-mono"
                />
              </th>

              {/* GSTR-2B Invoice Date */}
              <th className="p-1.5 px-3.5">
                <input
                  type="text"
                  value={filter2bDate}
                  onChange={(e) => setFilter2bDate(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="w-24 px-2 py-1 text-[11px] font-normal bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 font-mono"
                />
              </th>

              {/* 2B Taxable */}
              <th className="p-1.5 px-3.5 text-right" />

              {/* 2B Tax */}
              <th className="p-1.5 px-3.5 text-right" />

              {/* Clear Filter Button */}
              <th className="p-1.5 px-3.5 text-right">
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10.5px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors cursor-pointer"
                    title="Clear all filters"
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
                <td colSpan={12} className="py-10 text-center text-slate-400 text-xs whitespace-nowrap">
                  No reconciliation line items match the selected filter.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isMismatch =
                  item.bucket === 'MISSING_IN_2B' ||
                  item.bucket === 'VALUE_MISMATCH' ||
                  item.bucket === 'HEAD_MISMATCH' ||
                  item.bucket === 'DATE_MISMATCH';

                const b = item.booksInvoice;
                const g = item.gstr2bInvoice;

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

                    {/* Books Invoice Number */}
                    <td className="py-2.5 px-3.5 font-mono text-xs text-slate-700 font-normal whitespace-nowrap">
                      {b?.invoiceNumber || '—'}
                    </td>

                    {/* Books Invoice Date */}
                    <td className="py-2.5 px-3.5 font-mono text-xs text-slate-700 font-normal whitespace-nowrap">
                      {b?.invoiceDate || '—'}
                    </td>

                    {/* Books Taxable Value */}
                    <td className="py-2.5 px-3.5 text-right font-mono text-xs text-slate-700 font-normal whitespace-nowrap">
                      {b ? formatCurrency(b.taxableValue) : '—'}
                    </td>

                    {/* Books Total Tax */}
                    <td className="py-2.5 px-3.5 text-right font-mono text-xs text-slate-700 font-normal whitespace-nowrap">
                      {b ? formatCurrency(b.totalTax) : '—'}
                    </td>

                    {/* GSTR-2B Invoice Number */}
                    <td className="py-2.5 px-3.5 font-mono text-xs text-slate-700 font-normal whitespace-nowrap">
                      {g?.invoiceNumber || '—'}
                    </td>

                    {/* GSTR-2B Invoice Date */}
                    <td className="py-2.5 px-3.5 font-mono text-xs text-slate-700 font-normal whitespace-nowrap">
                      {g?.invoiceDate || '—'}
                    </td>

                    {/* GSTR-2B Taxable Value */}
                    <td className="py-2.5 px-3.5 text-right font-mono text-xs text-slate-700 font-normal whitespace-nowrap">
                      {g ? formatCurrency(g.taxableValue) : '—'}
                    </td>

                    {/* GSTR-2B Total Tax */}
                    <td className="py-2.5 px-3.5 text-right font-mono text-xs text-slate-700 font-normal whitespace-nowrap">
                      {g ? formatCurrency(g.totalTax) : '—'}
                    </td>

                    {/* Tax Difference */}
                    <td className={`py-2.5 px-3.5 text-right font-mono text-xs whitespace-nowrap ${isMismatch && item.taxDiff !== 0 ? 'text-rose-600 font-semibold' : 'text-slate-700 font-normal'}`}>
                      {item.taxDiff !== 0 ? formatCurrency(item.taxDiff) : '₹0'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Sticky Prominent Totals Row */}
          {filteredItems.length > 0 && (
            <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-semibold text-slate-900 text-xs select-none">
              <tr>
                <td className="py-3 px-3.5 whitespace-nowrap font-bold" colSpan={3}>
                  TOTAL ({filteredItems.length} Invoices)
                </td>
                <td className="py-3 px-3.5 font-mono text-slate-400">—</td>
                <td className="py-3 px-3.5 font-mono text-slate-400">—</td>
                <td className="py-3 px-3.5 text-right font-mono text-slate-900 whitespace-nowrap">
                  {formatCurrency(totals.booksTaxable)}
                </td>
                <td className="py-3 px-3.5 text-right font-mono text-slate-900 whitespace-nowrap">
                  {formatCurrency(totals.booksTax)}
                </td>
                <td className="py-3 px-3.5 font-mono text-slate-400">—</td>
                <td className="py-3 px-3.5 font-mono text-slate-400">—</td>
                <td className="py-3 px-3.5 text-right font-mono text-slate-900 whitespace-nowrap">
                  {formatCurrency(totals.gstr2bTaxable)}
                </td>
                <td className="py-3 px-3.5 text-right font-mono text-slate-900 whitespace-nowrap">
                  {formatCurrency(totals.gstr2bTax)}
                </td>
                <td className={`py-3 px-3.5 text-right font-mono whitespace-nowrap ${totals.taxDiff !== 0 ? 'text-rose-600 font-bold' : 'text-slate-900'}`}>
                  {totals.taxDiff !== 0 ? formatCurrency(totals.taxDiff) : '₹0'}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
