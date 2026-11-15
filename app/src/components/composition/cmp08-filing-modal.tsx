'use client';

import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Zap, 
  Copy, 
  Check, 
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { triggerCMP08Filing } from '@/lib/companion-client';
import { getGuestClients } from '@/lib/composition-guest-storage';
import { useGSTClients } from '@/lib/use-gst-clients';

interface CompositionLedgerRow {
  id: string;
  clientId: string;
  clientCode: string;
  clientName: string;
  gstin: string;
  financialYear: string;
  quarter: string;
  openingStock: number;
  totalPurchases: number;
  rcmTaxableValue: number;
  rcmTaxPayable: number;
  gpMargin: number;
  salesMode: string;
  actualSales: number;
  taxRateOnSales: number;
  taxPayableOnSales: number;
  totalCmp08Tax: number;
  closingStock: number;
  status: string;
  arn?: string | null;
}

interface Cmp08FilingModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: CompositionLedgerRow | null;
  onLaunchCompanion?: (gstin: string) => void;
}

export function Cmp08FilingModal({
  isOpen,
  onClose,
  record,
  onLaunchCompanion
}: Cmp08FilingModalProps) {
  const [copied, setCopied] = useState(false);
  const [isFiling, setIsFiling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const { clients: hookClients } = useGSTClients();

  if (!isOpen || !record) return null;

  const cgstSales = Math.round((record.taxPayableOnSales / 2) * 100) / 100;
  const sgstSales = Math.round((record.taxPayableOnSales / 2) * 100) / 100;
  const cgstRcm = Math.round((record.rcmTaxPayable / 2) * 100) / 100;
  const sgstRcm = Math.round((record.rcmTaxPayable / 2) * 100) / 100;

  const totalCgst = Math.round((cgstSales + cgstRcm) * 100) / 100;
  const totalSgst = Math.round((sgstSales + sgstRcm) * 100) / 100;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const generateCmp08Json = () => {
    return {
      gstin: record.gstin,
      fp: record.quarter,
      fy: record.financialYear,
      table3: {
        outwardTaxableSupplies: {
          taxableVal: record.actualSales,
          iamt: 0,
          camt: cgstSales,
          samt: sgstSales,
          csamt: 0
        },
        inwardReverseCharge: {
          taxableVal: record.rcmTaxableValue,
          iamt: 0,
          camt: cgstRcm,
          samt: sgstRcm,
          csamt: 0
        },
        totalTaxPayable: {
          iamt: 0,
          camt: totalCgst,
          samt: totalSgst,
          csamt: 0,
          total: record.totalCmp08Tax
        }
      },
    };
  };

  const handleDownloadJson = () => {
    const data = generateCmp08Json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CMP08_${record.gstin || record.clientName}_${record.financialYear}_${record.quarter}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    const data = generateCmp08Json();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAutoFileCompanion = async () => {
    setStatusMessage(null);

    // Find credentials from guest storage or hook clients
    const guestList = getGuestClients();
    const foundGuest = guestList.find(g => g.id === record.clientId || (record.gstin && g.gstin === record.gstin) || g.clientName === record.clientName);
    const foundHook = hookClients.find(c => c.id === record.clientId || (record.gstin && c.gstin === record.gstin));

    let username = foundGuest?.portalUsername || (foundHook as any)?.portalUsername || record.gstin;
    let password = foundGuest?.portalPassword || (foundHook as any)?.portalPassword || '';

    // If password missing, fetch automatically from ModusDesk vault
    if (!password) {
      try {
        const credRes = await fetch(`/api/clients/credentials?clientId=${encodeURIComponent(record.clientId)}&gstin=${encodeURIComponent(record.gstin || '')}`);
        if (credRes.ok) {
          const credJson = await credRes.json();
          if (credJson.credentials?.password) {
            username = credJson.credentials.username || username;
            password = credJson.credentials.password;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch credentials from ModusDesk vault:', err);
      }
    }

    if (!username || !password) {
      setStatusMessage({
        type: 'error',
        text: 'Portal User ID and Password not found for this client. Please update them in Add Client.'
      });
      return;
    }

    try {
      setIsFiling(true);
      setStatusMessage({
        type: 'info',
        text: 'Chrome/Edge opened on screen with credentials filled. Please type the CAPTCHA and log in on the GST portal window...'
      });

      const res = await triggerCMP08Filing({
        username,
        password,
        financialYear: record.financialYear,
        quarter: record.quarter,
        gstin: record.gstin || undefined,
        actualSales: record.actualSales,
        rcmTaxableValue: record.rcmTaxableValue,
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: res.message || 'CMP-08 Table 3 saved on portal. Ready for OTP/DSC verification.'
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message || res.error || 'Failed to auto-file CMP-08 on portal.'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error executing automated filing.'
      });
    } finally {
      setIsFiling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-4xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-900">FORM GST CMP-08</span>
              <span className="text-gray-400">&bull;</span>
              <span className="text-xs text-gray-500">{record.quarter} ({record.financialYear})</span>
            </div>
            <h2 className="text-base font-bold text-gray-900 mt-0.5">{record.clientName}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GSTIN & Rate Strip */}
        <div className="px-6 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between text-xs text-gray-600">
          <div>
            <span>GSTIN:</span> <strong className="font-mono text-gray-900 ml-1">{record.gstin || '—'}</strong>
          </div>
          <div>
            <span>Rate:</span> <strong className="text-gray-900 ml-1">{record.taxRateOnSales}% (0.5% CGST + 0.5% SGST)</strong>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : statusMessage.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* Table 3: Summary of self-assessed liability */}
          <div>
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
              Table 3. Summary of Self-Assessed Tax Liability
            </h3>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Value (₹)</th>
                    <th className="py-2.5 px-3 text-right">IGST (₹)</th>
                    <th className="py-2.5 px-3 text-right">CGST (₹)</th>
                    <th className="py-2.5 px-3 text-right">SGST (₹)</th>
                    <th className="py-2.5 px-3 text-right font-bold text-gray-900">Total Tax (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Row 3(a): Outward Supplies */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 font-medium text-gray-800">
                      3(a). Outward supplies
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-800">
                      {formatCurrency(record.actualSales)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-500">0.00</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-700">{formatCurrency(cgstSales)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-700">{formatCurrency(sgstSales)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                      {formatCurrency(record.taxPayableOnSales)}
                    </td>
                  </tr>

                  {/* Row 3(b): Inward Supplies attracting RCM */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 font-medium text-gray-800">
                      3(b). Inward supplies attracting reverse charge
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-800">
                      {formatCurrency(record.rcmTaxableValue)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-500">0.00</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-700">{formatCurrency(cgstRcm)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-700">{formatCurrency(sgstRcm)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                      {formatCurrency(record.rcmTaxPayable)}
                    </td>
                  </tr>

                  {/* Row 3(c): Total Tax Payable */}
                  <tr className="bg-gray-50 font-bold border-t border-gray-200">
                    <td className="py-2.5 px-3 text-gray-900">
                      3(c). Total Tax Payable (3a + 3b)
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-900">
                      {formatCurrency(record.actualSales + record.rcmTaxableValue)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-900">0.00</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-900">{formatCurrency(totalCgst)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-900">{formatCurrency(totalSgst)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm text-emerald-800 font-extrabold">
                      {formatCurrency(record.totalCmp08Tax)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Inventory & Stock Summary */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2.5">
              Stock Reconciliation
            </h4>

            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-500 block">Opening Stock:</span>
                <strong className="font-mono text-gray-800 text-sm mt-0.5 block">
                  {formatCurrency(record.openingStock)}
                </strong>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-500 block">Purchases (incl. Tax):</span>
                <strong className="font-mono text-gray-800 text-sm mt-0.5 block">
                  {formatCurrency(record.totalPurchases)}
                </strong>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-500 block">Gross Profit Margin:</span>
                <strong className="font-mono text-gray-800 text-sm mt-0.5 block">
                  {record.gpMargin}%
                </strong>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-emerald-300">
                <span className="text-emerald-700 font-medium block">Audited Closing Stock:</span>
                <strong className="font-mono text-emerald-800 text-sm mt-0.5 block">
                  {formatCurrency(record.closingStock)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadJson}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Download JSON</span>
            </button>
            <button
              onClick={handleCopyJson}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleAutoFileCompanion}
              disabled={isFiling}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isFiling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Auto-Filing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>Auto-Fill on Portal</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
