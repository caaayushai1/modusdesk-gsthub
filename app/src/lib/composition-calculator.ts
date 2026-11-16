/**
 * GST Composition Scheme Calculations Engine (Section 10 CGST Act & Form GST CMP-08)
 * 
 * Statutory Formulas:
 * 1. Composition dealers cannot claim ITC; taxes on purchases are capitalized into purchase cost.
 * 2. Inward supplies attracting Reverse Charge (Sec 9(3)/9(4) RCM) are declared in Table 4 of CMP-08
 *    and tax must be discharged in CASH.
 * 3. Closing Stock Formula:
 *    Closing Stock = Opening Stock + Total Purchases (incl. tax, excl. RCM) + (GP Margin * Sales) - Sales
 * 4. Derived Sales Formula (when target closing stock is specified):
 *    Sales = (Opening Stock + Total Purchases - Target Closing Stock) / (1 - GP Margin)
 */

import * as XLSX from 'xlsx';

export interface CompositionCalculationParams {
  openingStock: number;
  totalPurchases: number; // Inclusive of tax, excluding RCM
  rcmTaxableValue: number;
  rcmTaxPayable: number;
  gpMarginPercent: number; // e.g. 10.0 for 10%
  salesMode: 'ACTUAL' | 'DERIVED';
  actualSales?: number;
  targetClosingStock?: number;
  taxRatePercent?: number; // 1.0 (Traders/Mfg), 5.0 (Restaurant), 6.0 (Services)
}

export interface CompositionCalculationResult {
  openingStock: number;
  totalPurchases: number;
  rcmTaxableValue: number;
  rcmTaxPayable: number;
  gpMarginPercent: number;
  salesMode: 'ACTUAL' | 'DERIVED';
  sales: number;
  taxRatePercent: number;
  taxPayableOnSales: number;
  totalCmp08Tax: number;
  closingStock: number;
  costOfGoodsSold: number;
  grossProfitAmount: number;
}

export function computeCompositionQuarter(params: CompositionCalculationParams): CompositionCalculationResult {
  const openingStock = Math.max(0, Number(params.openingStock) || 0);
  const totalPurchases = Math.max(0, Number(params.totalPurchases) || 0);
  const rcmTaxableValue = Math.max(0, Number(params.rcmTaxableValue) || 0);
  const rcmTaxPayable = Math.max(0, Number(params.rcmTaxPayable) || 0);
  const gpMarginPercent = Number(params.gpMarginPercent) || 0;
  const gpMarginRatio = gpMarginPercent / 100;
  const taxRatePercent = Number(params.taxRatePercent) || 1.0; // default 1% (0.5% CGST + 0.5% SGST)

  let sales = 0;
  let closingStock = 0;

  if (params.salesMode === 'DERIVED') {
    const targetClosing = Math.max(0, Number(params.targetClosingStock) || 0);
    const divisor = 1 - gpMarginRatio;
    if (divisor > 0) {
      sales = Math.max(0, (openingStock + totalPurchases - targetClosing) / divisor);
    } else {
      sales = 0;
    }
    closingStock = targetClosing;
  } else {
    // Mode A: Actual Sales input
    sales = Math.max(0, Number(params.actualSales) || 0);
    // Closing Stock = Opening Stock + Total Purchases + (GP Margin * Sales) - Sales
    closingStock = openingStock + totalPurchases + (gpMarginRatio * sales) - sales;
    if (closingStock < 0) {
      closingStock = 0;
    }
  }

  // Round values to 2 decimal places standard for currency
  sales = Math.round(sales * 100) / 100;
  closingStock = Math.round(closingStock * 100) / 100;

  const grossProfitAmount = Math.round(sales * gpMarginRatio * 100) / 100;
  const costOfGoodsSold = Math.round((sales - grossProfitAmount) * 100) / 100;

  // Tax Payable on Sales: Turnover * rate%
  const taxPayableOnSales = Math.round(sales * (taxRatePercent / 100) * 100) / 100;

  // Total CMP-08 Tax = Tax on Sales + Tax on RCM
  const totalCmp08Tax = Math.round((taxPayableOnSales + rcmTaxPayable) * 100) / 100;

  return {
    openingStock,
    totalPurchases,
    rcmTaxableValue,
    rcmTaxPayable,
    gpMarginPercent,
    salesMode: params.salesMode,
    sales,
    taxRatePercent,
    taxPayableOnSales,
    totalCmp08Tax,
    closingStock,
    costOfGoodsSold,
    grossProfitAmount,
  };
}

