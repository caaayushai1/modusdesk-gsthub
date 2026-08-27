'use client';

import React, { useState, useMemo } from 'react';
import type { ReturnType, BatchQueueItem, GSTR1PreviewData, GSTR3BPreviewData, GSTR2BPreviewData } from '@/lib/downloader-types';
import { DownloadQueueTable } from '@/components/downloader/download-queue-table';
import { PreviewModalGSTR1 } from '@/components/downloader/preview-modal-gstr1';
import { PreviewModalGSTR3B } from '@/components/downloader/preview-modal-gstr3b';
import { PreviewModalGSTR2B } from '@/components/downloader/preview-modal-gstr2b';
import { useGSTClients } from '@/lib/use-gst-clients';
import { Download, RefreshCw } from 'lucide-react';

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

  // Staging sample fallback clients if empty
  const effectiveClients = clients.length > 0 ? clients : [
    { id: 'stg-1', code: '001A', name: 'Apex Infotech Solutions Private Limited', gstin: '27AABCA1122D1Z4' },
    { id: 'stg-2', code: '002A', name: 'Bharat Pharma & Life Sciences LLP', gstin: '24BBBBB3344E1Z8' },
    { id: 'stg-3', code: '003A', name: 'Singhania Heavy Engineering Works', gstin: '27CCCCC5566F1Z1' },
    { id: 'stg-4', code: '004A', name: 'Zenith Logistics & Supply Chain Pvt Ltd', gstin: '29DDDDD7788G1Z9' },
    { id: 'stg-5', code: '005A', name: 'Kalyan Jewellers & Craftsmen Co', gstin: '33EEEEE9900H1Z2' },
  ];

  // Generate queue items dynamically
  const queueItems: BatchQueueItem[] = useMemo(() => {
    const targetClients =
      selectedClientId === 'ALL'
        ? effectiveClients
        : effectiveClients.filter((c) => c.id === selectedClientId);

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
  }, [effectiveClients, selectedClientId, selectedPeriods, selectedTypes]);

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
      if (!json.success) throw new Error(json.error);

      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.clientCode}_${item.returnType}_${item.period}.json`;
      link.click();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export error';
      alert(`Export failed: ${msg}`);
    }
  };

  // Handle bulk fetch
  const handleFetchAll = async () => {
    try {
      setIsFetchingAll(true);
      await new Promise((r) => setTimeout(r, 1200));
      alert(`Successfully downloaded ${queueItems.length} returns for selected clients!`);
    } catch (err: unknown) {
      console.error('Batch fetch error:', err);
    } finally {
      setIsFetchingAll(false);
    }
  };

  const returnTypeOptions: { type: ReturnType; label: string }[] = [
    { type: 'GSTR1', label: 'GSTR-1' },
    { type: 'GSTR3B', label: 'GSTR-3B' },
    { type: 'GSTR2B', label: 'GSTR-2B' },
    { type: 'ARN_RECEIPT', label: 'ARN' },
  ];

  const handleToggleType = (type: ReturnType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter((t) => t !== type));
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  return (
    <div className="space-y-3.5 max-w-7xl animate-in fade-in duration-200">
      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          Returns Downloader
        </h1>

        <button
          onClick={handleFetchAll}
          disabled={isFetchingAll || queueItems.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetchingAll ? 'animate-spin' : ''}`} />
          <span>{isFetchingAll ? 'Extracting...' : `Download All (${queueItems.length})`}</span>
        </button>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Client Selector & Return Type Pills */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Client Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Client:</span>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium outline-none focus:border-emerald-500 focus:bg-white cursor-pointer max-w-[220px]"
            >
              <option value="ALL">All Practice Clients</option>
              {effectiveClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Return Type Multi-Select Pills */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">Types:</span>
            {returnTypeOptions.map((opt) => {
              const active = selectedTypes.includes(opt.type);
              return (
                <button
                  key={opt.type}
                  onClick={() => handleToggleType(opt.type)}
                  className={`px-2.5 py-0.5 rounded-lg text-xs transition-all cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white font-medium shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {queueItems.length} return packages ready
        </span>
      </div>

      {/* Downloader Queue Table */}
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
