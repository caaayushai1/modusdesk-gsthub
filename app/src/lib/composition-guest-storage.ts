/**
 * Guest Mode Local Cache Storage for Composition Scheme
 * Allows standalone guest users to manually add clients, calculate quarterly stock & tax,
 * store inward invoices, and use all features with persistence in browser localStorage.
 */

export interface GuestClient {
  id: string;
  clientCode: string;
  clientName: string;
  gstin: string;
  stateCode?: string;
  portalUsername?: string;
}

export interface GuestLedgerRow {
  id: string;
  clientId: string;
  clientCode: string;
  clientName: string;
  gstin: string;
  financialYear: string;
  quarter: string;
  openingStock: number;
  prevQuarterClosingStock: number | null;
  totalPurchases: number;
  rcmTaxableValue: number;
  rcmTaxPayable: number;
  gpMargin: number;
  salesMode: 'ACTUAL' | 'DERIVED';
  actualSales: number;
  targetClosingStock?: number;
  taxRateOnSales: number;
  taxPayableOnSales: number;
  totalCmp08Tax: number;
  closingStock: number;
  status: string;
  notes?: string;
  inwardInvoiceCount?: number;
}

export interface GuestInwardInvoice {
  id: string;
  clientId: string;
  gstin: string;
  financialYear: string;
  quarter: string;
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
  totalTax: number;
}

const CLIENTS_KEY = 'gsthub_guest_clients';
const LEDGER_PREFIX = 'gsthub_guest_ledger_';
const INVOICES_PREFIX = 'gsthub_guest_invoices_';

// ── 1. Client Management in Guest Mode ──

export function getGuestClients(): GuestClient[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CLIENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGuestClient(client: Omit<GuestClient, 'id'> & { id?: string }): GuestClient {
  const existing = getGuestClients();
  const id = client.id || `guest_client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newClient: GuestClient = { ...client, id };
  
  const index = existing.findIndex(c => c.id === id || (c.gstin && c.gstin === client.gstin));
  if (index >= 0) {
    existing[index] = newClient;
  } else {
    existing.push(newClient);
  }
  
  try {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to save guest client to localStorage:', err);
  }
  return newClient;
}

export function deleteGuestClient(clientId: string): void {
  const existing = getGuestClients().filter(c => c.id !== clientId);
  try {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to delete guest client:', err);
  }
}

// ── 2. Ledger Management in Guest Mode ──

export function getGuestLedger(fy: string, quarter: string): GuestLedgerRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${LEDGER_PREFIX}${fy}_${quarter}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGuestLedgerRow(row: GuestLedgerRow): void {
  if (typeof window === 'undefined') return;
  const key = `${LEDGER_PREFIX}${row.financialYear}_${row.quarter}`;
  const rows = getGuestLedger(row.financialYear, row.quarter);
  const index = rows.findIndex(r => r.clientId === row.clientId || r.id === row.id);
  
  if (index >= 0) {
    rows[index] = row;
  } else {
    rows.push(row);
  }

  try {
    localStorage.setItem(key, JSON.stringify(rows));
  } catch (err) {
    console.error('Failed to save guest ledger row:', err);
  }
}

// ── 3. Inward Invoices in Guest Mode ──

export function getGuestInvoices(clientId: string, fy: string, quarter: string): GuestInwardInvoice[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${INVOICES_PREFIX}${clientId}_${fy}_${quarter}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGuestInvoices(
  clientId: string, 
  fy: string, 
  quarter: string, 
  invoices: GuestInwardInvoice[]
): void {
  if (typeof window === 'undefined') return;
  const key = `${INVOICES_PREFIX}${clientId}_${fy}_${quarter}`;
  try {
    localStorage.setItem(key, JSON.stringify(invoices));
  } catch (err) {
    console.error('Failed to save guest invoices:', err);
  }
}

// ── 4. Clear Cache ──

export function clearAllGuestData(): void {
  if (typeof window === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('gsthub_guest_') || key === CLIENTS_KEY)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}