/**
 * Ingested Inward Invoice for GSTR-4A
 */
export interface IngestedInvoice {
  supplierGstin: string;
  supplierName?: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  rate: number;
  isRcm: boolean;
  periodStr?: string;
  periodQuarter?: string;
  periodFy?: string;
  noteType?: 'C' | 'D' | 'INV';
}

/**
 * Parses GSTR-4A Period string (from Column A of official GST Portal Excel).
 * Format examples:
 * - "Jul-Sep 26" -> { quarter: 'Q2', fy: '2026-27', label: 'Jul-Sep 26' }
 * - "Apr-Jun 26" -> { quarter: 'Q1', fy: '2026-27', label: 'Apr-Jun 26' }
 * - "Oct-Dec 26" -> { quarter: 'Q3', fy: '2026-27', label: 'Oct-Dec 26' }
 * - "Jan-Mar 27" -> { quarter: 'Q4', fy: '2026-27', label: 'Jan-Mar 27' }
 * - "Jul-Sep 2026" -> { quarter: 'Q2', fy: '2026-27', label: 'Jul-Sep 2026' }
 */
export function parseGSTR4APeriodStr(periodStr: string | undefined): { quarter: string; fy?: string; label: string } | null {
  if (!periodStr) return null;
  const s = String(periodStr).trim();
  if (!s) return null;

  const lower = s.toLowerCase();
  
  let quarter: string | null = null;
  if (/apr|jun/i.test(lower)) quarter = 'Q1';
  else if (/jul|sep/i.test(lower)) quarter = 'Q2';
  else if (/oct|dec/i.test(lower)) quarter = 'Q3';
  else if (/jan|mar/i.test(lower)) quarter = 'Q4';

  // Extract year digits (e.g., '26' from 'Jul-Sep 26' or '2026' from 'Jul-Sep 2026')
  const yearMatch = s.match(/(20\d{2}|\b\d{2}\b)/);
  let fy: string | undefined = undefined;

  if (quarter && yearMatch) {
    const rawYear = parseInt(yearMatch[1], 10);
    const startYear = rawYear < 100 ? 2000 + rawYear : rawYear;
    if (quarter === 'Q4') {
      // Jan-Mar belongs to FY (startYear - 1)-(startYear short)
      const prevYear = startYear - 1;
      const endYearShort = String(startYear).slice(-2);
      fy = `${prevYear}-${endYearShort}`;
    } else {
      // Q1, Q2, Q3 belong to FY startYear-(startYear + 1 short)
      const nextYearShort = String(startYear + 1).slice(-2);
      fy = `${startYear}-${nextYearShort}`;
    }
  }

  // Fallback check for numeric MMYYYY format (e.g. 072026)
  if (!quarter) {
    const mmYyyy = s.match(/^(\d{2})[-/]?(\d{4})$/);
    if (mmYyyy) {
      const mm = parseInt(mmYyyy[1], 10);
      const yyyy = parseInt(mmYyyy[2], 10);
      if (mm >= 4 && mm <= 6) {
        quarter = 'Q1';
        fy = `${yyyy}-${String(yyyy + 1).slice(-2)}`;
      } else if (mm >= 7 && mm <= 9) {
        quarter = 'Q2';
        fy = `${yyyy}-${String(yyyy + 1).slice(-2)}`;
      } else if (mm >= 10 && mm <= 12) {
        quarter = 'Q3';
        fy = `${yyyy}-${String(yyyy + 1).slice(-2)}`;
      } else if (mm >= 1 && mm <= 3) {
        quarter = 'Q4';
        fy = `${yyyy - 1}-${String(yyyy).slice(-2)}`;
      }
    }
  }

  if (!quarter) return null;
  return { quarter, fy, label: s };
}

