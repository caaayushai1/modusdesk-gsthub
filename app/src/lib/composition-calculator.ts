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
 * Automatically locates the B2B inward supplies sheet and extracts invoice rows.
 */
export function parseGSTR4AExcel(data: ArrayBuffer): IngestedInvoice[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const result: IngestedInvoice[] = [];

  // Find sheet: B2B, Inward, 4A, or first sheet
  const sheetNames = workbook.SheetNames;
  const b2bSheetName = sheetNames.find(s => 
    /b2b/i.test(s) || /inward/i.test(s) || /4a/i.test(s)
  ) || sheetNames[0];

  if (!b2bSheetName) return result;

  const worksheet = workbook.Sheets[b2bSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (rows.length < 2) return result;

  // Locate the header row
  let headerRowIdx = -1;
  const colMap: Record<string, number> = {};

  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r];
    const joined = row.map(c => String(c).toLowerCase()).join(' ');
    if (joined.includes('gstin') || (joined.includes('invoice') && joined.includes('taxable'))) {
      headerRowIdx = r;
      row.forEach((cellVal: any, colIdx: number) => {
        const val = String(cellVal).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (val) colMap[val] = colIdx;
      });
      break;
    }
  }

  const findCol = (...keywords: string[]): number => {
    for (const kw of keywords) {
      const cleanKw = kw.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const [key, idx] of Object.entries(colMap)) {
        if (key.includes(cleanKw) || cleanKw.includes(key)) {
          return idx;
        }
      }
    }
    return -1;
  };

  const ctinCol = findCol('gstinofsupplier', 'suppliergstin', 'gstin', 'ctin');
  const nameCol = findCol('tradename', 'legalname', 'suppliername', 'name');
  const invNumCol = findCol('invoicenumber', 'invoiceno', 'invno', 'inum');
  const invDateCol = findCol('invoicedate', 'date', 'invdate', 'dt', 'idt');
  const invValCol = findCol('invoicevalue', 'invval', 'value', 'val');
  const rcmCol = findCol('reversecharge', 'rchrg', 'rcm');
  const rateCol = findCol('rate', 'ratepercent', 'rt');
  const txvalCol = findCol('taxablevalue', 'taxableamt', 'txval');
  const igstCol = findCol('integratedtax', 'igst', 'iamt');
  const cgstCol = findCol('centraltax', 'cgst', 'camt');
  const sgstCol = findCol('statetax', 'stateuttax', 'sgst', 'utgst', 'samt');
  const cessCol = findCol('cess', 'csamt');

  const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 1;

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rawGstin = ctinCol >= 0 ? String(row[ctinCol] || '').trim() : '';
    const rawInvNum = invNumCol >= 0 ? String(row[invNumCol] || '').trim() : '';
    
    // Skip empty or total rows
    if (!rawGstin && !rawInvNum) continue;
    if (rawGstin.toLowerCase().includes('total') || rawInvNum.toLowerCase().includes('total')) continue;

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

    result.push({
      supplierGstin,
      supplierName: supplierName || undefined,
      invoiceNumber,
      invoiceDate,
      invoiceValue: invoiceValue || (taxableValue + igst + cgst + sgst + cess),
      taxableValue: Math.round(taxableValue * 100) / 100,
      igst: Math.round(igst * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      cess: Math.round(cess * 100) / 100,
      rate,
      isRcm,
    });
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
