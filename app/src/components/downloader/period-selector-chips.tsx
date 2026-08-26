'use client';

import React from 'react';
import { Calendar, Check } from 'lucide-react';

interface PeriodSelectorChipsProps {
  availablePeriods: string[];
  selectedPeriods: string[];
  onChange: (periods: string[]) => void;
}

export function PeriodSelectorChips({
  availablePeriods,
  selectedPeriods,
  onChange,
}: PeriodSelectorChipsProps) {
  const togglePeriod = (period: string) => {
    if (selectedPeriods.includes(period)) {
      if (selectedPeriods.length > 1) {
        onChange(selectedPeriods.filter((p) => p !== period));
      }
    } else {
      onChange([...selectedPeriods, period]);
    }
  };

  const selectPreset = (type: 'CURRENT' | 'Q1' | 'ALL') => {
    if (type === 'CURRENT') {
      onChange(['2026-07']);
    } else if (type === 'Q1') {
      onChange(['2026-04', '2026-05', '2026-06']);
    } else {
      onChange(availablePeriods);
    }
  };

  const formatPeriodName = (p: string) => {
    const [year, month] = p.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = parseInt(month, 10) - 1;
    return `${months[mIdx]} ${year}`;
  };

  return (
    <div className="card-enterprise p-5 bg-white border border-slate-200 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <span className="text-label-caps text-slate-500">Step 2</span>
          <h3 className="text-headline-sm font-bold text-slate-900">
            Select Tax Periods
          </h3>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium mr-1 text-[11px]">Presets:</span>
          <button
            onClick={() => selectPreset('CURRENT')}
            className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            Jul 2026
          </button>
          <button
            onClick={() => selectPreset('Q1')}
            className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            Q1 (Apr–Jun)
          </button>
          <button
            onClick={() => selectPreset('ALL')}
            className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            All 4 Periods
          </button>
        </div>
      </div>

      {/* Period Chips */}
      <div className="flex flex-wrap gap-2 pt-1">
        {availablePeriods.map((period) => {
          const isSelected = selectedPeriods.includes(period);

          return (
            <button
              key={period}
              onClick={() => togglePeriod(period)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer select-none border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
              <span>{formatPeriodName(period)}</span>
              {isSelected && <span className="text-[10px] ml-0.5">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
