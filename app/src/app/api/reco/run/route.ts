import { NextRequest, NextResponse } from 'next/server';
import { run2BReconciliation } from '@/lib/reco-engine';
import { SAMPLE_BOOKS_PURCHASES, SAMPLE_2B_PURCHASES } from '@/lib/mock-purchase-register';
import type { PurchaseInvoice, GSTR2BInvoice } from '@/lib/reco-types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      clientId = 'client_001A',
      clientName = 'Acme Corporation Ltd.',
      gstin = '27AABCA1234F1Z5',
      period = '2026-07',
      booksInvoices,
      gstr2bInvoices,
      tolerance = 1.0,
    }: {
      clientId?: string;
      clientName?: string;
      gstin?: string;
      period?: string;
      booksInvoices?: PurchaseInvoice[];
      gstr2bInvoices?: GSTR2BInvoice[];
      tolerance?: number;
    } = body;

    const finalBooks = booksInvoices && booksInvoices.length > 0 ? booksInvoices : SAMPLE_BOOKS_PURCHASES;
    const final2B = gstr2bInvoices && gstr2bInvoices.length > 0 ? gstr2bInvoices : SAMPLE_2B_PURCHASES;

    const result = run2BReconciliation(finalBooks, final2B, tolerance, {
      clientId,
      clientName,
      gstin,
      period,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Reconciliation execution failed';
    console.error('[API/RECO/RUN ERROR]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
