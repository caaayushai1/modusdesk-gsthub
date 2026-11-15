'use client';

import React from 'react';
import { X, CheckCircle2, BarChart3, FileSpreadsheet } from 'lucide-react';
import { getGuestLedger } from '@/lib/composition-guest-storage';

interface AnnualGstr4ModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  clientCode: string;
  gstin: string;
  financialYear: string;
}

export function AnnualGstr4Modal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientCode,
  gstin,
  financialYear,
}: AnnualGstr4ModalProps) {
  if (!isOpen) return null;

  // Load 4 quarters for this client from guest storage
  const q1 = getGuestLedger(financialYear, 'Q1').find(r => r.clientId === clientId);
  const q2 = getGuestLedger(financialYear, 'Q2').find(r => r.clientId === clientId);
  const q3 = getGuestLedger(financialYear, 'Q3').find(r => r.clientId === clientId);
  const q4 = getGuestLedger(financialYear, 'Q4').find(r => r.clientId === clientId);

  const quarters = [
    { label: 'Q1 (Apr - Jun)', data: q1 },
    { label: 'Q2 (Jul - Sep)', data: q2 },
    { label: 'Q3 (Oct - Dec)', data: q3 },
    { label: 'Q4 (Jan - Mar)', data: q4 },
  ];

  const totalPurchases = (Number(q1?.totalPurchases) || 0) + (Number(q2?.totalPurchases) || 0) + (Number(q3?.totalPurchases) || 0) + (Number(q4?.totalPurchases) || 0);
  const totalRcmTaxable = (Number(q1?.rcmTaxableValue) || 0) + (Number(q2?.rcmTaxableValue) || 0) + (Number(q3?.rcmTaxableValue) || 0) + (Number(q4?.rcmTaxableValue) || 0);
  const totalRcmTax = (Number(q1?.rcmTaxPayable) || 0) + (Number(q2?.rcmTaxPayable) || 0) + (Number(q3?.rcmTaxPayable) || 0) + (Number(q4?.rcmTaxPayable) || 0);
  const totalTurnover = (Number(q1?.actualSales) || 0) + (Number(q2?.actualSales) || 0) + (Number(q3?.actualSales) || 0) + (Number(q4?.actualSales) || 0);
  const totalTaxOnSales = (Number(q1?.taxPayableOnSales) || 0) + (Number(q2?.taxPayableOnSales) || 0) + (Number(q3?.taxPayableOnSales) || 0) + (Number(q4?.taxPayableOnSales) || 0);
  const totalCmp08Paid = (Number(q1?.totalCmp08Tax) || 0) + (Number(q2?.totalCmp08Tax) || 0) + (Number(q3?.totalCmp08Tax) || 0) + (Number(q4?.totalCmp08Tax) || 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">GSTR-4 Annual Summary</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {clientName} &bull; FY {financialYear}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Statutory Tax Summary Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 font-bold text-gray-800 border-b border-gray-200">
              Form GSTR-4 Annual Return Computation
            </div>
            <div className="p-4 space-y-2.5">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">Total Outward Turnover (Table 5)</span>
                <span className="font-mono font-bold text-gray-900">{formatCurrency(totalTurnover)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">Tax on Outward Supplies (1%)</span>
                <span className="font-mono font-bold text-gray-900">{formatCurrency(totalTaxOnSales)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">Total Purchases Liable to RCM (Table 4B)</span>
                <span className="font-mono font-bold text-gray-900">{formatCurrency(totalRcmTaxable)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">Tax on Reverse Charge (RCM)</span>
                <span className="font-mono font-bold text-gray-900">{formatCurrency(totalRcmTax)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-200 font-bold bg-gray-50/50 px-2 rounded-lg">
                <span className="text-gray-900">Total Statutory Annual Tax (A + B)</span>
                <span className="font-mono text-emerald-800">{formatCurrency(totalTaxOnSales + totalRcmTax)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">Total Tax Paid via CMP-08 Quarters (Q1 - Q4)</span>
                <span className="font-mono font-bold text-emerald-700">{formatCurrency(totalCmp08Paid)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-emerald-900 bg-emerald-50 px-2 rounded-lg">
                <span>Net Annual Tax Payable / (Refund)</span>
                <span className="font-mono">{formatCurrency(Math.max(0, (totalTaxOnSales + totalRcmTax) - totalCmp08Paid))}</span>
              </div>
            </div>
          </div>

          {/* Quarterly CMP-08 Breakdown */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Quarterly CMP-08 Breakdown</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Quarter</th>
                    <th className="py-2 px-3 text-right">Purchases</th>
                    <th className="py-2 px-3 text-right">Turnover</th>
                    <th className="py-2 px-3 text-right">CMP-08 Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-xs">
                  {quarters.map((q, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2 px-3 font-sans font-medium text-gray-800">{q.label}</td>
                      <td className="py-2 px-3 text-right text-gray-600">{formatCurrency(Number(q.data?.totalPurchases) || 0)}</td>
                      <td className="py-2 px-3 text-right text-gray-900">{formatCurrency(Number(q.data?.actualSales) || 0)}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-800">{formatCurrency(Number(q.data?.totalCmp08Tax) || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