export function aggregateGSTR4AInwardInvoices(invoices: IngestedInvoice[]) {
  let totalPurchases = 0; // Regular inward supplies (Taxable + IGST + CGST + SGST + Cess)
  let rcmTaxableValue = 0;
  let rcmTaxPayable = 0;

  for (const inv of invoices) {
    const totalTax = (Number(inv.igst) || 0) + (Number(inv.cgst) || 0) + (Number(inv.sgst) || 0) + (Number(inv.cess) || 0);
    const taxable = Number(inv.taxableValue) || 0;

    if (inv.isRcm) {
      rcmTaxableValue += taxable;
      rcmTaxPayable += totalTax;
    } else {
      // Inward supply (inclusive of tax)
      totalPurchases += (taxable + totalTax);
    }
  }

  return {
    totalPurchases: Math.round(totalPurchases * 100) / 100,
    rcmTaxableValue: Math.round(rcmTaxableValue * 100) / 100,
    rcmTaxPayable: Math.round(rcmTaxPayable * 100) / 100,
    invoiceCount: invoices.length,
    rcmCount: invoices.filter(i => i.isRcm).length,
  };
}

// Backward compatibility alias
export const aggregateGSTR2AInwardInvoices = aggregateGSTR4AInwardInvoices;

/**
 * Parses official GST Common Portal GSTR-4A Excel (.xlsx / .xls) file.
 * Automatically scans sheets (B2B, B2BA, CDNR, CDNRA) and extracts invoice rows.
 * Reads Column A ('GSTR-4A period', e.g. 'Jul-Sep 26') to determine statutory quarter.
 */
