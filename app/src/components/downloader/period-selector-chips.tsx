'use client';

import React from 'react';

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
  const togglePeriod = (p: string) => {
    if (selectedPeriods.includes(p)) {
      if (selectedPeriods.length === 1) return; // Keep at least one
      onChange(selectedPeriods.filter((item) => item !== p));
    } else {
      onChange([...selectedPeriods, p]);
    }
  };

  const selectCurrentMonth = () => {
    onChange(['2026-07']);
  };

  const selectEntireQ1 = () => {
    onChange(['2026-04', '2026-05', '2026-06']);
  };

  const selectAll = () => {
    onChange(availablePeriods);
  };

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
          2. Select Tax Periods to Extract:
        </label>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] text-gray-400">Presets:</span>
          <button
            type="button"
            onClick={selectCurrentMonth}
            className="rounded bg-gray-100 hover:bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-700 transition-colors"
          >
            Jul 2026 (Active)
          </button>
          <button
            type="button"
            onClick={selectEntireQ1}
            className="rounded bg-gray-100 hover:bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-700 transition-colors"
          >
            Entire Q1 (Apr-Jun)
          </button>
          <button
            type="button"
            onClick={selectAll}
            className="rounded bg-blue-50 hover:bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 transition-colors"
          >
            Select All
          </button>
        </div>
      </div>

      {/* Period Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {availablePeriods.map((p) => {
          const isSelected = selectedPeriods.includes(p);

          return (
            <button
              key={p}
              type="button"
              onClick={() => togglePeriod(p)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/20'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{isSelected ? '✓' : '+'}</span>
              <span>{p} (FY 2026-27)</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
