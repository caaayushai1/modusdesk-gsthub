'use client';

import React, { useState } from 'react';
import type { RecoLineItem } from '@/lib/reco-types';
import { Copy, MessageSquare, Check, X, Send } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="border-b border-slate-200 bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold text-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Defaulter Vendor Follow-Up Notice
              </h2>
              <p className="text-[11px] text-slate-400">
                To: <span className="font-semibold text-white">{item.supplierName}</span> (<span className="font-jetbrains">{item.supplierGstin}</span>)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900 leading-relaxed font-medium">
            ⚠️ <strong>At-Risk ITC:</strong> This invoice was accounted in Tally Books, but the supplier failed to upload it in their GSTR-1. Send this notice to resolve ITC blockage.
          </div>

          <div>
            <label className="block text-label-caps text-slate-600 mb-2">
              Notice Draft (Email & WhatsApp Ready):
            </label>
            <textarea
              readOnly
              value={noticeText}
              rows={10}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/70 p-3 font-jetbrains text-xs text-slate-900 leading-relaxed outline-none focus:bg-white focus:border-rose-500 transition-all"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5 flex justify-between items-center text-xs">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white hover:bg-slate-100 px-4 py-2 font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2 font-bold transition-all shadow-2xs shadow-emerald-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send via WhatsApp</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 font-bold transition-colors shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Notice Text'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
