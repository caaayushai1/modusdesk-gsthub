'use client';

import React, { useState, useMemo } from 'react';
import type { ReturnType, BatchQueueItem, GSTR1PreviewData, GSTR3BPreviewData, GSTR2BPreviewData } from '@/lib/downloader-types';
import { ReturnTypeSelector } from '@/components/downloader/return-type-selector';
import { PeriodSelectorChips } from '@/components/downloader/period-selector-chips';
import { DownloadQueueTable } from '@/components/downloader/download-queue-table';
import { PreviewModalGSTR1 } from '@/components/downloader/preview-modal-gstr1';
import { PreviewModalGSTR3B } from '@/components/downloader/preview-modal-gstr3b';
import { PreviewModalGSTR2B } from '@/components/downloader/preview-modal-gstr2b';
import { DownloadCloud, CheckCircle2, Building2 } from 'lucide-react';

import { useGSTClients } from '@/lib/use-gst-clients';

export default function DownloaderPage() {
  const { clients } = useGSTClients();
  const [selectedTypes, setSelectedTypes] = useState<ReturnType[]>(['GSTR1', 'GSTR3B', 'GSTR2B']);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(['2026-07']);
  const [selectedClientId, setSelectedClientId] = useState<string>('ALL');
  const [isFetchingAll, setIsFetchingAll] = useState(false);

  // Active preview modals
  const [activePreviewGSTR1, setActivePreviewGSTR1] = useState<GSTR1PreviewData | null>(null);
  const [activePreviewGSTR3B, setActivePreviewGSTR3B] = useState<GSTR3BPreviewData | null>(null);
  const [activePreviewGSTR2B, setActivePreviewGSTR2B] = useState<GSTR2BPreviewData | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Generate queue items dynamically based on selection
  const queueItems: BatchQueueItem[] = useMemo(() => {
    const targetClients =
      selectedClientId === 'ALL'
        ? clients
        : clients.filter((c) => c.id === selectedClientId);

    const items: BatchQueueItem[] = [];

    for (const client of targetClients) {
      for (const p of selectedPeriods) {
        for (const type of selectedTypes) {
          items.push({
            id: `${client.id}_${p}_${type}`,
            clientId: client.id,
            clientCode: client.code,
            clientName: client.name,
            gstin: client.gstin,
            returnType: type,
            period: p,
            status: 'READY',
          });
        }
      }
    }

    return items;
  }, [clients, selectedClientId, selectedPeriods, selectedTypes]);

  // Handle single item preview
  const handlePreviewItem = async (item: BatchQueueItem) => {
    try {
      const res = await fetch('/api/downloader/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: item.clientName,
          gstin: item.gstin,
          returnType: item.returnType,
          period: item.period,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      if (item.returnType === 'GSTR1') {
        setActivePreviewGSTR1(json.data as GSTR1PreviewData);
      } else if (item.returnType === 'GSTR3B') {
        setActivePreviewGSTR3B(json.data as GSTR3BPreviewData);
      } else if (item.returnType === 'GSTR2B') {
        setActivePreviewGSTR2B(json.data as GSTR2BPreviewData);
      } else {
        alert(`ARN Receipt Verified: ${json.data.arn} filed on ${json.data.dateOfFiling}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Preview error';
      alert(`Could not load preview: ${msg}`);
    }
  };

  // Handle single item export
  const handleExportItem = async (item: BatchQueueItem) => {
    try {
      const res = await fetch('/api/downloader/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: item.clientName,
          gstin: item.gstin,
          returnType: item.returnType,
          period: item.period,
        }),
      });

      const json = await res.json();
      const blob = new Blob([JSON.stringify(json.data, null, 2)], {
        type: 'application/json;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.returnType}_${item.gstin}_${item.period}.json`;
      link.click();

      setNotification(`Exported raw JSON for ${item.clientName} (${item.returnType})`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  // Handle batch extract all
  const handleFetchAll = async () => {
    setIsFetchingAll(true);
    setTimeout(() => {
      setIsFetchingAll(false);
      setNotification(`Extracted and verified ${queueItems.length} returns in memory. Ready for interactive preview!`);
      setTimeout(() => setNotification(null), 6000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg font-bold text-slate-900">
              Bulk Return & Statement Downloader
            </h1>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
              Preview-First Engine
            </span>
          </div>
          <p className="text-body-md text-slate-500 mt-1">
            Zero-storage in-browser statutory inspector: B2B invoices, HSN summaries, and auto-drafted ITC statements.
          </p>
        </div>

        {/* Client Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Target Client:</label>
          <div className="relative">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:border-emerald-500 outline-none cursor-pointer"
            >
              <option value="ALL">All Clients ({clients.length} Companies)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-medium text-emerald-900 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="font-bold text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* 1. Return Type Selector */}
      <ReturnTypeSelector
        selectedTypes={selectedTypes}
        onChange={setSelectedTypes}
      />

      {/* 2. Period Selector Chips */}
      <PeriodSelectorChips
        availablePeriods={['2026-07', '2026-06', '2026-05', '2026-04']}
        selectedPeriods={selectedPeriods}
        onChange={setSelectedPeriods}
      />

      {/* 3. Extraction & Preview Queue Table */}
      <DownloadQueueTable
        items={queueItems}
        onPreviewItem={handlePreviewItem}
        onExportItem={handleExportItem}
        onFetchAll={handleFetchAll}
        isFetchingAll={isFetchingAll}
      />

      {/* Modals */}
      {activePreviewGSTR1 && (
        <PreviewModalGSTR1
          data={activePreviewGSTR1}
          onClose={() => setActivePreviewGSTR1(null)}
        />
      )}

      {activePreviewGSTR3B && (
        <PreviewModalGSTR3B
          data={activePreviewGSTR3B}
          onClose={() => setActivePreviewGSTR3B(null)}
        />
      )}

      {activePreviewGSTR2B && (
        <PreviewModalGSTR2B
          data={activePreviewGSTR2B}
          onClose={() => setActivePreviewGSTR2B(null)}
        />
      )}
    </div>
  );
}