export function parseGSTR4AExcel(data: ArrayBuffer): IngestedInvoice[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const result: IngestedInvoice[] = [];

  // Sheets to check: B2B, B2BA, CDNR, CDNRA, or any inward supply sheet
  const sheetNames = workbook.SheetNames;
  const targetSheets = sheetNames.filter(name => {
    const n = name.trim().toUpperCase();
    return (
      n === 'B2B' || 
      n === 'B2BA' || 
      n === 'CDNR' || 
      n === 'CDNRA' || 
      n.includes('B2B') || 
      n.includes('INWARD') || 
      n.includes('4A')
    );
  });

  const sheetsToProcess = targetSheets.length > 0 ? targetSheets : [sheetNames[0]];

  for (const sheetName of sheetsToProcess) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (rows.length < 2) continue;

    // Multi-row header detection:
    // In GSTR-4A, headers span rows 4-6 (e.g. Row 5: "GSTR-4A period", "GSTIN of supplier", "Invoice details"; Row 6: "Invoice number", "Invoice date", "Rate", "Taxable value").
    // Identify the header boundary and combine cell text per column index.
    let startRow = -1;
    const combinedColHeaders: Record<number, string> = {};

    for (let r = 0; r < Math.min(rows.length, 12); r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;
      const rowText = row.map(c => String(c).trim().toLowerCase()).join(' ');

      const isHeaderLike = 
        rowText.includes('gstin') || 
        rowText.includes('gstr-4a period') || 
        rowText.includes('period') || 
        rowText.includes('invoice') || 
        rowText.includes('taxable value') || 
        rowText.includes('rate') || 
        rowText.includes('reverse charge');

      if (isHeaderLike) {
        row.forEach((cellVal: any, colIdx: number) => {
          const val = String(cellVal).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          if (val) {
            combinedColHeaders[colIdx] = (combinedColHeaders[colIdx] || '') + ' ' + val;
          }
        });
        startRow = r + 1;
      }
    }

    if (startRow < 0) startRow = 1;

    // Helper to find column index matching keywords in combined headers
    const findCol = (...keywords: string[]): number => {
      for (const kw of keywords) {
        const cleanKw = kw.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const [colIdxStr, headerText] of Object.entries(combinedColHeaders)) {
          const colIdx = parseInt(colIdxStr, 10);
          if (headerText.includes(cleanKw) || cleanKw.includes(headerText)) {
            return colIdx;
          }
        }
      }
      return -1;
    };

    // Column A is standard GSTR-4A Period (Index 0 fallback)
    let periodCol = findCol('gstr4aperiod', 'returnperiod', 'period');
    if (periodCol === -1) {
      periodCol = 0;
    }

    const ctinCol = findCol('gstinofsupplier', 'suppliergstin', 'gstin', 'ctin');
    const nameCol = findCol('tradename', 'legalname', 'suppliername', 'name');
    const invNumCol = findCol('invoicenumber', 'invoiceno', 'notenumber', 'noteno', 'invno', 'inum');
    const invDateCol = findCol('invoicedate', 'notedate', 'invdate', 'dt', 'idt', 'date');
    const invValCol = findCol('invoicevalue', 'notevalue', 'invval', 'val', 'value');
    const rcmCol = findCol('reversecharge', 'supplyattractreversecharge', 'rchrg', 'rcm');
    const rateCol = findCol('rate', 'ratepercent', 'rt');
    const txvalCol = findCol('taxablevalue', 'taxableamt', 'txval');
    const igstCol = findCol('integratedtax', 'igst', 'iamt');
    const cgstCol = findCol('centraltax', 'cgst', 'camt');
    const sgstCol = findCol('statetax', 'stateuttax', 'sgst', 'utgst', 'samt');
    const cessCol = findCol('cess', 'csamt');
    const noteTypeCol = findCol('notetype', 'documenttype', 'doctype');

    for (let r = startRow; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const rawGstin = ctinCol >= 0 ? String(row[ctinCol] || '').trim() : '';
      const rawInvNum = invNumCol >= 0 ? String(row[invNumCol] || '').trim() : '';
      const rawPeriod = periodCol >= 0 ? String(row[periodCol] || '').trim() : String(row[0] || '').trim();

      // Skip empty, header-repeat, or total rows
      if (!rawGstin && !rawInvNum) continue;
      const fullRowText = row.map(c => String(c).toLowerCase()).join(' ');
      if (fullRowText.includes('total') || rawGstin.toLowerCase().includes('total') || rawInvNum.toLowerCase().includes('total')) {
        continue;
      }
      if (rawGstin.toLowerCase().includes('gstin') || rawInvNum.toLowerCase().includes('invoice number')) {
        continue;
      }

      // Parse Period from Column A (e.g. 'Jul-Sep 26' -> Q2, FY 2026-27)
      const periodInfo = parseGSTR4APeriodStr(rawPeriod);

      const supplierGstin = rawGstin || 'UNKNOWN_GSTIN';
      const supplierName = nameCol >= 0 ? String(row[nameCol] || '').trim() : undefined;
      const invoiceNumber = rawInvNum || `INV-${r}`;
      
      let invoiceDate = invDateCol >= 0 ? String(row[invDateCol] || '').trim() : '';
      if (!invoiceDate) {
        invoiceDate = new Date().toISOString().split('T')[0];
      }

      const invoiceValue = invValCol >= 0 ? Number(String(row[invValCol]).replace(/,/g, '')) || 0 : 0;
      const taxableValue = txvalCol >= 0 ? Number(String(row[txvalCol]).replace(/,/g, '')) || 0 : (invoiceValue * 0.85);
      const igst = igstCol >= 0 ? Number(String(row[igstCol]).replace(/,/g, '')) || 0 : 0;
      const cgst = cgstCol >= 0 ? Number(String(row[cgstCol]).replace(/,/g, '')) || 0 : 0;
      const sgst = sgstCol >= 0 ? Number(String(row[sgstCol]).replace(/,/g, '')) || 0 : 0;
      const cess = cessCol >= 0 ? Number(String(row[cessCol]).replace(/,/g, '')) || 0 : 0;
      const rate = rateCol >= 0 ? Number(String(row[rateCol]).replace(/[^0-9.]/g, '')) || 0 : 0;

      const rawRcm = rcmCol >= 0 ? String(row[rcmCol] || '').trim().toUpperCase() : 'N';
      const isRcm = rawRcm === 'Y' || rawRcm === 'YES' || rawRcm === 'TRUE';

      // Check if this is a Credit Note (in CDNR / CDNRA)
      const rawNoteType = noteTypeCol >= 0 ? String(row[noteTypeCol] || '').trim().toUpperCase() : '';
      const isCreditNote = rawNoteType === 'C' || (sheetName.toUpperCase().includes('CDNR') && rawNoteType !== 'D');

      // Multiplier for Credit Notes (reduces purchases) vs regular Invoices/Debit Notes
      const multiplier = isCreditNote ? -1 : 1;

      result.push({
        supplierGstin,
        supplierName: supplierName || undefined,
        invoiceNumber,
        invoiceDate,
        invoiceValue: (invoiceValue || (taxableValue + igst + cgst + sgst + cess)) * multiplier,
        taxableValue: Math.round(taxableValue * multiplier * 100) / 100,
        igst: Math.round(igst * multiplier * 100) / 100,
        cgst: Math.round(cgst * multiplier * 100) / 100,
        sgst: Math.round(sgst * multiplier * 100) / 100,
        cess: Math.round(cess * multiplier * 100) / 100,
        rate,
        isRcm,
        periodStr: periodInfo?.label || rawPeriod || undefined,
        periodQuarter: periodInfo?.quarter || undefined,
        periodFy: periodInfo?.fy || undefined,
        noteType: isCreditNote ? 'C' : 'INV',
      });
    }
  }

  return result;
}

