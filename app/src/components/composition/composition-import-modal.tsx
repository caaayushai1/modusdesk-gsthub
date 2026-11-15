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
  ArrowRight,
  AlertTriangle,
  Layers,
  Calendar,
  Building
} from 'lucide-react';
import { 
  parseGSTR4AExcel, 
  parseGSTR4AJson, 
  aggregateGSTR4AInwardInvoices, 
  detectInvoicesQuarterBreakdown,
  QuarterInvoicesSummary,
  IngestedInvoice, 
  computeCompositionQuarter 
} from '@/lib/composition-calculator';
import { 
  getGuestClients, 
  saveGuestInvoices, 
  saveGuestLedgerRow, 
  getGuestLedger,
  GuestClient
} from '@/lib/composition-guest-storage';
import { triggerGSTR4AImport } from '@/lib/companion-client';

interface CompositionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedQuarter?: string;
  selectedFy?: string;
  onImportSuccess?: () => void;
}

export function CompositionImportModal({
  isOpen,
  onClose,
  selectedQuarter = 'Q2',
  selectedFy = '2026-27',
  onImportSuccess,
}: CompositionImportModalProps) {
  // 1. Client selection: Show ONLY added clients per user instruction
  const [addedClients, setAddedClients] = useState<GuestClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // 2. Period Selection: FY & Quarter (including Multi-Quarter)
  const [targetFy, setTargetFy] = useState(selectedFy);
  const [targetQuarter, setTargetQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'MULTI'>('Q2');
  const [selectedMultiQuarters, setSelectedMultiQuarters] = useState<string[]>(['Q1', 'Q2', 'Q3', 'Q4']);

  // 3. Method Selection: COMPANION | EXCEL | MANUAL
  const [method, setMethod] = useState<'COMPANION' | 'EXCEL' | 'MANUAL'>('EXCEL');

  // Status & processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [companionStep, setCompanionStep] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // File Upload State
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [parsedInvoices, setParsedInvoices] = useState<IngestedInvoice[]>([]);
  const [quarterAnalysis, setQuarterAnalysis] = useState<{
    breakdown: Record<string, QuarterInvoicesSummary>;
    dominantQuarter: string | null;
    detectedQuarters: string[];
  } | null>(null);
  const [mismatchWarning, setMismatchWarning] = useState<string | null>(null);

  // Manual values: Single vs Multi
  const [manualPurchases, setManualPurchases] = useState('');
  const [manualRcmTaxable, setManualRcmTaxable] = useState('');
  const [manualRcmTax, setManualRcmTax] = useState('');

  // Multi-quarter manual values
  const [multiManual, setMultiManual] = useState<Record<string, { purchases: string; rcmTaxable: string; rcmTax: string }>>({
    Q1: { purchases: '', rcmTaxable: '', rcmTax: '' },
    Q2: { purchases: '', rcmTaxable: '', rcmTax: '' },
    Q3: { purchases: '', rcmTaxable: '', rcmTax: '' },
    Q4: { purchases: '', rcmTaxable: '', rcmTax: '' },
  });

  // Load added clients on open
  useEffect(() => {
    if (isOpen) {
      const clients = getGuestClients();
      setAddedClients(clients);
      if (clients.length > 0) {
        setSelectedClientId(clients[0].id);
      }
      setTargetFy(selectedFy);
      setTargetQuarter(selectedQuarter === 'ANNUAL' ? 'MULTI' : (selectedQuarter as any) || 'Q2');
      setStatusMessage(null);
      setUploadedFileName(null);
      setParsedInvoices([]);
      setQuarterAnalysis(null);
      setMismatchWarning(null);
      setManualPurchases('');
      setManualRcmTaxable('');
      setManualRcmTax('');
      setCompanionStep(0);
    }
  }, [isOpen, selectedQuarter, selectedFy]);

  if (!isOpen) return null;

  const targetClient = addedClients.find(c => c.id === selectedClientId) || addedClients[0];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Handle Excel or JSON file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage(null);
    setMismatchWarning(null);
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
        setStatusMessage({ type: 'error', text: 'Please upload a GSTR-4A Excel (.xlsx / .xls) or JSON file.' });
        return;
      }

      if (invoices.length === 0) {
        setStatusMessage({ 
          type: 'error', 
          text: 'No inward invoices found. Ensure the Excel file contains B2B inward supplies data.' 
        });
        setParsedInvoices([]);
        setQuarterAnalysis(null);
        return;
      }

      setParsedInvoices(invoices);

      // Perform Quarter Validation
      const analysis = detectInvoicesQuarterBreakdown(invoices);
      setQuarterAnalysis(analysis);

      // Check if selected quarter matches detected invoices
      if (targetQuarter !== 'MULTI') {
        if (analysis.dominantQuarter && analysis.dominantQuarter !== targetQuarter) {
          setMismatchWarning(
            `Quarter Mismatch: The uploaded file has ${analysis.breakdown[analysis.dominantQuarter].count} invoices dated for ${analysis.dominantQuarter}, but you have selected ${targetQuarter}.`
          );
        }
      }

      setStatusMessage({
        type: 'success',
        text: `Successfully parsed ${invoices.length} inward invoices from ${file.name}.`
      });
    } catch (err: any) {
      console.error('Error parsing file:', err);
      setStatusMessage({ type: 'error', text: `Failed to parse file: ${err.message || 'Invalid format'}` });
      setParsedInvoices([]);
      setQuarterAnalysis(null);
    }
  };

  // Helper to persist inward invoices and update local ledger row
  const saveQuarterInward = (clientId: string, fy: string, q: string, inwardInvoices: IngestedInvoice[], totalPurchases: number, rcmTaxable: number, rcmTax: number) => {
    saveGuestInvoices(
      clientId,
      fy,
      q,
      inwardInvoices.map(inv => ({
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        clientId,
        gstin: targetClient?.gstin || '',
        financialYear: fy,
        quarter: q,
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

    const existingRows = getGuestLedger(fy, q);
    const existingRow = existingRows.find(r => r.clientId === clientId);

    const openingStock = existingRow ? existingRow.openingStock : 0;
    const gpMargin = existingRow ? existingRow.gpMargin : 10;
    const actualSales = existingRow ? existingRow.actualSales : 0;
    const salesMode = existingRow ? existingRow.salesMode : 'ACTUAL';

    const computed = computeCompositionQuarter({
      openingStock,
      totalPurchases,
      rcmTaxableValue: rcmTaxable,
      rcmTaxPayable: rcmTax,
      gpMarginPercent: gpMargin,
      salesMode,
      actualSales,
    });

    saveGuestLedgerRow({
      id: existingRow ? existingRow.id : `guest_row_${clientId}_${fy}_${q}`,
      clientId,
      clientCode: targetClient?.clientCode || '',
      clientName: targetClient?.clientName || 'Client',
      gstin: targetClient?.gstin || '',
      financialYear: fy,
      quarter: q,
      openingStock,
      prevQuarterClosingStock: existingRow ? existingRow.prevQuarterClosingStock : null,
      totalPurchases,
      rcmTaxableValue: rcmTaxable,
      rcmTaxPayable: rcmTax,
      gpMargin,
      salesMode,
      actualSales,
      taxRateOnSales: existingRow ? existingRow.taxRateOnSales : 1.0,
      taxPayableOnSales: computed.taxPayableOnSales,
      totalCmp08Tax: computed.totalCmp08Tax,
      closingStock: computed.closingStock,
      status: 'IMPORTED',
      inwardInvoiceCount: inwardInvoices.length,
    });
  };

  // Apply parsed Excel data to working paper
  const handleApplyExcel = () => {
    if (!targetClient) {
      setStatusMessage({ type: 'error', text: 'Please select a client.' });
      return;
    }

    if (!quarterAnalysis || parsedInvoices.length === 0) {
      setStatusMessage({ type: 'error', text: 'No parsed invoices to apply.' });
      return;
    }

    try {
      setIsProcessing(true);

      if (targetQuarter === 'MULTI') {
        // Multi-Quarter: Apply each quarter's invoices to its respective ledger row
        let totalApplied = 0;
        ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
          if (selectedMultiQuarters.includes(q)) {
            const qData = quarterAnalysis.breakdown[q];
            if (qData && qData.invoices.length > 0) {
              saveQuarterInward(
                targetClient.id,
                targetFy,
                q,
                qData.invoices,
                qData.totalPurchases,
                qData.rcmTaxable,
                qData.rcmTax
              );
              totalApplied += qData.invoices.length;
            }
          }
        });

        setStatusMessage({
          type: 'success',
          text: `Applied ${totalApplied} invoices across selected quarters for ${targetClient.clientName}!`
        });
      } else {
        // Single Quarter
        const summary = aggregateGSTR4AInwardInvoices(parsedInvoices);
        saveQuarterInward(
          targetClient.id,
          targetFy,
          targetQuarter,
          parsedInvoices,
          summary.totalPurchases,
          summary.rcmTaxableValue,
          summary.rcmTaxPayable
        );

        setStatusMessage({
          type: 'success',
          text: `Successfully imported ${parsedInvoices.length} invoices into ${targetQuarter} FY ${targetFy}!`
        });
      }

      if (onImportSuccess) onImportSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error saving inward supplies.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Manual Entry Save
  const handleSaveManual = () => {
    if (!targetClient) {
      setStatusMessage({ type: 'error', text: 'Please select a client.' });
      return;
    }

    try {
      setIsProcessing(true);

      if (targetQuarter === 'MULTI') {
        ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
          if (selectedMultiQuarters.includes(q)) {
            const p = parseFloat(multiManual[q].purchases) || 0;
            const rt = parseFloat(multiManual[q].rcmTaxable) || 0;
            const rx = parseFloat(multiManual[q].rcmTax) || 0;
            if (p > 0 || rt > 0) {
              const invoices: IngestedInvoice[] = [
                {
                  supplierGstin: 'INWARD_AGGREGATE',
                  supplierName: 'Inward Purchases',
                  invoiceNumber: `PUR-${q}`,
                  invoiceDate: new Date().toISOString().split('T')[0],
                  invoiceValue: p,
                  taxableValue: Math.round(p * 0.85 * 100) / 100,
                  cgst: Math.round(p * 0.075 * 100) / 100,
                  sgst: Math.round(p * 0.075 * 100) / 100,
                  igst: 0,
                  cess: 0,
                  rate: 18,
                  isRcm: false,
                }
              ];
              saveQuarterInward(targetClient.id, targetFy, q, invoices, p, rt, rx);
            }
          }
        });
      } else {
        const purchasesNum = parseFloat(manualPurchases) || 0;
        const rcmTaxableNum = parseFloat(manualRcmTaxable) || 0;
        const rcmTaxNum = parseFloat(manualRcmTax) || 0;

        if (purchasesNum <= 0 && rcmTaxableNum <= 0) {
          setStatusMessage({ type: 'error', text: 'Please enter purchase amount or RCM taxable value.' });
          setIsProcessing(false);
          return;
        }

        const invoices: IngestedInvoice[] = [
          {
            supplierGstin: 'INWARD_AGGREGATE',
            supplierName: 'Inward Purchases (Manual)',
            invoiceNumber: `PUR-${targetQuarter}`,
            invoiceDate: new Date().toISOString().split('T')[0],
            invoiceValue: purchasesNum,
            taxableValue: Math.round(purchasesNum * 0.85 * 100) / 100,
            cgst: Math.round(purchasesNum * 0.075 * 100) / 100,
            sgst: Math.round(purchasesNum * 0.075 * 100) / 100,
            igst: 0,
            cess: 0,
            rate: 18,
            isRcm: false,
          }
        ];

        saveQuarterInward(
          targetClient.id,
          targetFy,
          targetQuarter,
          invoices,
          purchasesNum,
          rcmTaxableNum,
          rcmTaxNum
        );
      }

      setStatusMessage({
        type: 'success',
        text: `Inward purchases saved successfully for ${targetClient.clientName}!`
      });

      if (onImportSuccess) onImportSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error saving manual purchases.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Companion Auto-Import
  const handleCompanionAutoImport = async () => {
    if (!targetClient) {
      setStatusMessage({ type: 'error', text: 'Please select a client.' });
      return;
    }

    const username = targetClient.portalUsername || targetClient.gstin;
    const password = targetClient.portalPassword;

    if (!username || !password) {
      setStatusMessage({
        type: 'error',
        text: 'Portal User ID & Password are required for Companion Auto-Import. Please edit the client to provide them.'
      });
      return;
    }

    try {
      setIsProcessing(true);
      setCompanionStep(1);
      setStatusMessage({
        type: 'info',
        text: 'Launching GST portal... Chrome will open and prompt for CAPTCHA.'
      });

      const quarterToImport = targetQuarter === 'MULTI' ? 'Q1' : targetQuarter;

      const res = await triggerGSTR4AImport({
        username,
        password,
        financialYear: targetFy,
        quarter: quarterToImport,
        gstin: targetClient.gstin,
      });

      if (!res.success) {
        throw new Error(res.error || res.message || 'Auto-import failed');
      }

      setCompanionStep(2);

      if (res.invoices && res.invoices.length > 0) {
        const summary = aggregateGSTR4AInwardInvoices(res.invoices);
        saveQuarterInward(
          targetClient.id,
          targetFy,
          quarterToImport,
          res.invoices,
          summary.totalPurchases,
          summary.rcmTaxableValue,
          summary.rcmTaxPayable
        );

        setStatusMessage({
          type: 'success',
          text: `Companion imported ${res.invoices.length} invoices successfully into ${targetClient.clientName}'s working paper!`
        });

        if (onImportSuccess) onImportSuccess();
        setTimeout(() => onClose(), 2000);
      } else {
        setStatusMessage({
          type: 'info',
          text: 'Companion completed navigation. If GSTR-4A was downloaded to your PC, please select the Excel Upload option to apply it.'
        });
      }
    } catch (err: any) {
      console.error('Companion error:', err);
      setStatusMessage({
        type: 'error',
        text: `Companion service offline or error: ${err.message}. Please upload Excel directly or ensure start-companion.bat is running.`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Import GSTR-4A</h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Step 1: Select Client (SHOWS ONLY ADDED CLIENTS) */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Select Client <span className="text-red-500">*</span>
            </label>
            {addedClients.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>No clients added yet. Please use &quot;+ Add Client&quot; to add a client first.</span>
              </div>
            ) : (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-gray-50 font-medium text-gray-900"
              >
                {addedClients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.clientName} {c.gstin ? `(${c.gstin})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Step 2: Year and Quarter Selection (including Multi-Quarter) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Financial Year */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Financial Year</label>
              <select
                value={targetFy}
                onChange={(e) => setTargetFy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-gray-50 font-medium"
              >
                <option value="2026-27">2026-27</option>
                <option value="2025-26">2025-26</option>
                <option value="2024-25">2024-25</option>
              </select>
            </div>

            {/* Quarter Selector */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Period / Quarter</label>
              <div className="flex bg-gray-100 p-0.5 rounded-xl space-x-0.5">
                {(['Q1', 'Q2', 'Q3', 'Q4', 'MULTI'] as const).map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setTargetQuarter(q);
                      setMismatchWarning(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg font-semibold text-[11px] transition-all ${
                      targetQuarter === q
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {q === 'MULTI' ? 'Multi-Qtr' : q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* If Multi-Quarter: Choose which quarters to include */}
          {targetQuarter === 'MULTI' && (
            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
              <span className="text-[11px] font-semibold text-gray-600">Select Quarters for Multi-Quarter Import:</span>
              <div className="flex items-center space-x-3 pt-1">
                {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                  <label key={q} className="flex items-center space-x-1.5 text-xs text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMultiQuarters.includes(q)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMultiQuarters(prev => [...prev, q]);
                        } else {
                          setSelectedMultiQuarters(prev => prev.filter(x => x !== q));
                        }
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{q}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Select Method */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1.5">Import Method</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('COMPANION')}
                className={`py-2 px-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                  method === 'COMPANION'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px]">Companion Auto</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('EXCEL')}
                className={`py-2 px-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                  method === 'EXCEL'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px]">Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('MANUAL')}
                className={`py-2 px-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                  method === 'MANUAL'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Building className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px]">Manual Entry</span>
              </button>
            </div>
          </div>

          {/* Status Alert Banner */}
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

          {/* Step 4: Method Specific Fields */}

          {/* METHOD 1: COMPANION AUTO-IMPORT */}
          {method === 'COMPANION' && (
            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div className="flex justify-between items-center text-xs py-1">
                <span className="text-gray-500">Portal User:</span>
                <span className="font-mono font-bold text-gray-800">
                  {targetClient?.portalUsername || targetClient?.gstin || 'Not configured'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-t border-gray-200/60">
                <span className="text-gray-500">Period:</span>
                <span className="font-semibold text-gray-800">
                  {targetQuarter === 'MULTI' ? selectedMultiQuarters.join(', ') : targetQuarter} &bull; FY {targetFy}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCompanionAutoImport}
                disabled={isProcessing || !targetClient?.portalPassword}
                className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{companionStep === 1 ? 'Enter CAPTCHA on Portal...' : 'Importing GSTR-4A...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Fetch GSTR-4A via Desktop Companion</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* METHOD 2: EXCEL UPLOAD */}
          {method === 'EXCEL' && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-5 text-center hover:border-emerald-500 bg-gray-50/50 transition-colors">
                <input
                  type="file"
                  id="gstr4a-file-upload"
                  accept=".xlsx,.xls,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="gstr4a-file-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center mb-1.5 text-emerald-700">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-gray-800 text-xs">
                    {uploadedFileName ? uploadedFileName : 'Upload GSTR-4A Excel (.xlsx) file'}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5">
                    Common Portal B2B / Inward supplies sheets supported
                  </span>
                </label>
              </div>

              {/* Quarter Mismatch Warning & Resolution (Point c) */}
              {mismatchWarning && quarterAnalysis?.dominantQuarter && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-start space-x-2 text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="font-medium text-xs leading-relaxed">{mismatchWarning}</span>
                  </div>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetQuarter(quarterAnalysis.dominantQuarter as any);
                        setMismatchWarning(null);
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-[11px] transition-colors"
                    >
                      Switch Quarter to {quarterAnalysis.dominantQuarter}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetQuarter('MULTI');
                        setMismatchWarning(null);
                      }}
                      className="px-2.5 py-1 bg-white border border-amber-300 text-amber-800 font-semibold rounded-lg text-[11px] hover:bg-amber-100 transition-colors"
                    >
                      Use Multi-Quarter
                    </button>
                  </div>
                </div>
              )}

              {/* Parsed Summary Table */}
              {quarterAnalysis && parsedInvoices.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-800 pb-1.5 border-b border-gray-200">
                    <span>Parsed {parsedInvoices.length} Inward Invoices</span>
                    <span className="text-emerald-700 font-bold">Ready to Import</span>
                  </div>

                  {targetQuarter === 'MULTI' ? (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-gray-500">Quarterly Breakdown:</div>
                      <div className="grid grid-cols-4 gap-1.5 text-center">
                        {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
                          const qData = quarterAnalysis.breakdown[q];
                          const isIncluded = selectedMultiQuarters.includes(q);
                          return (
                            <div 
                              key={q} 
                              className={`p-2 rounded-lg border text-xs ${
                                isIncluded && qData.count > 0 
                                  ? 'bg-white border-emerald-300 shadow-2xs' 
                                  : 'bg-gray-100/60 border-gray-200 opacity-60'
                              }`}
                            >
                              <div className="font-bold text-gray-800">{q}</div>
                              <div className="text-[10px] text-gray-500">{qData.count} inv</div>
                              <div className="font-semibold text-emerald-800 text-[11px] mt-0.5">
                                {formatCurrency(qData.totalPurchases)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 pt-0.5 text-center">
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Purchases (incl Tax)</div>
                        <div className="font-bold text-gray-900 mt-0.5">
                          {formatCurrency(quarterAnalysis.breakdown[targetQuarter]?.totalPurchases || 0)}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">RCM Taxable</div>
                        <div className="font-bold text-gray-900 mt-0.5">
                          {formatCurrency(quarterAnalysis.breakdown[targetQuarter]?.rcmTaxable || 0)}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">GST on RCM</div>
                        <div className="font-bold text-emerald-700 mt-0.5">
                          {formatCurrency(quarterAnalysis.breakdown[targetQuarter]?.rcmTax || 0)}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleApplyExcel}
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

          {/* METHOD 3: MANUAL ENTRY */}
          {method === 'MANUAL' && (
            <div className="space-y-3">
              {targetQuarter === 'MULTI' ? (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-gray-500">Enter Values for Selected Quarters:</div>
                  <div className="space-y-2">
                    {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
                      if (!selectedMultiQuarters.includes(q)) return null;
                      return (
                        <div key={q} className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
                          <span className="font-bold text-gray-800 text-xs">{q} (₹)</span>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <span className="text-[10px] text-gray-500 block mb-0.5">Purchases</span>
                              <input
                                type="number"
                                placeholder="0"
                                value={multiManual[q].purchases}
                                onChange={(e) => setMultiManual(prev => ({
                                  ...prev,
                                  [q]: { ...prev[q], purchases: e.target.value }
                                }))}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-right font-mono bg-white"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 block mb-0.5">RCM Taxable</span>
                              <input
                                type="number"
                                placeholder="0"
                                value={multiManual[q].rcmTaxable}
                                onChange={(e) => setMultiManual(prev => ({
                                  ...prev,
                                  [q]: { ...prev[q], rcmTaxable: e.target.value }
                                }))}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-right font-mono bg-white"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 block mb-0.5">GST in RCM</span>
                              <input
                                type="number"
                                placeholder="0"
                                value={multiManual[q].rcmTax}
                                onChange={(e) => setMultiManual(prev => ({
                                  ...prev,
                                  [q]: { ...prev[q], rcmTax: e.target.value }
                                }))}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-right font-mono bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">
                      Total Purchases (₹) <span className="text-gray-400 font-normal">(Incl. Tax, Excl. RCM)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={manualPurchases}
                      onChange={(e) => setManualPurchases(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl font-mono text-right bg-gray-50 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">RCM Taxable Value (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={manualRcmTaxable}
                        onChange={(e) => setManualRcmTaxable(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl font-mono text-right bg-gray-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">GST on RCM (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={manualRcmTax}
                        onChange={(e) => setManualRcmTax(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl font-mono text-right bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
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
