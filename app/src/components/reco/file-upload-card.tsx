'use client';

import React from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles } from 'lucide-react';

interface FileUploadCardProps {
  onLoadSample: () => void;
  isProcessing: boolean;
}

export function FileUploadCard({ onLoadSample, isProcessing }: FileUploadCardProps) {
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onLoadSample();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onLoadSample();
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
      className="card-enterprise p-6 md:p-8 bg-white border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 text-center transition-all shadow-xs"
    >
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
          <UploadCloud className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-headline-sm font-bold text-slate-900">
            Upload Books Purchase Register (Tally / Busy / Excel)
          </h3>
          <p className="text-body-sm text-slate-500 max-w-md mx-auto mt-1">
            Drag & drop your exported purchase register file (.xlsx / .csv), or click below to load a live test dataset.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <label className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer">
            Browse Excel File
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          <span className="text-xs text-slate-400 font-medium">or</span>

          <button
            type="button"
            onClick={onLoadSample}
            disabled={isProcessing}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-2xs transition-all ${
              isProcessing
                ? 'bg-emerald-400 cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/20 cursor-pointer'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Reconciling Invoices...' : 'Load Sample Tally Register & Reconcile'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
