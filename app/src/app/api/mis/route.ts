import { NextRequest, NextResponse } from 'next/server';
import type { MISReportData } from '@/lib/mis-types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId') || 'client_001A';
    const clientName = searchParams.get('clientName') || 'Acme Corporation Ltd.';
    const gstin = searchParams.get('gstin') || '27AABCA1234F1Z5';
    const financialYear = searchParams.get('financialYear') || '2026-2027';

    // 1. GSTR-1 vs GSTR-3B Month-by-Month Liability Audit (Rule 88C)
    const gstr1Vs3b = [
      {
        month: 'April 2026',
        period: '2026-04',
        gstr1Taxable: 12000000.0,
        gstr1Tax: 2160000.0,
        gstr3bTaxable: 12000000.0,
        gstr3bTax: 2160000.0,
        taxDifference: 0.0,
        drc01bAlert: false,
      },
      {
        month: 'May 2026',
        period: '2026-05',
        gstr1Taxable: 13500000.0,
        gstr1Tax: 2430000.0,
        gstr3bTaxable: 13500000.0,
        gstr3bTax: 2430000.0,
        taxDifference: 0.0,
        drc01bAlert: false,
      },
      {
        month: 'June 2026',
        period: '2026-06',
        gstr1Taxable: 16000000.0,
        gstr1Tax: 2880000.0,
        gstr3bTaxable: 15200000.0,
        gstr3bTax: 2736000.0,
        taxDifference: 144000.0, // GSTR1 > 3B by ₹1,44,000
        drc01bAlert: true,      // ⚠️ DRC-01B Risk!
      },
      {
        month: 'July 2026',
        period: '2026-07',
        gstr1Taxable: 14850000.0,
        gstr1Tax: 2673000.0,
        gstr3bTaxable: 14850000.0,
        gstr3bTax: 2673000.0,
        taxDifference: 0.0,
        drc01bAlert: false,
      },
    ];

    // 2. GSTR-2B vs GSTR-3B ITC Comparison (Rule 88D)
    const gstr2bVs3b = [
      {
        month: 'April 2026',
        period: '2026-04',
        gstr2bItc: 1850000.0,
        gstr3bItcClaimed: 1850000.0,
        excessClaim: 0.0,
        drc01cAlert: false,
      },
      {
        month: 'May 2026',
        period: '2026-05',
        gstr2bItc: 2100000.0,
        gstr3bItcClaimed: 2100000.0,
        excessClaim: 0.0,
        drc01cAlert: false,
      },
      {
        month: 'June 2026',
        period: '2026-06',
        gstr2bItc: 2450000.0,
        gstr3bItcClaimed: 2575000.0,
        excessClaim: 125000.0, // 3B Claimed > 2B by ₹1,25,000
        drc01cAlert: true,     // ⚠️ DRC-01C Risk!
      },
      {
        month: 'July 2026',
        period: '2026-07',
        gstr2bItc: 2269000.0,
        gstr3bItcClaimed: 2269000.0,
        excessClaim: 0.0,
        drc01cAlert: false,
      },
    ];

    // 3. Annual GSTR-9 Synthesis Schedule
    const gstr9Outward = [
      {
        natureOfSupply: '4A. Supplies made to registered persons (B2B)',
        taxableValue: 56350000.0,
        igst: 4250000.0,
        cgst: 2944500.0,
        sgst: 2944500.0,
        cess: 0,
        totalTax: 10139000.0,
      },
      {
        natureOfSupply: '4B. Supplies made to unregistered persons (B2C)',
        taxableValue: 0.0,
        igst: 0,
        cgst: 0,
        sgst: 0,
        cess: 0,
        totalTax: 0,
      },
      {
        natureOfSupply: '4C. Zero rated supply (Export) on payment of tax',
        taxableValue: 0.0,
        igst: 0,
        cgst: 0,
        sgst: 0,
        cess: 0,
        totalTax: 0,
      },
      {
        natureOfSupply: '4N. Total Outward Supplies on which tax is payable',
        taxableValue: 56350000.0,
        igst: 4250000.0,
        cgst: 2944500.0,
        sgst: 2944500.0,
        cess: 0,
        totalTax: 10139000.0,
      },
    ];

    const gstr9TaxPaid = [
      {
        taxHead: 'Integrated Tax (IGST)',
        taxPayable: 4250000.0,
        paidViaCash: 485000.0,
        paidViaItc: 3765000.0,
      },
      {
        taxHead: 'Central Tax (CGST)',
        taxPayable: 2944500.0,
        paidViaCash: 430500.0,
        paidViaItc: 2514000.0,
      },
      {
        taxHead: 'State Tax (SGST)',
        taxPayable: 2944500.0,
        paidViaCash: 430500.0,
        paidViaItc: 2514000.0,
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
        fyGstr1Tax: 10143000.0,
        fyGstr3bTax: 9999000.0,
        fyLiabilityGap: 144000.0,
        fyGstr2bItc: 8669000.0,
        fyGstr3bItc: 8794000.0,
        fyExcessItcClaimed: 125000.0,
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
