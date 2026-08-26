export type RecoBucket =
  | 'EXACT_MATCH'
  | 'VALUE_MISMATCH'
  | 'MISSING_IN_2B'
  | 'MISSING_IN_BOOKS'
  | 'INELIGIBLE';

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  supplierGstin: string;
  supplierName: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  totalTax: number;
  totalInvoiceValue: number;
}

export interface GSTR2BInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  supplierGstin: string;
  supplierName: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  totalTax: number;
  totalInvoiceValue: number;
  gstr1FilingDate: string;
  itcAvailability: 'YES' | 'NO';
}

export interface RecoLineItem {
  id: string;
  bucket: RecoBucket;
  supplierGstin: string;
  supplierName: string;
  invoiceNumber: string;
  booksInvoice: PurchaseInvoice | null;
  gstr2bInvoice: GSTR2BInvoice | null;
  taxableDiff: number; // Books - 2B
  taxDiff: number;     // Books - 2B
  statusMessage: string;
}

export interface RecoSummary {
  totalBooksTaxable: number;
  totalBooksTax: number;
  total2bTaxable: number;
  total2bTax: number;
  eligibleClaimableItc: number;
  atRiskItcMissingIn2b: number;
  unclaimedItcMissingInBooks: number;
  valueMismatchTaxDiff: number;
  exactMatchCount: number;
  valueMismatchCount: number;
  missingIn2bCount: number;
  missingInBooksCount: number;
  ineligibleCount: number;
  totalLines: number;
}

export interface RecoResult {
  period: string;
  clientId: string;
  clientName: string;
  gstin: string;
  summary: RecoSummary;
  items: RecoLineItem[];
}
