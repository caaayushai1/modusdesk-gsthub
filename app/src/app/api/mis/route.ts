import { NextRequest, NextResponse } from 'next/server';
import type { MISReportData } from '@/lib/mis-types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId') || 'client_none';
    const clientName = searchParams.get('clientName') || 'Practice Client';
    const gstin = searchParams.get('gstin') || '---';
    const financialYear = searchParams.get('financialYear') || '2026-2027';

    const months = [
      { name: 'April 2026', period: '2026-04' },
      { name: 'May 2026', period: '2026-05' },
      { name: 'June 2026', period: '2026-06' },
      { name: 'July 2026', period: '2026-07' },
    ];

    const gstr1Vs3b = months.map((m) => ({
      month: m.name,
      period: m.period,
      gstr1Taxable: 0.0,
      gstr1Tax: 0.0,
      gstr3bTaxable: 0.0,
      gstr3bTax: 0.0,
      taxDifference: 0.0,
      drc01bAlert: false,
    }));

    const gstr2bVs3b = months.map((m) => ({
      month: m.name,
      period: m.period,
      gstr2bItc: 0.0,
      gstr3bItcClaimed: 0.0,
      excessClaim: 0.0,
      drc01cAlert: false,
    }));

    const gstr9Outward = [
      {
        natureOfSupply: '4A. Supplies made to registered persons (B2B)',
        taxableValue: 0.0,
        igst: 0.0,
        cgst: 0.0,
        sgst: 0.0,
        cess: 0.0,
        totalTax: 0.0,
      },
      {
        natureOfSupply: '4B. Supplies made to unregistered persons (B2C)',
        taxableValue: 0.0,
        igst: 0.0,
        cgst: 0.0,
        sgst: 0.0,
        cess: 0.0,
        totalTax: 0.0,
      },
      {
        natureOfSupply: '4C. Zero rated supply (Export) on payment of tax',
        taxableValue: 0.0,
        igst: 0.0,
        cgst: 0.0,
        sgst: 0.0,
        cess: 0.0,
        totalTax: 0.0,
      },
      {
        natureOfSupply: '4N. Total Outward Supplies on which tax is payable',
        taxableValue: 0.0,
        igst: 0.0,
        cgst: 0.0,
        sgst: 0.0,
        cess: 0.0,
        totalTax: 0.0,
      },
    ];

    const gstr9TaxPaid = [
      {
        taxHead: 'Integrated Tax (IGST)',
        taxPayable: 0.0,
        paidViaCash: 0.0,
        paidViaItc: 0.0,
      },
      {
        taxHead: 'Central Tax (CGST)',
        taxPayable: 0.0,
        paidViaCash: 0.0,
        paidViaItc: 0.0,
      },
      {
        taxHead: 'State Tax (SGST)',
        taxPayable: 0.0,
        paidViaCash: 0.0,
        paidViaItc: 0.0,
      },
    ];

    const report: MISReportData = {
      clientId,
      clientName,
      gstin,
      financialYear,
      gstr1Vs3b,
      gstr2bVs3b,
      gstr9Outward,
      gstr9TaxPaid,
      totals: {
        fyGstr1Tax: 0.0,
        fyGstr3bTax: 0.0,
        fyLiabilityGap: 0.0,
        fyGstr2bItc: 0.0,
        fyGstr3bItc: 0.0,
        fyExcessItcClaimed: 0.0,
      },
    };

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate MIS reports';
    console.error('[API/MIS ERROR]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
