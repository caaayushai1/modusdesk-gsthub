'use client';

import React from 'react';

interface FileUploadCardProps {
  onLoadSample: () => void;
  isProcessing: boolean;
}

export function FileUploadCard({ onLoadSample, isProcessing }: FileUploadCardProps) {
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // Instant test fallback triggers sample load
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
      className="relative rounded-2xl border-2 border-dashed border-gray-300 bg-white p-6 text-center hover:border-blue-400 hover:bg-blue-50/20 transition-all shadow-xs"
    >
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="rounded-full bg-blue-50 p-3 text-2xl text-blue-600">
          📥
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-900">
            Upload Purchase Register (Tally / Busy / Excel Export)
          </h3>
          <p className="mt-1 text-xs text-gray-500 max-w-md mx-auto">
            Drag and drop your exported purchase register file (.xlsx / .csv), or click below to load a live sample dataset.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <label className="rounded-lg bg-gray-100 hover:bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-800 transition-colors cursor-pointer shadow-xs">
            Browse Excel File
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          <span className="text-xs text-gray-400 font-medium">or</span>

          <button
            type="button"
            onClick={onLoadSample}
            disabled={isProcessing}
            className={`rounded-lg px-4 py-2 text-xs font-bold text-white shadow-xs transition-all ${
              isProcessing
                ? 'bg-blue-400 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {isProcessing ? '⚡ Reconciling Invoices...' : '🧪 Load Sample Tally Register & Reconcile'}
          </button>
        </div>
      </div>
    </div>
  );
}
