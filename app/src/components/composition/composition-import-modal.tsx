'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Check, 
  AlertCircle, 
  Loader2, 
  FileSpreadsheet, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useGSTClients, GSTClient } from '@/lib/use-gst-clients';
import { 
  parseGSTR4AExcel, 
  parseGSTR4AJson, 
  aggregateGSTR4AInwardInvoices, 
  IngestedInvoice, 
  computeCompositionQuarter 
} from '@/lib/composition-calculator';
import { 
  getGuestClients, 
  saveGuestInvoices, 
  saveGuestLedgerRow, 
  getGuestLedger 
} from '@/lib/composition-guest-storage';
import { triggerGSTR4AImport } from '@/lib/companion-client';

interface CompositionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients?: GSTClient[];
  selectedQuarter?: string;
  selectedFy?: string;
  onImportSuccess?: () => void;
}

export function CompositionImportModal({
  isOpen,
  onClose,
  clients: passedClients,
  selectedQuarter = 'Q2',
  selectedFy = '2026-27',
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
      const guestList = getGuestClients();
      setAllClients(guestList.map(g => ({
        id: g.id,
        code: g.clientCode || (g.gstin ? g.gstin.substring(2, 6) : g.clientName.substring(0, 4).toUpperCase()),
        clientCode: g.clientCode || (g.gstin ? g.gstin.substring(2, 6) : g.clientName.substring(0, 4).toUpperCase()),
        name: g.clientName,
        clientName: g.clientName,
        gstin: g.gstin,
        stateCode: g.stateCode || '',
        portalUsername: g.portalUsername,
        portalPassword: g.portalPassword,
      } as any)));
    }
  }, [passedClients, hookClients, staffInfo, isOpen]);

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'EXCEL_UPLOAD' | 'MANUAL_ENTRY' | 'AUTO_COMPANION'>('AUTO_COMPANION');
  const [isProcessing, setIsProcessing] = useState(false);
  const [companionStep, setCompanionStep] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // File Upload State
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [parsedInvoices, setParsedInvoices] = useState<IngestedInvoice[]>([]);
  const [parsedSummary, setParsedSummary] = useState<{ totalPurchases: number; rcmTaxableValue: number; rcmTaxPayable: number; count: number } | null>(null);

  // Manual values
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
      setCompanionStep(0);
      if (allClients.length > 0 && !selectedClientId) {
        setSelectedClientId(allClients[0].id);
      }
    }
  }, [isOpen, allClients]);

  if (!isOpen) return null;

  const targetClient = allClients.find(c => c.id === selectedClientId) || allClients[0];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage(null);
    setUploadedFileName(file.name);

    try {
      const fileName = file.name.toLowerCase();
      let invoices: IngestedInvoice[] = [];

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        invoices = parseGSTR4AExcel(buffer);
      } else if (fileName.endsWith('.json')) {
        const text = await file.text();
        const json = JSON.parse(text);
        invoices = parseGSTR4AJson(json);
      } else {
        setStatusMessage({ type: 'error', text: 'Please upload a GSTR-4A Excel file (.xlsx / .xls) or JSON file.' });
        return;
      }

      if (invoices.length === 0) {
        setStatusMessage({ 
          type: 'error', 
          text: 'No inward invoices found in the uploaded GSTR-4A file. Ensure the sheet has B2B inward supplies data.' 
        });
        setParsedInvoices([]);
        setParsedSummary(null);
        return;
      }

      setParsedInvoices(invoices);
      const summary = aggregateGSTR4AInwardInvoices(invoices);
      setParsedSummary({
        totalPurchases: summary.totalPurchases,
        rcmTaxableValue: summary.rcmTaxableValue,
        rcmTaxPayable: summary.rcmTaxPayable,
        count: summary.invoiceCount
      });
      setStatusMessage({
        type: 'success',
        text: `Parsed ${invoices.length} inward invoices successfully from ${file.name}.`
      });
    } catch (err: any) {
      console.error('Error parsing GSTR-4A file:', err);
      setStatusMessage({ type: 'error', text: `Failed to parse file: ${err.message || 'Invalid format'}` });
      setParsedInvoices([]);
      setParsedSummary(null);
    }
  };

  const handleSaveInvoices = async (invoicesToSave: IngestedInvoice[]) => {
    if (!targetClient) {
      setStatusMessage({ type: 'error', text: 'Please select a client.' });
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage(null);

      const summary = aggregateGSTR4AInwardInvoices(invoicesToSave);

      if (isGuest) {
        // Guest mode: save strictly to localStorage cache
        saveGuestInvoices(
          targetClient.id,
          selectedFy,
          selectedQuarter,
          invoicesToSave.map(inv => ({
            id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            clientId: targetClient.id,
            gstin: targetClient.gstin || '',
            financialYear: selectedFy,
            quarter: selectedQuarter,
            supplierGstin: inv.supplierGstin,
            supplierName: inv.supplierName,
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
            totalTax: (inv.igst || 0) + (inv.cgst || 0) + (inv.sgst || 0) + (inv.cess || 0),
          }))
        );

        // Update corresponding ledger row in guest localStorage
        const existingRows = getGuestLedger(selectedFy, selectedQuarter);
        const existingRow = existingRows.find(r => r.clientId === targetClient.id);

        const openingStock = existingRow ? existingRow.openingStock : 0;
        const gpMargin = existingRow ? existingRow.gpMargin : 10;
        const actualSales = existingRow ? existingRow.actualSales : 0;
        const salesMode = existingRow ? existingRow.salesMode : 'ACTUAL';

        const computed = computeCompositionQuarter({
          openingStock,
          totalPurchases: summary.totalPurchases,
          rcmTaxableValue: summary.rcmTaxableValue,
          rcmTaxPayable: summary.rcmTaxPayable,
          gpMarginPercent: gpMargin,
          salesMode,
          actualSales,
        });

        saveGuestLedgerRow({
          id: existingRow ? existingRow.id : `guest_row_${targetClient.id}_${selectedFy}_${selectedQuarter}`,
          clientId: targetClient.id,
          clientCode: targetClient.clientCode || targetClient.code || '',
          clientName: targetClient.clientName || targetClient.name,
          gstin: targetClient.gstin || '',
          financialYear: selectedFy,
          quarter: selectedQuarter,
          openingStock,
          prevQuarterClosingStock: existingRow ? existingRow.prevQuarterClosingStock : null,
          totalPurchases: summary.totalPurchases,
          rcmTaxableValue: summary.rcmTaxableValue,
          rcmTaxPayable: summary.rcmTaxPayable,
          gpMargin,
          salesMode,
          actualSales,
          taxRateOnSales: existingRow ? existingRow.taxRateOnSales : 1.0,
          taxPayableOnSales: computed.taxPayableOnSales,
          totalCmp08Tax: computed.totalCmp08Tax,
          closingStock: computed.closingStock,
          status: 'IMPORTED',
          inwardInvoiceCount: invoicesToSave.length,
        });
      } else {
        // Authenticated mode: send to API
        const payload = {
          clientId: targetClient.id,
          financialYear: selectedFy,
          quarter: selectedQuarter,
          invoices: invoicesToSave,
        };

        const res = await fetch('/api/composition/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to save inward supplies');
        }
      }

      setStatusMessage({
        type: 'success',
        text: `Successfully imported ${invoicesToSave.length} invoices into ${targetClient.clientName}'s ${selectedQuarter} working paper!`
      });

      if (onImportSuccess) onImportSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error saving inward supplies:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Error saving inward supplies' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveManual = async () => {
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

    const invoices: IngestedInvoice[] = [];
    if (purchasesNum > 0) {
      invoices.push({
        supplierGstin: 'INWARD_SUPPLIES',
        supplierName: 'Inward Purchases (Aggregate)',
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

  const handleCompanionAutoImport = async () => {
    if (!targetClient) {
      setStatusMessage({ type: 'error', text: 'Please select a client.' });
      return;
    }

    const username = (targetClient as any).portalUsername || targetClient.gstin;
    const password = (targetClient as any).portalPassword || '';

    if (!username || !password) {
      setStatusMessage({ 
        type: 'error', 
        text: 'Portal User ID and Password are required. Please enter or edit them via Add Client.' 
      });
      return;
    }

    try {
      setIsProcessing(true);
      setCompanionStep(1);
      setStatusMessage({ 
        type: 'info', 
        text: 'Chrome/Edge opened on screen with credentials filled. Please type the CAPTCHA and submit on the GST portal window...' 
      });

      const res = await triggerGSTR4AImport({
        username,
        password,
        financialYear: selectedFy,
        quarter: selectedQuarter,
        gstin: targetClient.gstin,
      });

      if (res.success && res.invoices) {
        setCompanionStep(3);
        setStatusMessage({
          type: 'success',
          text: `GSTR-4A imported! Found ${res.invoices.length} invoices. Updating working paper...`
        });
        await handleSaveInvoices(res.invoices);
      } else {
        setCompanionStep(0);
        setStatusMessage({
          type: 'error',
          text: res.message || 'Auto-import could not complete. You can upload the GSTR-4A Excel directly or use Manual Entry.'
        });
      }
    } catch (err: any) {
      setCompanionStep(0);
      setStatusMessage({
        type: 'error',
        text: `Companion error: ${err.message || 'Failed to auto-import'}. Ensure Desktop Companion is running on localhost:9090.`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Import GSTR-4A Inward Supplies</h2>
            <p className="text-xs text-gray-500 mt-0.5">{selectedQuarter} &bull; FY {selectedFy}</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-gray-100 bg-gray-50 text-xs font-semibold px-5 pt-2">
          <button
            onClick={() => setActiveTab('AUTO_COMPANION')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'AUTO_COMPANION'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Companion Auto-Import</span>
          </button>
          <button
            onClick={() => setActiveTab('EXCEL_UPLOAD')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'EXCEL_UPLOAD'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx) Upload</span>
          </button>
          <button
            onClick={() => setActiveTab('MANUAL_ENTRY')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'MANUAL_ENTRY'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Manual Entry
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Target Client Dropdown */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Select Client</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-gray-50 font-medium"
            >
              {allClients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.clientName || c.name} {c.gstin ? `(${c.gstin})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3 rounded-xl border flex items-start space-x-2 ${
              statusMessage.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              {statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Loader2 className="w-4 h-4 text-blue-500 shrink-0 animate-spin mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: Companion Auto-Import (Login -> User enters CAPTCHA -> Auto-Download GSTR-4A -> Parse) */}
          {activeTab === 'AUTO_COMPANION' && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div className="text-xs text-gray-600 leading-relaxed space-y-1.5">
                <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Automated Portal Login &amp; GSTR-4A Import</span>
                </p>
                <p>
                  Companion will launch a visible browser window with <strong>{targetClient?.clientName}</strong>&apos;s credentials filled.
                </p>
                <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-2 mt-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">1</span>
                    <span>Browser launches with Portal User ID &amp; Password filled.</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-900 font-semibold">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">2</span>
                    <span>You only enter the CAPTCHA and submit on screen.</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">3</span>
                    <span>Companion navigates to Returns Dashboard, downloads GSTR-4A, and auto-fills your working paper.</span>
                  </div>
                </div>
              </div>

              {isProcessing && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center space-x-3 text-emerald-900">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <div className="font-semibold">Companion Active</div>
                    <div className="text-emerald-700 text-[11px] mt-0.5">
                      {companionStep === 1 
                        ? 'GST Portal open on screen. Please enter the CAPTCHA and submit...' 
                        : 'Importing GSTR-4A inward supplies from portal...'}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleCompanionAutoImport}
                disabled={isProcessing}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 shadow-xs"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Waiting for CAPTCHA &amp; GSTR-4A Import...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Import GSTR-4A via Companion (Solve CAPTCHA only)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: GSTR-4A Excel (.xlsx) / JSON File Upload */}
          {activeTab === 'EXCEL_UPLOAD' && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-emerald-500 bg-gray-50/50 transition-colors">
                <input
                  type="file"
                  id="gstr4a-file"
                  accept=".xlsx,.xls,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="gstr4a-file" className="cursor-pointer flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-2 text-emerald-700">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-gray-800 text-xs">
                    {uploadedFileName ? uploadedFileName : 'Upload GSTR-4A Excel (.xlsx) file'}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-1">
                    Direct export from GST Common Portal &bull; B2B &amp; B2BA sheets supported
                  </span>
                </label>
              </div>

              {parsedSummary && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-700 pb-2 border-b border-gray-200">
                    <span>Parsed Summary ({parsedSummary.count} Invoices)</span>
                    <span className="text-emerald-700">Ready to Import</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Purchases (incl Tax)</div>
                      <div className="font-bold text-gray-900 mt-0.5">{formatCurrency(parsedSummary.totalPurchases)}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">RCM Taxable</div>
                      <div className="font-bold text-gray-900 mt-0.5">{formatCurrency(parsedSummary.rcmTaxableValue)}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">GST on RCM</div>
                      <div className="font-bold text-emerald-700 mt-0.5">{formatCurrency(parsedSummary.rcmTaxPayable)}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveInvoices(parsedInvoices)}
                    disabled={isProcessing}
                    className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Apply to Working Paper</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Manual Aggregate Entry */}
          {activeTab === 'MANUAL_ENTRY' && (
            <div className="space-y-3">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Total Purchases (₹) <span className="text-gray-400 font-normal">(Inclusive of Tax, Excl. RCM)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={manualPurchases}
                  onChange={(e) => setManualPurchases(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono text-right bg-gray-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">RCM Taxable Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={manualRcmTaxable}
                    onChange={(e) => setManualRcmTaxable(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono text-right bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">GST to be Paid in RCM (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={manualRcmTax}
                    onChange={(e) => setManualRcmTax(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono text-right bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveManual}
                disabled={isProcessing}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Inward Purchases</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
