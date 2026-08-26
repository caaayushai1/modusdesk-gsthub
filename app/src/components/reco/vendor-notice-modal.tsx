'use client';

import React, { useState } from 'react';
import type { RecoLineItem } from '@/lib/reco-types';

interface VendorNoticeModalProps {
  item: RecoLineItem;
  clientName: string;
  onClose: () => void;
}

export function VendorNoticeModal({ item, clientName, onClose }: VendorNoticeModalProps) {
  const [copied, setCopied] = useState(false);

  const invNo = item.invoiceNumber;
  const invDate = item.booksInvoice?.invoiceDate || 'N/A';
  const taxableVal = item.booksInvoice?.taxableValue || 0;
  const taxVal = item.booksInvoice?.totalTax || 0;

  const noticeText = `Subject: Urgent - Invoice #${invNo} missing in GSTR-2B of ${clientName}

Dear ${item.supplierName} (GSTIN: ${item.supplierGstin}),

This is regarding Invoice #${invNo} dated ${invDate} for Taxable Value ₹${taxableVal.toLocaleString('en-IN')} (GST Tax ₹${taxVal.toLocaleString('en-IN')}) issued by you to ${clientName}.

Upon reconciling our accounts with the GST Common Portal for the current return period, we found that this invoice is NOT reflecting in our GSTR-2B statement.

Kindly ensure that this invoice is uploaded in your GSTR-1 / IFF return immediately to enable us to claim the eligible Input Tax Credit (ITC) and prevent statutory disallowance under Section 16(2)(aa) of the CGST Act.

Please confirm once the return is filed with the ARN receipt.

Warm regards,
Accounts & Tax Compliance Team
${clientName}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(noticeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(noticeText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 bg-rose-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📩</span>
            <div>
              <h2 className="text-base font-bold text-white">
                Defaulter Vendor Follow-Up Notice
              </h2>
              <p className="text-xs text-rose-200">
                To: <span className="font-semibold text-white">{item.supplierName}</span> ({item.supplierGstin})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-rose-800 p-1.5 text-rose-300 hover:text-white hover:bg-rose-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
            ⚠️ <strong>At-Risk ITC:</strong> This invoice was accounted in Tally Books, but the supplier failed to upload it in their GSTR-1. Send this notice to resolve ITC blockage.
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Notice Draft (Email & WhatsApp Ready):
            </label>
            <textarea
              readOnly
              value={noticeText}
              rows={11}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-xs font-mono text-gray-800 leading-relaxed outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3.5 flex justify-between items-center text-xs">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white hover:bg-gray-100 px-4 py-2 font-semibold text-gray-700 transition-colors shadow-xs"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>📱</span> Send via WhatsApp
            </button>

            <button
              onClick={handleCopy}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Notice Text'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
