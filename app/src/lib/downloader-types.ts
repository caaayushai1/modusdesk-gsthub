export type ReturnType = 'GSTR1' | 'GSTR3B' | 'GSTR2B' | 'ARN_RECEIPT';

// ── GSTR-1 Preview Structures ─────────────────────────────────
export interface GSTR1B2BInvoice {
  customerGstin: string;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  pos: string;
}

export interface GSTR1HsnItem {
  hsnCode: string;
  description: string;
  uqc: string;
  totalQty: number;
  taxableValue: number;
  rate: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalTax: number;
}

export interface GSTR1PreviewData {
  returnType: 'GSTR1';
  period: string;
  gstin: string;
  legalName: string;
  arn: string;
  filingDate: string;
  status: 'FILED';
  totals: {
    totalTaxable: number;
    totalIgst: number;
    totalCgst: number;
    totalSgst: number;
    totalCess: number;
    totalLiability: number;
    b2bInvoiceCount: number;
  };
  b2bInvoices: GSTR1B2BInvoice[];
  hsnSummary: GSTR1HsnItem[];
}

// ── GSTR-3B Preview Structures ────────────────────────────────
export interface GSTR3BTable31Item {
  natureOfSupplies: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

export interface GSTR3BITCItem {
  heading: string;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

export interface GSTR3BTaxPaymentItem {
  taxHead: string;
  totalTaxPayable: number;
  paidViaItc: number;
  paidViaCash: number;
  interest: number;
  lateFee: number;
}

export interface GSTR3BPreviewData {
  returnType: 'GSTR3B';
  period: string;
  gstin: string;
  legalName: string;
  arn: string;
  filingDate: string;
  status: 'FILED';
  table31: GSTR3BTable31Item[];
  table4Itc: {
    eligibleItc: GSTR3BITCItem[];
    ineligibleItc: GSTR3BITCItem[];
    netItcAvailable: {
      igst: number;
      cgst: number;
      sgst: number;
      cess: number;
      total: number;
    };
  };
  table61Payment: GSTR3BTaxPaymentItem[];
}

// ── GSTR-2B Preview Structures ────────────────────────────────
export interface GSTR2BSupplierSummary {
  supplierGstin: string;
  supplierName: string;
  invoiceCount: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  totalItcAvailable: number;
  gstr1FilingDate: string;
  gstr3bFiled: 'YES' | 'NO';
}

export interface GSTR2BPreviewData {
  returnType: 'GSTR2B';
  period: string;
  gstin: string;
  legalName: string;
  generationDate: string;
  status: 'AVAILABLE';
  totals: {
    totalB2BInvoices: number;
    totalTaxable: number;
    totalEligibleItc: number;
    totalIneligibleItc: number;
  };
  suppliers: GSTR2BSupplierSummary[];
}

// ── ARN Receipt Preview Structures ────────────────────────────
export interface ARNReceiptPreviewData {
  returnType: 'ARN_RECEIPT';
  arn: string;
  returnTypeLabel: string;
  period: string;
  gstin: string;
  legalName: string;
  dateOfFiling: string;
  filingStatus: string;
  verificationMode: string;
}

// Union of all preview types
export type ReturnPreviewData =
  | GSTR1PreviewData
  | GSTR3BPreviewData
  | GSTR2BPreviewData
  | ARNReceiptPreviewData;

// ── Batch Downloader Queue Item ───────────────────────────────
export interface BatchQueueItem {
  id: string;
  clientId: string;
  clientCode: string;
  clientName: string;
  gstin: string;
  returnType: ReturnType;
  period: string;
  status: 'QUEUED' | 'FETCHING' | 'READY' | 'ERROR';
  errorMessage?: string;
  data?: ReturnPreviewData;
}
