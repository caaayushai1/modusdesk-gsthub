import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('clientId');
    const gstin = req.nextUrl.searchParams.get('gstin');
    const financialYear = req.nextUrl.searchParams.get('fy') || '2026-27';
    const quarter = req.nextUrl.searchParams.get('quarter') || 'Q2';
    const filter = req.nextUrl.searchParams.get('filter'); // 'ALL' | 'RCM' | 'REGULAR'

    const whereClause: any = {
      financialYear,
      quarter,
    };
    if (clientId) whereClause.clientId = clientId;
    if (gstin) whereClause.gstin = gstin;
    if (filter === 'RCM') whereClause.isRcm = true;
    if (filter === 'REGULAR') whereClause.isRcm = false;

    const invoices = await prisma.compositionInwardInvoice.findMany({
      where: whereClause,
      orderBy: { invoiceDate: 'desc' },
      take: 200,
    });

    return NextResponse.json({
      success: true,
      count: invoices.length,
      invoices: invoices.map(i => ({
        ...i,
        invoiceValue: Number(i.invoiceValue),
        taxableValue: Number(i.taxableValue),
        igst: Number(i.igst),
        cgst: Number(i.cgst),
        sgst: Number(i.sgst),
        cess: Number(i.cess),
        rate: Number(i.rate),
        totalTax: Number(i.igst) + Number(i.cgst) + Number(i.sgst) + Number(i.cess),
      }))
    });
  } catch (err: any) {
    console.error('Error fetching composition invoices:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch invoices' }, { status: 500 });
  }
}
