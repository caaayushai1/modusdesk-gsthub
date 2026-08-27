import { NextRequest, NextResponse } from 'next/server';
import { run2BReconciliation } from '@/lib/reco-engine';
import type { PurchaseInvoice, GSTR2BInvoice } from '@/lib/reco-types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      clientId = '',
      clientName = '',
      gstin = '',
      period = '2026-07',
      booksInvoices = [],
      gstr2bInvoices = [],
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

    const result = run2BReconciliation(booksInvoices, gstr2bInvoices, tolerance, {
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
