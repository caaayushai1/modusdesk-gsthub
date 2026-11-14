import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const financialYear = req.nextUrl.searchParams.get('fy') || '2026-27';
    const quarter = req.nextUrl.searchParams.get('quarter') || 'Q2';

    const records = await prisma.compositionSchemeLedger.findMany({
      where: {
        financialYear,
        quarter,
      },
      orderBy: { clientCode: 'asc' },
    });

    // Generate CSV contents
    const headers = [
      'Client Code',
      'Client Name',
      'GSTIN',
      'Financial Year',
      'Quarter',
      'Opening Stock (Rs)',
      'Purchases (incl Tax excl RCM) (Rs)',
      'RCM Taxable Value (Rs)',
      'GST Payable in RCM (Rs)',
      'GP Margin (%)',
      'Sales Mode',
      'Sales Turnover (Rs)',
      'Tax on Sales (1%) (Rs)',
      'Total CMP-08 Tax (Rs)',
      'Audited Closing Stock (Rs)',
      'Status',
      'Notes'
    ];

    const rows = records.map(r => [
      `"${r.clientCode}"`,
      `"${r.clientName.replace(/"/g, '""')}"`,
      `"${r.gstin}"`,
      `"${r.financialYear}"`,
      `"${r.quarter}"`,
      r.openingStock,
      r.totalPurchases,
      r.rcmTaxableValue,
      r.rcmTaxPayable,
      r.gpMargin,
      `"${r.salesMode}"`,
      r.actualSales,
      r.taxPayableOnSales,
      r.totalCmp08Tax,
      r.closingStock,
      `"${r.status}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Composition_Ledger_${financialYear}_${quarter}.csv"`,
      },
    });
  } catch (err: any) {
    console.error('Export composition ledger error:', err);
    return NextResponse.json({ error: err.message || 'Export failed' }, { status: 500 });
  }
}
