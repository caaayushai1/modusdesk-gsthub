'use client';

import React from 'react';
import type { ReturnType } from '@/lib/downloader-types';
import { FileText, Layers, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

interface ReturnTypeSelectorProps {
  selectedTypes: ReturnType[];
  onChange: (types: ReturnType[]) => void;
}

export function ReturnTypeSelector({ selectedTypes, onChange }: ReturnTypeSelectorProps) {
  const options: { type: ReturnType; title: string; subtitle: string; tag: string }[] = [
    {
      type: 'GSTR1',
      title: 'GSTR-1 Outward',
      subtitle: 'Table 4 B2B Invoices, Credit Notes & Table 12 HSN Summary',
      tag: 'Monthly / QRMP',
    },
    {
      type: 'GSTR3B',
      title: 'GSTR-3B Summary',
      subtitle: 'Table 3.1 Outward Liability, Table 4 ITC & Table 6.1 Tax Paid',
      tag: 'Monthly Return',
    },
    {
      type: 'GSTR2B',
      title: 'GSTR-2B Statement',
      subtitle: 'Auto-drafted static ITC statement & supplier invoice mapping',
      tag: 'Auto-Drafted',
    },
    {
      type: 'ARN_RECEIPT',
      title: 'ARN Acknowledgements',
      subtitle: 'Official signed filing receipts and statutory submission timestamps',
      tag: 'Receipts',
    },
  ];

  const handleToggle = (type: ReturnType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        onChange(selectedTypes.filter((t) => t !== type));
      }
    } else {
      onChange([...selectedTypes, type]);
    }
  };

  return (
    <div className="card-enterprise p-5 bg-white border border-slate-200 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-label-caps text-slate-500">Step 1</span>
          <h3 className="text-headline-sm font-bold text-slate-900">
            Select Return Packages to Extract & Inspect
          </h3>
        </div>
        <span className="text-body-sm text-slate-400">
          {selectedTypes.length} types selected
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
        {options.map((opt) => {
          const isSelected = selectedTypes.includes(opt.type);

          return (
            <div
              key={opt.type}
              onClick={() => handleToggle(opt.type)}
              className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-all cursor-pointer select-none ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                      isSelected
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    {opt.tag}
                  </span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <span className="text-[10px] font-bold">✓</span>}
                  </div>
                </div>

                <h4
                  className={`mt-2.5 text-xs font-bold transition-colors ${
                    isSelected ? 'text-emerald-950' : 'text-slate-900 group-hover:text-emerald-700'
                  }`}
                >
                  {opt.title}
                </h4>
                <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                  {opt.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
