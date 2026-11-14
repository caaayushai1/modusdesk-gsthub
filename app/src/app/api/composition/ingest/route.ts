import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { aggregateGSTR2AInwardInvoices, computeCompositionQuarter, IngestedInvoice } from '@/lib/composition-calculator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientId,
      clientCode,
      clientName,
      gstin,
      financialYear = '2026-27',
      quarter = 'Q2',
      invoices = [], // Array of IngestedInvoice
      source = 'GSTR2A_COMPANION', // 'GSTR2A_COMPANION' | 'EXCEL_UPLOAD'
      gpMargin = 10.0,
      openingStock = 0,
      actualSales = 0,
    } = body;

    if (!clientId || !gstin) {
      return NextResponse.json({ error: 'clientId and gstin are required' }, { status: 400 });
    }

    if (!Array.isArray(invoices)) {
      return NextResponse.json({ error: 'invoices must be an array' }, { status: 400 });
    }

    // 1. Aggregate inward invoices
    const aggregated = aggregateGSTR2AInwardInvoices(invoices);

    // 2. Fetch existing ledger or default
    const existingLedger = await prisma.compositionSchemeLedger.findUnique({
      where: {
        clientId_gstin_financialYear_quarter: {
          clientId,
          gstin,
          financialYear,
          quarter,
        }
      }
    });

    const effOpeningStock = existingLedger ? Number(existingLedger.openingStock) : Number(openingStock) || 0;
    const effGpMargin = existingLedger ? Number(existingLedger.gpMargin) : Number(gpMargin) || 10.0;
    const effActualSales = existingLedger ? Number(existingLedger.actualSales) : Number(actualSales) || 0;
    const effSalesMode = existingLedger ? (existingLedger.salesMode as 'ACTUAL' | 'DERIVED') : 'ACTUAL';
    const effTaxRate = existingLedger ? Number(existingLedger.taxRateOnSales) : 1.0;

    // 3. Compute statutory quarter values
    const computed = computeCompositionQuarter({
      openingStock: effOpeningStock,
      totalPurchases: aggregated.totalPurchases,
      rcmTaxableValue: aggregated.rcmTaxableValue,
      rcmTaxPayable: aggregated.rcmTaxPayable,
      gpMarginPercent: effGpMargin,
      salesMode: effSalesMode,
      actualSales: effActualSales,
      taxRatePercent: effTaxRate,
    });

    // 4. Save ledger
    const ledger = await prisma.compositionSchemeLedger.upsert({
      where: {
        clientId_gstin_financialYear_quarter: {
          clientId,
          gstin,
          financialYear,
          quarter,
        }
      },
      create: {
        clientId,
        clientCode: clientCode || '---',
        clientName: clientName || 'Client',
        gstin,
        financialYear,
        quarter,
        openingStock: computed.openingStock,
        totalPurchases: computed.totalPurchases,
        rcmTaxableValue: computed.rcmTaxableValue,
        rcmTaxPayable: computed.rcmTaxPayable,
        gpMargin: computed.gpMarginPercent,
        salesMode: computed.salesMode,
        actualSales: computed.sales,
        taxRateOnSales: computed.taxRatePercent,
        taxPayableOnSales: computed.taxPayableOnSales,
        totalCmp08Tax: computed.totalCmp08Tax,
        closingStock: computed.closingStock,
      },
      update: {
        totalPurchases: computed.totalPurchases,
        rcmTaxableValue: computed.rcmTaxableValue,
        rcmTaxPayable: computed.rcmTaxPayable,
        taxPayableOnSales: computed.taxPayableOnSales,
        totalCmp08Tax: computed.totalCmp08Tax,
        closingStock: computed.closingStock,
      }
    });

    // 5. Replace existing invoices for this quarter/source to ensure clean idempotent ingestion
    await prisma.compositionInwardInvoice.deleteMany({
      where: {
        clientId,
        gstin,
        financialYear,
        quarter,
        source,
      }
    });

    // 6. Bulk insert inward invoices
    if (invoices.length > 0) {
      await prisma.compositionInwardInvoice.createMany({
        data: invoices.map((inv: IngestedInvoice) => ({
          ledgerId: ledger.id,
          clientId,
          gstin,
          financialYear,
          quarter,
          supplierGstin: inv.supplierGstin || 'UNKNOWN',
          supplierName: inv.supplierName || null,
          invoiceNumber: inv.invoiceNumber || 'INV-001',
          invoiceDate: inv.invoiceDate || new Date().toISOString().slice(0, 10),
          invoiceValue: Number(inv.invoiceValue) || 0,
          taxableValue: Number(inv.taxableValue) || 0,
          igst: Number(inv.igst) || 0,
          cgst: Number(inv.cgst) || 0,
          sgst: Number(inv.sgst) || 0,
          cess: Number(inv.cess) || 0,
          rate: Number(inv.rate) || 0,
          isRcm: Boolean(inv.isRcm),
          source,
        }))
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ingested ${invoices.length} GSTR-2A invoices for ${ledger.clientName} (${quarter})`,
      aggregated,
      computation: computed,
      ledgerId: ledger.id,
    });
  } catch (err: any) {
    console.error('Error in GSTR-2A composition ingestion:', err);
    return NextResponse.json({ error: err.message || 'Ingestion failed' }, { status: 500 });
  }
}
