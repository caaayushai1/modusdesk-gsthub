'use client';

import React from 'react';
import type { RecoLineItem, RecoBucket } from '@/lib/reco-types';
import { MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';

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
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Exact Match
          </span>
        );
      case 'VALUE_MISMATCH':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Value Diff
          </span>
        );
      case 'MISSING_IN_2B':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Missing in 2B
          </span>
        );
      case 'MISSING_IN_BOOKS':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-800">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            In 2B Only
          </span>
        );
      case 'INELIGIBLE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-800">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            Sec 17(5) Blocked
          </span>
        );
    }
  };

  if (items.length === 0) {
    return (
      <div className="card-enterprise p-12 text-center bg-white border border-slate-200 shadow-xs">
        <span className="text-3xl">🔍</span>
        <h3 className="mt-2 text-headline-sm font-semibold text-slate-900">
          No reconciliation records match your filter
        </h3>
        <p className="text-body-sm text-slate-500 mt-1">
          Try switching your classification bucket or clearing search.
        </p>
      </div>
    );
  }

  return (
    <div className="card-enterprise bg-white border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="overflow-x-auto table-scroll">
        <table className="w-full text-left text-xs border-collapse">
          {/* Header */}
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-3 font-bold text-slate-700">Supplier Legal Entity</th>
              <th className="py-3 px-2 font-bold text-slate-700 text-center">Status</th>
              <th className="py-3 px-3 font-bold text-slate-700 bg-slate-100/60 border-l border-slate-200">Books Invoice</th>
              <th className="py-3 px-3 font-bold text-slate-700 bg-slate-100/60 text-right">Books Tax</th>
              <th className="py-3 px-3 font-bold text-emerald-900 bg-emerald-50/40 border-l border-emerald-100">2B Invoice</th>
              <th className="py-3 px-3 font-bold text-emerald-900 bg-emerald-50/40 text-right">2B Tax</th>
              <th className="py-3 px-3 font-bold text-slate-700 text-right">Tax Diff</th>
              <th className="py-3 px-3 font-bold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const hasTaxDiff = Math.abs(item.taxDiff) > 1;

              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Supplier Info */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{item.supplierName}</div>
                    <div className="font-jetbrains text-[10px] text-slate-500">{item.supplierGstin}</div>
                  </td>

                  {/* Classification Badge */}
                  <td className="py-3 px-2 text-center whitespace-nowrap">
                    {getBucketBadge(item.bucket)}
                  </td>

                  {/* Books Invoice Details */}
                  <td className="py-3 px-3 bg-slate-50/30 border-l border-slate-100 font-jetbrains">
                    {item.booksInvoice ? (
                      <div>
                        <span className="font-bold text-slate-800">{item.booksInvoice.invoiceNumber}</span>
                        <div className="text-[10px] text-slate-400 font-sans">{item.booksInvoice.invoiceDate}</div>
                      </div>
                    ) : (
                      <span className="text-slate-300 italic text-[11px] font-sans">— Not in Books —</span>
                    )}
                  </td>

                  {/* Books Tax Amount */}
                  <td className="py-3 px-3 bg-slate-50/30 text-right font-jetbrains font-medium text-slate-900">
                    {item.booksInvoice ? formatCurrency(item.booksInvoice.totalTax) : '—'}
                  </td>

                  {/* GSTR-2B Invoice Details */}
                  <td className="py-3 px-3 bg-emerald-50/20 border-l border-emerald-50 font-jetbrains">
                    {item.gstr2bInvoice ? (
                      <div>
                        <span className="font-bold text-emerald-800">{item.gstr2bInvoice.invoiceNumber}</span>
                        <div className="text-[10px] text-slate-400 font-sans">Filed: {item.gstr2bInvoice.gstr1FilingDate}</div>
                      </div>
                    ) : (
                      <span className="text-rose-500 italic text-[11px] font-sans font-semibold">❌ Not in GSTR-2B</span>
                    )}
                  </td>

                  {/* GSTR-2B Tax Amount */}
                  <td className="py-3 px-3 bg-emerald-50/20 text-right font-jetbrains font-bold text-emerald-800">
                    {item.gstr2bInvoice ? formatCurrency(item.gstr2bInvoice.totalTax) : '—'}
                  </td>

                  {/* Tax Difference */}
                  <td className={`py-3 px-3 text-right font-jetbrains font-bold ${
                    hasTaxDiff
                      ? item.taxDiff > 0
                        ? 'text-rose-600'
                        : 'text-teal-600'
                      : 'text-emerald-600'
                  }`}>
                    {hasTaxDiff ? formatCurrency(item.taxDiff) : '₹0'}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    {item.bucket === 'MISSING_IN_2B' ? (
                      <button
                        onClick={() => onOpenVendorNotice(item)}
                        className="flex items-center gap-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Notice</span>
                      </button>
                    ) : item.bucket === 'MISSING_IN_BOOKS' ? (
                      <span className="rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                        Record Entry
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium font-sans">
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
      <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-[11px] text-slate-500 flex justify-between items-center">
        <span>Showing {items.length} reconciled line items</span>
        <span className="text-slate-400">Rule 37A & Rule 88D Compliance Engine</span>
      </div>
    </div>
  );
}
