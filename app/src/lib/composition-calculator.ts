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
    // Sales = (Opening + Purchases - TargetClosing) / (1 - GP Margin)
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
      // Prevent negative stock unless inventory deficit explicitly logged
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
 * Parses GSTR-2A B2B JSON or Excel structure and categorizes invoices into:
 * - Regular purchases (inclusive of CGST + SGST + IGST)
 * - Reverse Charge (Sec 9(3)/9(4) RCM) invoices
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

export function aggregateGSTR2AInwardInvoices(invoices: IngestedInvoice[]) {
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

/**
 * Parses raw GSTR-2A JSON file exported from the official GST Portal (services.gst.gov.in)
 * Handles standard portal structure: { b2b: [ { ctin, cnm, inv: [ { inum, idt, val, rchrg, itms: [...] } ] } ] }
 */
export function parseGSTR2AJson(rawJson: any): IngestedInvoice[] {
  const result: IngestedInvoice[] = [];
  if (!rawJson) return result;

  // Case 1: Standard GST Portal GSTR-2A format with b2b array
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

