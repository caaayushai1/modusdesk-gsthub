import { NextRequest, NextResponse } from 'next/server';
import {
  getMockGSTR1,
  getMockGSTR3B,
  getMockGSTR2B,
  getMockARNReceipt,
} from '@/lib/mock-returns-data';
import type { ReturnType } from '@/lib/downloader-types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      clientName = 'Acme Corporation Ltd.',
      gstin = '27AABCA1234F1Z5',
      returnType = 'GSTR1',
      period = '2026-07',
    }: {
      clientName?: string;
      gstin?: string;
      returnType?: ReturnType;
      period?: string;
    } = body;

    let previewData;

    switch (returnType) {
      case 'GSTR1':
        previewData = getMockGSTR1(clientName, gstin, period);
        break;
      case 'GSTR3B':
        previewData = getMockGSTR3B(clientName, gstin, period);
        break;
      case 'GSTR2B':
        previewData = getMockGSTR2B(clientName, gstin, period);
        break;
      case 'ARN_RECEIPT':
        previewData = getMockARNReceipt(clientName, gstin, period, 'GSTR-3B');
        break;
      default:
        return NextResponse.json({ error: `Unsupported return type: ${returnType}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: previewData,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch return data';
    console.error('[API/DOWNLOADER/FETCH ERROR]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
