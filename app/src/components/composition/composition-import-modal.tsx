'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  DownloadCloud, 
  Check, 
  AlertCircle, 
  Loader2, 
  Zap, 
  FileText
} from 'lucide-react';
import { useGSTClients, GSTClient } from '@/lib/use-gst-clients';
import { parseGSTR2AJson, aggregateGSTR2AInwardInvoices, IngestedInvoice, computeCompositionQuarter } from '@/lib/composition-calculator';
import { getGuestClients, saveGuestInvoices, saveGuestLedgerRow, getGuestLedger } from '@/lib/composition-guest-storage';

interface CompositionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients?: GSTClient[];
  selectedQuarter?: string;
  selectedFy?: string;
  onIngestSuccess?: () => void;
  onImportSuccess?: () => void;
}

export function CompositionImportModal({
  isOpen,
  onClose,
  clients: passedClients,
  selectedQuarter = 'Q2',
  selectedFy = '2026-27',
  onIngestSuccess,
  onImportSuccess,
}: CompositionImportModalProps) {
  const { clients: hookClients, staffInfo } = useGSTClients();
  const [allClients, setAllClients] = useState<GSTClient[]>([]);
  const isGuest = !staffInfo;

  useEffect(() => {
    if (passedClients && passedClients.length > 0) {
      setAllClients(passedClients);
    } else if (hookClients.length > 0) {
      setAllClients(hookClients);
    } else {
      // In guest mode, load guest clients
      const guestList = getGuestClients();
      setAllClients(guestList.map(g => ({
        id: g.id,
        code: g.clientCode,
        clientCode: g.clientCode,
        name: g.clientName,
        clientName: g.clientName,
        gstin: g.gstin,
        stateCode: g.stateCode || '',
        portalUsername: g.portalUsername,
      })));
    }
  }, [passedClients, hookClients, staffInfo, isOpen]);

  const triggerSuccess = () => {
    if (onIngestSuccess) onIngestSuccess();
    if (onImportSuccess) onImportSuccess();
  };

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'FILE_UPLOAD' | 'MANUAL_ENTRY' | 'AUTO_COMPANION'>('FILE_UPLOAD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // File Upload State
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [parsedInvoices, setParsedInvoices] = useState<IngestedInvoice[]>([]);
  const [parsedSummary, setParsedSummary] = useState<{ totalPurchases: number; rcmTaxableValue: number; rcmTaxPayable: number; count: number } | null>(null);

  // Manual values (Clean empty defaults, NO hardcoded numbers)
  const [manualPurchases, setManualPurchases] = useState('');
  const [manualRcmTaxable, setManualRcmTaxable] = useState('');
  const [manualRcmTax, setManualRcmTax] = useState('');

  // Reset fields on modal open
  useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      setUploadedFileName(null);
      setParsedInvoices([]);
      setParsedSummary(null);
      setManualPurchases('');
      setManualRcmTaxable('');
      setManualRcmTax('');
      if (allClients.length > 0 && !selectedClientId) {
        setSelectedClientId(allClients[0].id);
      }
    }
  }, [isOpen, allClients]);

  if (!isOpen) return null;

  const targetClient = allClients.find(c => c.id === selectedClientId) || allClients[0];

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage(null);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        const invoices = parseGSTR2AJson(json);
        if (invoices.length === 0) {
          setStatusMessage({ type: 'error', text: 'No B2B invoices found in the uploaded GSTR-2A JSON file.' });
          setParsedInvoices([]);
          setParsedSummary(null);
          return;
        }

        const agg = aggregateGSTR2AInwardInvoices(invoices);
        setParsedInvoices(invoices);
        setParsedSummary({
          totalPurchases: agg.totalPurchases,
          rcmTaxableValue: agg.rcmTaxableValue,
          rcmTaxPayable: agg.rcmTaxPayable,
          count: invoices.length,
        });
        setStatusMessage({
          type: 'info',
          text: `Parsed ${invoices.length} invoices: Purchases ₹${agg.totalPurchases.toLocaleString('en-IN')}, RCM Taxable ₹${agg.rcmTaxableValue.toLocaleString('en-IN')}`
        });
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: `Failed to parse JSON file: ${err.message}` });
        setParsedInvoices([]);
        setParsedSummary(null);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveInvoices = async (invoicesToSave: IngestedInvoice[]) => {
    if (!targetClient) {
      setStatusMessage({ type: 'error', text: 'Please select a client.' });
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage(null);

      const agg = aggregateGSTR2AInwardInvoices(invoicesToSave);

      if (isGuest) {
        // Save to browser cache in Guest Mode
        saveGuestInvoices(targetClient.id, selectedFy, selectedQuarter, invoicesToSave.map((inv, idx) => ({
          id: `inv_${Date.now()}_${idx}`,
          clientId: targetClient.id,
          gstin: targetClient.gstin,
          financialYear: selectedFy,
          quarter: selectedQuarter,
          supplierGstin: inv.supplierGstin,
          supplierName: inv.supplierName || undefined,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          invoiceValue: inv.invoiceValue,
          taxableValue: inv.taxableValue,
          igst: inv.igst,
          cgst: inv.cgst,
          sgst: inv.sgst,
          cess: inv.cess,
          rate: inv.rate,
          isRcm: inv.isRcm,
          totalTax: inv.igst + inv.cgst + inv.sgst + inv.cess,
        })));

        // Update ledger row in cache
        const existingRows = getGuestLedger(selectedFy, selectedQuarter);
        const existing = existingRows.find(r => r.clientId === targetClient.id);
        const opStock = existing ? existing.openingStock : 0;
        const gp = existing ? existing.gpMargin : 10;
        const sales = existing ? existing.actualSales : 0;

        const computed = computeCompositionQuarter({
          openingStock: opStock,
          totalPurchases: agg.totalPurchases,
          rcmTaxableValue: agg.rcmTaxableValue,
          rcmTaxPayable: agg.rcmTaxPayable,
          gpMarginPercent: gp,
          salesMode: existing ? existing.salesMode : 'ACTUAL',
          actualSales: sales,
        });

        saveGuestLedgerRow({
          id: existing?.id || `guest_row_${targetClient.id}_${selectedFy}_${selectedQuarter}`,
          clientId: targetClient.id,
          clientCode: targetClient.clientCode,
          clientName: targetClient.clientName,
          gstin: targetClient.gstin,
          financialYear: selectedFy,
          quarter: selectedQuarter,
          openingStock: opStock,
          prevQuarterClosingStock: existing?.prevQuarterClosingStock || null,
          totalPurchases: agg.totalPurchases,
          rcmTaxableValue: agg.rcmTaxableValue,
          rcmTaxPayable: agg.rcmTaxPayable,
          gpMargin: gp,
          salesMode: existing?.salesMode || 'ACTUAL',
          actualSales: sales,
          taxRateOnSales: 1.0,
          taxPayableOnSales: computed.taxPayableOnSales,
          totalCmp08Tax: computed.totalCmp08Tax,
          closingStock: computed.closingStock,
          status: 'DRAFT',
          inwardInvoiceCount: invoicesToSave.length,
        });

        setStatusMessage({
          type: 'success',
          text: `Saved ${invoicesToSave.length} invoices to ledger for ${targetClient.clientName}.`
        });
        setTimeout(() => {
          triggerSuccess();
          onClose();
        }, 1200);
      } else {
        // Authenticated Mode: POST to server
        const res = await fetch('/api/composition/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: targetClient.id,
            clientCode: targetClient.clientCode,
            clientName: targetClient.clientName,
            gstin: targetClient.gstin,
            financialYear: selectedFy,
            quarter: selectedQuarter,
            invoices: invoicesToSave,
            source: 'GSTR2A_IMPORT',
          })
        });

        if (res.ok) {
          setStatusMessage({
            type: 'success',
            text: `Imported ${invoicesToSave.length} invoices successfully for ${targetClient.clientName}.`
          });
          setTimeout(() => {
            triggerSuccess();
            onClose();
          }, 1200);
        } else {
          const err = await res.json().catch(() => ({}));
          setStatusMessage({ type: 'error', text: err.error || 'Failed to save invoices to server.' });
        }
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message || 'Error saving invoices' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClient) {
      setStatusMessage({ type: 'error', text: 'Please select a client.' });
      return;
    }

    const purchasesNum = parseFloat(manualPurchases) || 0;
    const rcmTaxableNum = parseFloat(manualRcmTaxable) || 0;
    const rcmTaxNum = parseFloat(manualRcmTax) || 0;

    if (purchasesNum <= 0 && rcmTaxableNum <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter purchase amount or RCM taxable value.' });
      return;
    }

    // Build real invoices from manual input
    const invoices: IngestedInvoice[] = [];
    if (purchasesNum > 0) {
      invoices.push({
        supplierGstin: 'INWARD_SUPPLIES',
        supplierName: 'Inward Purchases (Quarterly Aggregate)',
        invoiceNumber: `PUR-${selectedQuarter}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceValue: purchasesNum,
        taxableValue: Math.round(purchasesNum * 0.85 * 100) / 100,
        cgst: Math.round(purchasesNum * 0.075 * 100) / 100,
        sgst: Math.round(purchasesNum * 0.075 * 100) / 100,
        igst: 0,
        cess: 0,
        rate: 18,
        isRcm: false,
      });
    }

    if (rcmTaxableNum > 0) {
      invoices.push({
        supplierGstin: 'RCM_SUPPLIES',
        supplierName: 'Reverse Charge Purchases (Sec 9(3)/9(4))',
        invoiceNumber: `RCM-${selectedQuarter}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceValue: rcmTaxableNum + rcmTaxNum,
        taxableValue: rcmTaxableNum,
        cgst: Math.round((rcmTaxNum / 2) * 100) / 100,
        sgst: Math.round((rcmTaxNum / 2) * 100) / 100,
        igst: 0,
        cess: 0,
        rate: 5,
        isRcm: true,
      });
    }

    await handleSaveInvoices(invoices);
  };

  const handleFetchCompanion = async () => {
    if (!targetClient) {
      setStatusMessage({ type: 'error', text: 'Please select a client.' });
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage(null);

      // Attempt live fetch from companion localhost:9090
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      try {
        const compRes = await fetch(`http://localhost:9090/api/gstr2a?gstin=${encodeURIComponent(targetClient.gstin)}&fy=${encodeURIComponent(selectedFy)}&quarter=${encodeURIComponent(selectedQuarter)}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (compRes.ok) {
          const compData = await compRes.json();
          if (Array.isArray(compData.invoices) && compData.invoices.length > 0) {
            await handleSaveInvoices(compData.invoices);
            return;
          }
        }
      } catch {
        // Companion offline or returned no invoices
      }

      setStatusMessage({
        type: 'error',
        text: 'Companion service is offline on localhost:9090 or no invoices found on the portal. Please upload your GSTR-2A JSON file directly or use Manual Entry.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Import GSTR-2A Data
            </h2>
            <p className="text-xs text-gray-500">
              {selectedQuarter} &bull; FY {selectedFy}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 bg-gray-50/50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('FILE_UPLOAD')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'FILE_UPLOAD'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            GSTR-2A JSON File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MANUAL_ENTRY')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'MANUAL_ENTRY'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Manual Entry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('AUTO_COMPANION')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'AUTO_COMPANION'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Portal Companion
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Client Selector */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Select Client
            </label>
            <select
              value={selectedClientId || targetClient?.id || ''}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              {allClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.clientCode} — {c.clientName} ({c.gstin || 'No GSTIN'})
                </option>
              ))}
            </select>
          </div>

          {/* Tab 1: File Upload */}
          {activeTab === 'FILE_UPLOAD' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors">
                <input
                  type="file"
                  id="gstr2a-file"
                  accept=".json"
                  onChange={handleJsonFileUpload}
                  className="hidden"
                />
                <label htmlFor="gstr2a-file" className="cursor-pointer block space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-gray-800">
                    {uploadedFileName ? uploadedFileName : 'Click to select GSTR-2A JSON file'}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Official .json file downloaded from GST Common Portal
                  </p>
                </label>
              </div>

              {parsedSummary && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoices Detected:</span>
                    <strong className="text-gray-900">{parsedSummary.count}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Purchases (incl. Tax):</span>
                    <strong className="text-gray-900 font-mono">₹{parsedSummary.totalPurchases.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">RCM Taxable Value:</span>
                    <strong className="text-gray-900 font-mono">₹{parsedSummary.rcmTaxableValue.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">RCM Tax Payable:</span>
                    <strong className="text-amber-700 font-mono">₹{parsedSummary.rcmTaxPayable.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              )}

              {parsedInvoices.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleSaveInvoices(parsedInvoices)}
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Importing Invoices...' : `Import ${parsedInvoices.length} Invoices to Ledger`}
                </button>
              )}
            </div>
          )}

          {/* Tab 2: Manual Entry */}
          {activeTab === 'MANUAL_ENTRY' && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">
                  Inward Purchases (₹) <span className="text-gray-400">(incl. tax, excl. RCM)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={manualPurchases}
                  onChange={(e) => setManualPurchases(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">
                    RCM Taxable Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0"
                    value={manualRcmTaxable}
                    onChange={(e) => setManualRcmTaxable(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">
                    GST in RCM (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="0"
                    value={manualRcmTax}
                    onChange={(e) => setManualRcmTax(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50 mt-2"
              >
                {isProcessing ? 'Updating Ledger...' : 'Save Values to Ledger'}
              </button>
            </form>
          )}

          {/* Tab 3: Portal Companion */}
          {activeTab === 'AUTO_COMPANION' && (
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Client GSTIN:</span>
                  <span className="font-mono font-semibold text-gray-900">{targetClient?.gstin || '---'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Period:</span>
                  <span className="font-semibold text-gray-900">{selectedQuarter} &bull; {selectedFy}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFetchCompanion}
                disabled={isProcessing}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Companion...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-4 h-4" />
                    <span>Fetch GSTR-2A via Desktop Companion</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 border ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : statusMessage.type === 'info'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