/**
 * Parses raw GSTR-4A / GSTR-2A JSON file if uploaded
 */
export function parseGSTR4AJson(rawJson: any): IngestedInvoice[] {
  const result: IngestedInvoice[] = [];
  if (!rawJson) return result;

  const b2bList = rawJson.b2b || (Array.isArray(rawJson) ? rawJson : []);
  if (Array.isArray(b2bList)) {
    for (const supplier of b2bList) {
      const supplierGstin = supplier.ctin || supplier.supplierGstin || 'UNKNOWN_GSTIN';
      const supplierName = supplier.cname || supplier.tradeName || supplier.supplierName || null;
      const invList = supplier.inv || supplier.invoices || (supplier.inum ? [supplier] : []);

      for (const inv of invList) {
        const invoiceNumber = inv.inum || inv.invoiceNumber || 'INV-UNKNOWN';
        const invoiceDate = inv.idt || inv.invoiceDate || new Date().toISOString().split('T')[0];
        const invoiceValue = Number(inv.val) || Number(inv.invoiceValue) || 0;
        const isRcm = String(inv.rchrg || inv.isRcm).toUpperCase() === 'Y' || inv.isRcm === true;

        let taxableValue = 0;
        let igst = 0;
        let cgst = 0;
        let sgst = 0;
        let cess = 0;
        let rate = 0;

        if (Array.isArray(inv.itms)) {
          for (const item of inv.itms) {
            const det = item.itm_det || item;
            taxableValue += Number(det.txval) || 0;
            igst += Number(det.iamt) || 0;
            cgst += Number(det.camt) || 0;
            sgst += Number(det.samt) || 0;
            cess += Number(det.csamt) || 0;
            if (det.rt) rate = Number(det.rt);
          }
        } else {
          taxableValue = Number(inv.taxableValue) || (invoiceValue * 0.85);
          igst = Number(inv.igst) || 0;
          cgst = Number(inv.cgst) || 0;
          sgst = Number(inv.sgst) || 0;
          cess = Number(inv.cess) || 0;
          rate = Number(inv.rate) || 18;
        }

        result.push({
          supplierGstin,
          supplierName,
          invoiceNumber,
          invoiceDate,
          invoiceValue: invoiceValue || (taxableValue + igst + cgst + sgst + cess),
          taxableValue,
          igst,
          cgst,
          sgst,
          cess,
          rate,
          isRcm,
        });
      }
    }
  }

  return result;
}

// Backward compatibility alias
export const parseGSTR2AJson = parseGSTR4AJson;

/**
 * Parses an invoice date into an Indian FY Quarter (Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar)
 */
