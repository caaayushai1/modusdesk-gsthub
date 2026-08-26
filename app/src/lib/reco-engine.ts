import type {
  PurchaseInvoice,
  GSTR2BInvoice,
  RecoLineItem,
  RecoSummary,
  RecoResult,
  RecoBucket,
} from './reco-types';

/**
 * Normalizes an invoice number string by removing special characters,
 * spaces, punctuation, and leading zeros from numeric components.
 * Example: 'INV/2026-27/0042' -> 'INV20262742'
 */
export function normalizeInvoiceNumber(inv: string): string {
  if (!inv) return '';
  const cleaned = inv.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Remove leading zeros in pure numeric or alphanumeric suffix
  return cleaned.replace(/^0+/, '');
}

/**
 * Compares two invoice numbers using normalized and suffix matching.
 */
export function isFuzzyInvoiceMatch(inv1: string, inv2: string): boolean {
  const norm1 = normalizeInvoiceNumber(inv1);
  const norm2 = normalizeInvoiceNumber(inv2);

  if (norm1 === norm2) return true;
  if (!norm1 || !norm2) return false;

  // Check if one is a suffix of the other (e.g. '0101' vs 'INV20260101')
  if (norm1.endsWith(norm2) || norm2.endsWith(norm1)) {
    // Suffix must be at least 3 chars long to avoid false positives
    const minLen = Math.min(norm1.length, norm2.length);
    if (minLen >= 3) return true;
  }

  return false;
}

/**
 * Executes 5-Bucket Reconciliation between Books (Purchase Register)
 * and GSTR-2B Auto-Drafted Statement.
 */
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
  let missingIn2bCount = 0;
  let missingInBooksCount = 0;
  let ineligibleCount = 0;

  // 1. Process all Books Invoices against GSTR-2B
  for (const book of booksInvoices) {
    totalBooksTaxable += book.taxableValue;
    totalBooksTax += book.totalTax;

    // Check if specifically categorized as Blocked credit under Sec 17(5)
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
        statusMessage: 'Blocked credit under Section 17(5) — Motor vehicle / Personal expenditure.',
      });
      continue;
    }

    // Search for matching 2B invoice: same supplier GSTIN + matching invoice number
    const matching2b = gstr2bInvoices.find(
      (b2) =>
        !matched2bIds.has(b2.id) &&
        b2.supplierGstin.toUpperCase() === book.supplierGstin.toUpperCase() &&
        isFuzzyInvoiceMatch(b2.invoiceNumber, book.invoiceNumber)
    );

    if (matching2b) {
      matched2bIds.add(matching2b.id);
      total2bTaxable += matching2b.taxableValue;
      total2bTax += matching2b.totalTax;

      const taxableDiff = book.taxableValue - matching2b.taxableValue;
      const taxDiff = book.totalTax - matching2b.totalTax;

      if (Math.abs(taxDiff) <= tolerance) {
        // EXACT MATCH (Safe to claim)
        exactMatchCount++;
        eligibleClaimableItc += matching2b.totalTax;

        items.push({
          id: `reco_${book.id}_${matching2b.id}`,
          bucket: 'EXACT_MATCH',
          supplierGstin: book.supplierGstin,
          supplierName: book.supplierName,
          invoiceNumber: book.invoiceNumber,
          booksInvoice: book,
          gstr2bInvoice: matching2b,
          taxableDiff: 0,
          taxDiff: 0,
          statusMessage: 'Exact match in GSTR-2B. Safe to claim in Table 4(A)(5).',
        });
      } else {
        // VALUE MISMATCH
        valueMismatchCount++;
        valueMismatchTaxDiff += Math.abs(taxDiff);
        // Only claim the lower amount safely
        eligibleClaimableItc += Math.min(book.totalTax, matching2b.totalTax);

        items.push({
          id: `reco_${book.id}_${matching2b.id}`,
          bucket: 'VALUE_MISMATCH',
          supplierGstin: book.supplierGstin,
          supplierName: book.supplierName,
          invoiceNumber: book.invoiceNumber,
          booksInvoice: book,
          gstr2bInvoice: matching2b,
          taxableDiff,
          taxDiff,
          statusMessage: `Tax difference of ₹${Math.abs(taxDiff).toLocaleString('en-IN')}. Verify rate / discounts.`,
        });
      }
    } else {
      // MISSING IN 2B (Vendor defaulted or GSTR-1 delayed)
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
        statusMessage: 'Invoice not found in GSTR-2B. Vendor has not filed GSTR-1. At-Risk ITC!',
      });
    }
  }

  // 2. Identify GSTR-2B Invoices that were NOT recorded in Books
  for (const b2 of gstr2bInvoices) {
    if (!matched2bIds.has(b2.id)) {
      missingInBooksCount++;
      total2bTaxable += b2.taxableValue;
      total2bTax += b2.totalTax;
      unclaimedItcMissingInBooks += b2.totalTax;

      items.push({
        id: `reco_2b_only_${b2.id}`,
        bucket: 'MISSING_IN_BOOKS',
        supplierGstin: b2.supplierGstin,
        supplierName: b2.supplierName,
        invoiceNumber: b2.invoiceNumber,
        booksInvoice: null,
        gstr2bInvoice: b2,
        taxableDiff: -b2.taxableValue,
        taxDiff: -b2.totalTax,
        statusMessage: 'Available in GSTR-2B but missing in Tally purchase register. Unclaimed ITC!',
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
