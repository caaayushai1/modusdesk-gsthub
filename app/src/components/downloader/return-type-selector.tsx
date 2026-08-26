'use client';

import React from 'react';
import type { ReturnType } from '@/lib/downloader-types';

interface ReturnTypeSelectorProps {
  selectedTypes: ReturnType[];
  onChange: (types: ReturnType[]) => void;
}

export function ReturnTypeSelector({ selectedTypes, onChange }: ReturnTypeSelectorProps) {
  const options: { type: ReturnType; title: string; desc: string; badge: string; color: string }[] = [
    {
      type: 'GSTR1',
      title: 'GSTR-1 (Outward Return)',
      desc: 'Table 4 B2B Invoices, B2C, HSN Summary & Document details',
      badge: 'Sales & Outward Tax',
      color: 'border-blue-300 bg-blue-50/40 text-blue-700',
    },
    {
      type: 'GSTR3B',
      title: 'GSTR-3B (Monthly Summary)',
      desc: 'Table 3.1 Tax Liability, Table 4 ITC Claimed & Table 6.1 Tax Paid in Cash',
      badge: 'Monthly Tax Payment',
      color: 'border-indigo-300 bg-indigo-50/40 text-indigo-700',
    },
    {
      type: 'GSTR2B',
      title: 'GSTR-2B (ITC Statement)',
      desc: 'Auto-drafted B2B eligible ITC, blocked credit & supplier filing status',
      badge: 'Purchase ITC Auto-Draft',
      color: 'border-teal-300 bg-teal-50/40 text-teal-700',
    },
    {
      type: 'ARN_RECEIPT',
      title: 'Filing Acknowledgements',
      desc: 'Signed ARN receipts with digital signature timestamp & verification mode',
      badge: 'Statutory Proof',
      color: 'border-amber-300 bg-amber-50/40 text-amber-700',
    },
  ];

  const toggleType = (type: ReturnType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) return; // Keep at least one
      onChange(selectedTypes.filter((t) => t !== type));
    } else {
      onChange([...selectedTypes, type]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
          1. Select Return Packages to Extract:
        </label>
        <span className="text-[11px] text-gray-500">{selectedTypes.length} selected</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {options.map((opt) => {
          const isSelected = selectedTypes.includes(opt.type);

          return (
            <div
              key={opt.type}
              onClick={() => toggleType(opt.type)}
              className={`relative rounded-xl border p-4 transition-all cursor-pointer select-none ${
                isSelected
                  ? `${opt.color} shadow-xs ring-1 ring-blue-500`
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleType(opt.type)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {opt.badge}
                </span>
              </div>

              <h4 className="mt-2 text-sm font-bold text-gray-900">{opt.title}</h4>
              <p className="mt-1 text-xs text-gray-500 leading-relaxed">{opt.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