export function parseInvoiceDateToQuarter(dateStr: string | number | undefined): { quarter: string; month: number; year: number } | null {
  if (!dateStr) return null;
  
  // If Excel serial number (e.g. 40000 - 60000)
  const num = Number(dateStr);
  let d: Date | null = null;
  if (!isNaN(num) && num > 35000 && num < 60000) {
    d = new Date(Math.round((num - 25569) * 86400 * 1000));
  } else {
    const s = String(dateStr).trim();
    // Match DD-MM-YYYY or DD/MM/YYYY
    const dmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (dmy) {
      const day = parseInt(dmy[1], 10);
      const month = parseInt(dmy[2], 10);
      const year = parseInt(dmy[3], 10);
      d = new Date(year, month - 1, day);
    } else {
      // Match YYYY-MM-DD
      const ymd = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
      if (ymd) {
        const year = parseInt(ymd[1], 10);
        const month = parseInt(ymd[2], 10);
        const day = parseInt(ymd[3], 10);
        d = new Date(year, month - 1, day);
      } else {
        const parsed = Date.parse(s);
        if (!isNaN(parsed)) d = new Date(parsed);
      }
    }
  }

  if (!d || isNaN(d.getTime())) return null;

  const month = d.getMonth() + 1; // 1-12
  const year = d.getFullYear();

  // Indian FY Quarter:
  // Apr-Jun = Q1
  // Jul-Sep = Q2
  // Oct-Dec = Q3
  // Jan-Mar = Q4
  let quarter = 'Q1';
  if (month >= 4 && month <= 6) quarter = 'Q1';
  else if (month >= 7 && month <= 9) quarter = 'Q2';
  else if (month >= 10 && month <= 12) quarter = 'Q3';
  else if (month >= 1 && month <= 3) quarter = 'Q4';

  return { quarter, month, year };
}

export interface QuarterInvoicesSummary {
  count: number;
  totalPurchases: number;
  rcmTaxable: number;
  rcmTax: number;
  invoices: IngestedInvoice[];
}

/**
 * Detects quarter breakdown of parsed invoices and checks for quarter mismatch
 */
export function detectInvoicesQuarterBreakdown(invoices: IngestedInvoice[]): {
  breakdown: Record<string, QuarterInvoicesSummary>;
  dominantQuarter: string | null;
  detectedQuarters: string[];
  detectedFy: string | null;
} {
  const breakdown: Record<string, QuarterInvoicesSummary> = {
    Q1: { count: 0, totalPurchases: 0, rcmTaxable: 0, rcmTax: 0, invoices: [] },
    Q2: { count: 0, totalPurchases: 0, rcmTaxable: 0, rcmTax: 0, invoices: [] },
    Q3: { count: 0, totalPurchases: 0, rcmTaxable: 0, rcmTax: 0, invoices: [] },
    Q4: { count: 0, totalPurchases: 0, rcmTaxable: 0, rcmTax: 0, invoices: [] },
  };

  let detectedFy: string | null = null;

  invoices.forEach(inv => {
    // 1. Authoritative: Column A GSTR-4A Period (e.g. "Jul-Sep 26" -> Q2)
    let q = inv.periodQuarter;
    if (inv.periodFy && !detectedFy) {
      detectedFy = inv.periodFy;
    }
    if (!q) {
      // 2. Fallback to invoice date only if period column is absent
      const qInfo = parseInvoiceDateToQuarter(inv.invoiceDate);
      q = qInfo ? qInfo.quarter : 'Q1';
    }
    if (breakdown[q]) {
      breakdown[q].count += 1;
      const totalTax = (inv.igst || 0) + (inv.cgst || 0) + (inv.sgst || 0) + (inv.cess || 0);
      const rowPurchases = (inv.taxableValue || 0) + totalTax;
      breakdown[q].invoices.push(inv);
      if (inv.isRcm) {
        breakdown[q].rcmTaxable += inv.taxableValue || 0;
        breakdown[q].rcmTax += totalTax;
      } else {
        breakdown[q].totalPurchases += rowPurchases;
      }
    }
  });

  // Round summary figures to 2 decimal places
  for (const q of Object.keys(breakdown)) {
    breakdown[q].totalPurchases = Math.round(breakdown[q].totalPurchases * 100) / 100;
    breakdown[q].rcmTaxable = Math.round(breakdown[q].rcmTaxable * 100) / 100;
    breakdown[q].rcmTax = Math.round(breakdown[q].rcmTax * 100) / 100;
  }

  let dominantQuarter: string | null = null;
  let maxCount = 0;
  const detectedQuarters: string[] = [];

  for (const [q, data] of Object.entries(breakdown)) {
    if (data.count > 0) {
      detectedQuarters.push(q);
      if (data.count > maxCount) {
        maxCount = data.count;
        dominantQuarter = q;
      }
    }
  }

  return {
    breakdown,
    dominantQuarter,
    detectedQuarters,
    detectedFy,
  };
}
