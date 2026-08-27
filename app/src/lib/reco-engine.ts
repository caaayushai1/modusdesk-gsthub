import type {
  PurchaseInvoice,
  GSTR2BInvoice,
  RecoLineItem,
  RecoSummary,
  RecoResult,
  RecoBucket,
} from './reco-types';

export function normalizeInvoiceNumber(inv: string): string {
  if (!inv) return '';
  const cleaned = inv.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return cleaned.replace(/^0+/, '');
}

export function isFuzzyInvoiceMatch(inv1: string, inv2: string): boolean {
  const norm1 = normalizeInvoiceNumber(inv1);
  const norm2 = normalizeInvoiceNumber(inv2);

  if (norm1 === norm2) return true;
  if (!norm1 || !norm2) return false;

  if (norm1.endsWith(norm2) || norm2.endsWith(norm1)) {
    const minLen = Math.min(norm1.length, norm2.length);
    if (minLen >= 3) return true;
  }

  return false;
}

export function run2BReconciliation(
  booksInvoices: PurchaseInvoice[],
  gstr2bInvoices: GSTR2BInvoice[],
  tolerance: number = 1.0,
  clientMeta = {
    clientId: 'client_001A',
    clientName: 'Acme Corporation Ltd.',
    gstin: '27AABCA1234F1Z5',
    period: '2026-07',
  }
): RecoResult {
  const matched2bIds = new Set<string>();
  const items: RecoLineItem[] = [];

  let totalBooksTaxable = 0;
  let totalBooksTax = 0;
  let total2bTaxable = 0;
  let total2bTax = 0;
  let eligibleClaimableItc = 0;
  let atRiskItcMissingIn2b = 0;
  let unclaimedItcMissingInBooks = 0;
  let valueMismatchTaxDiff = 0;

  let exactMatchCount = 0;
  let valueMismatchCount = 0;
  let headMismatchCount = 0;
  let dateMismatchCount = 0;
  let missingIn2bCount = 0;
  let missingInBooksCount = 0;
  let ineligibleCount = 0;

  // 1. Process all Books Invoices against GSTR-2B
  for (const book of booksInvoices) {
    totalBooksTaxable += book.taxableValue;
    totalBooksTax += book.totalTax;

    // Check Blocked credit Sec 17(5)
    if (
      book.supplierName.toLowerCase().includes('motor') ||
      book.supplierName.toLowerCase().includes('vehicle') ||
      book.supplierName.toLowerCase().includes('club')
    ) {
      ineligibleCount++;
      items.push({
        id: `reco_${book.id}`,
        bucket: 'INELIGIBLE',
        supplierGstin: book.supplierGstin,
        supplierName: book.supplierName,
        invoiceNumber: book.invoiceNumber,
        booksInvoice: book,
        gstr2bInvoice: null,
        taxableDiff: book.taxableValue,
        taxDiff: book.totalTax,
        igstDiff: book.igst,
        cgstDiff: book.cgst,
        sgstDiff: book.sgst,
        statusMessage: 'Blocked credit under Section 17(5) — Motor vehicle / Personal expenditure.',
      });
      continue;
    }

    // Find match in GSTR-2B by GSTIN and Invoice Number
    const match = gstr2bInvoices.find(
      (b2) =>
        !matched2bIds.has(b2.id) &&
        b2.supplierGstin.toUpperCase() === book.supplierGstin.toUpperCase() &&
        isFuzzyInvoiceMatch(b2.invoiceNumber, book.invoiceNumber)
    );

    if (match) {
      matched2bIds.add(match.id);
      total2bTaxable += match.taxableValue;
      total2bTax += match.totalTax;

      const taxableDiff = book.taxableValue - match.taxableValue;
      const taxDiff = book.totalTax - match.totalTax;
      const igstDiff = book.igst - match.igst;
      const cgstDiff = book.cgst - match.cgst;
      const sgstDiff = book.sgst - match.sgst;

      const isTaxableDiff = Math.abs(taxableDiff) > tolerance;
      const isTaxDiff = Math.abs(taxDiff) > tolerance;
      const isHeadDiff = Math.abs(igstDiff) > tolerance || Math.abs(cgstDiff) > tolerance || Math.abs(sgstDiff) > tolerance;
      const isDateDiff = book.invoiceDate && match.invoiceDate && book.invoiceDate !== match.invoiceDate;

      if (!isTaxableDiff && !isTaxDiff && !isHeadDiff && !isDateDiff) {
        // Exact Match
        exactMatchCount++;
        eligibleClaimableItc += match.totalTax;
        items.push({
          id: `reco_${book.id}`,
          bucket: 'EXACT_MATCH',
          supplierGstin: book.supplierGstin,
          supplierName: book.supplierName,
          invoiceNumber: book.invoiceNumber,
          booksInvoice: book,
          gstr2bInvoice: match,
          taxableDiff: 0,
          taxDiff: 0,
          igstDiff: 0,
          cgstDiff: 0,
          sgstDiff: 0,
          statusMessage: 'Exact match in books & GSTR-2B. ITC 100% claimable.',
        });
      } else if (isHeadDiff && !isTaxDiff && !isTaxableDiff) {
        // Head Mismatch (IGST vs CGST/SGST - POS error)
        headMismatchCount++;
        valueMismatchTaxDiff += Math.abs(taxDiff);
        items.push({
          id: `reco_${book.id}`,
          bucket: 'HEAD_MISMATCH',
          supplierGstin: book.supplierGstin,
          supplierName: book.supplierName,
          invoiceNumber: book.invoiceNumber,
          booksInvoice: book,
          gstr2bInvoice: match,
          taxableDiff,
          taxDiff,
          igstDiff,
          cgstDiff,
          sgstDiff,
          statusMessage: `Tax Head mismatch: Books has IGST ₹${book.igst} vs 2B CGST+SGST ₹${match.cgst + match.sgst}. Check Place of Supply.`,
        });
      } else if (isDateDiff && !isTaxableDiff && !isTaxDiff) {
        // Date Mismatch
        dateMismatchCount++;
        eligibleClaimableItc += match.totalTax;
        items.push({
          id: `reco_${book.id}`,
          bucket: 'DATE_MISMATCH',
          supplierGstin: book.supplierGstin,
          supplierName: book.supplierName,
          invoiceNumber: book.invoiceNumber,
          booksInvoice: book,
          gstr2bInvoice: match,
          taxableDiff: 0,
          taxDiff: 0,
          igstDiff: 0,
          cgstDiff: 0,
          sgstDiff: 0,
          statusMessage: `Invoice date mismatch: Books (${book.invoiceDate}) vs GSTR-2B (${match.invoiceDate}).`,
        });
      } else {
        // Value Mismatch
        valueMismatchCount++;
        valueMismatchTaxDiff += Math.abs(taxDiff);
        items.push({
          id: `reco_${book.id}`,
          bucket: 'VALUE_MISMATCH',
          supplierGstin: book.supplierGstin,
          supplierName: book.supplierName,
          invoiceNumber: book.invoiceNumber,
          booksInvoice: book,
          gstr2bInvoice: match,
          taxableDiff,
          taxDiff,
          igstDiff,
          cgstDiff,
          sgstDiff,
          statusMessage: `Value discrepancy detected: Books Taxable ₹${book.taxableValue} vs 2B Taxable ₹${match.taxableValue}.`,
        });
      }
    } else {
      // Missing in GSTR-2B (Recorded in Books, but supplier hasn't uploaded in GSTR-1)
      missingIn2bCount++;
      atRiskItcMissingIn2b += book.totalTax;
      items.push({
        id: `reco_${book.id}`,
        bucket: 'MISSING_IN_2B',
        supplierGstin: book.supplierGstin,
        supplierName: book.supplierName,
        invoiceNumber: book.invoiceNumber,
        booksInvoice: book,
        gstr2bInvoice: null,
        taxableDiff: book.taxableValue,
        taxDiff: book.totalTax,
        igstDiff: book.igst,
        cgstDiff: book.cgst,
        sgstDiff: book.sgst,
        statusMessage: 'Invoice in Books but missing in GSTR-2B. Vendor did not file GSTR-1. ITC at risk.',
      });
    }
  }

  // 2. Identify Invoices in GSTR-2B but Missing in Books (Unclaimed purchases)
  for (const b2 of gstr2bInvoices) {
    if (!matched2bIds.has(b2.id)) {
      total2bTaxable += b2.taxableValue;
      total2bTax += b2.totalTax;
      missingInBooksCount++;
      unclaimedItcMissingInBooks += b2.totalTax;

      items.push({
        id: `reco_2b_${b2.id}`,
        bucket: 'MISSING_IN_BOOKS',
        supplierGstin: b2.supplierGstin,
        supplierName: b2.supplierName,
        invoiceNumber: b2.invoiceNumber,
        booksInvoice: null,
        gstr2bInvoice: b2,
        taxableDiff: -b2.taxableValue,
        taxDiff: -b2.totalTax,
        igstDiff: -b2.igst,
        cgstDiff: -b2.cgst,
        sgstDiff: -b2.sgst,
        statusMessage: 'Invoice appears in GSTR-2B but missing in Purchase Register. Potential unclaimed ITC.',
      });
    }
  }

  const summary: RecoSummary = {
    totalBooksTaxable,
    totalBooksTax,
    total2bTaxable,
    total2bTax,
    eligibleClaimableItc,
    atRiskItcMissingIn2b,
    unclaimedItcMissingInBooks,
    valueMismatchTaxDiff,
    exactMatchCount,
    valueMismatchCount,
    headMismatchCount,
    dateMismatchCount,
    missingIn2bCount,
    missingInBooksCount,
    ineligibleCount,
    totalLines: items.length,
  };

  return {
    period: clientMeta.period,
    clientId: clientMeta.clientId,
    clientName: clientMeta.clientName,
    gstin: clientMeta.gstin,
    summary,
    items,
  };
}
