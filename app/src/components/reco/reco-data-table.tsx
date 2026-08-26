'use client';

import React from 'react';
import type { RecoLineItem, RecoBucket } from '@/lib/reco-types';

interface RecoDataTableProps {
  items: RecoLineItem[];
  onOpenVendorNotice: (item: RecoLineItem) => void;
}

export function RecoDataTable({ items, onOpenVendorNotice }: RecoDataTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBucketBadge = (bucket: RecoBucket) => {
    switch (bucket) {
      case 'EXACT_MATCH':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Exact Match
          </span>
        );
      case 'VALUE_MISMATCH':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Value Diff
          </span>
        );
      case 'MISSING_IN_2B':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Missing in 2B
          </span>
        );
      case 'MISSING_IN_BOOKS':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            In 2B Only
          </span>
        );
      case 'INELIGIBLE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            Sec 17(5) Blocked
          </span>
        );
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-xs">
        <span className="text-3xl">🔍</span>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No reconciliation records match your filter</h3>
        <p className="mt-1 text-xs text-gray-500">Try switching your classification bucket or clearing search.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Header */}
          <thead className="bg-gray-100/75 text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-3">Supplier & GSTIN</th>
              <th className="py-2.5 px-2 text-center">Status</th>
              <th className="py-2.5 px-3 bg-blue-50/50 text-blue-900 border-l border-blue-100">Books Invoice</th>
              <th className="py-2.5 px-3 bg-blue-50/50 text-blue-900 text-right">Books Tax</th>
              <th className="py-2.5 px-3 bg-teal-50/50 text-teal-900 border-l border-teal-100">2B Invoice</th>
              <th className="py-2.5 px-3 bg-teal-50/50 text-teal-900 text-right">2B Tax</th>
              <th className="py-2.5 px-3 text-right">Tax Diff</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const hasTaxDiff = Math.abs(item.taxDiff) > 1;

              return (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  {/* Supplier Info */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-gray-900">{item.supplierName}</div>
                    <div className="font-mono text-[11px] text-gray-500">{item.supplierGstin}</div>
                  </td>

                  {/* Classification Badge */}
                  <td className="py-3 px-2 text-center whitespace-nowrap">
                    {getBucketBadge(item.bucket)}
                  </td>

                  {/* Books Invoice Details */}
                  <td className="py-3 px-3 bg-blue-50/20 border-l border-blue-50">
                    {item.booksInvoice ? (
                      <div>
                        <span className="font-mono font-bold text-gray-800">{item.booksInvoice.invoiceNumber}</span>
                        <div className="text-[10px] text-gray-400">{item.booksInvoice.invoiceDate}</div>
                      </div>
                    ) : (
                      <span className="text-gray-300 italic text-[11px]">— Not in Books —</span>
                    )}
                  </td>

                  {/* Books Tax Amount */}
                  <td className="py-3 px-3 bg-blue-50/20 text-right font-medium text-gray-900">
                    {item.booksInvoice ? formatCurrency(item.booksInvoice.totalTax) : '—'}
                  </td>

                  {/* GSTR-2B Invoice Details */}
                  <td className="py-3 px-3 bg-teal-50/20 border-l border-teal-50">
                    {item.gstr2bInvoice ? (
                      <div>
                        <span className="font-mono font-bold text-teal-800">{item.gstr2bInvoice.invoiceNumber}</span>
                        <div className="text-[10px] text-gray-400">Filed: {item.gstr2bInvoice.gstr1FilingDate}</div>
                      </div>
                    ) : (
                      <span className="text-rose-400 italic text-[11px] font-semibold">❌ Not in GSTR-2B</span>
                    )}
                  </td>

                  {/* GSTR-2B Tax Amount */}
                  <td className="py-3 px-3 bg-teal-50/20 text-right font-medium text-teal-900">
                    {item.gstr2bInvoice ? formatCurrency(item.gstr2bInvoice.totalTax) : '—'}
                  </td>

                  {/* Tax Difference */}
                  <td className={`py-3 px-3 text-right font-bold ${
                    hasTaxDiff
                      ? item.taxDiff > 0
                        ? 'text-rose-600'
                        : 'text-blue-600'
                      : 'text-emerald-600'
                  }`}>
                    {hasTaxDiff ? formatCurrency(item.taxDiff) : '₹0'}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    {item.bucket === 'MISSING_IN_2B' ? (
                      <button
                        onClick={() => onOpenVendorNotice(item)}
                        className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 text-xs font-bold transition-colors shadow-xs"
                      >
                        📩 Notice
                      </button>
                    ) : item.bucket === 'MISSING_IN_BOOKS' ? (
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                        Record Entry
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-medium">
                        ✓ Verified
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="border-t border-gray-200 bg-gray-50/50 px-4 py-2.5 text-[11px] text-gray-500 flex justify-between items-center">
        <span>Showing {items.length} reconciled line items</span>
        <span className="text-gray-400">Rule 37A & Rule 88D Compliance Engine</span>
      </div>
    </div>
  );
}
