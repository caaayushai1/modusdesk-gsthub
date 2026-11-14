import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { computeCompositionQuarter } from '@/lib/composition-calculator';

export const dynamic = 'force-dynamic';

function getPreviousQuarter(quarter: string, fy: string): { prevQuarter: string; prevFy: string } | null {
  if (quarter === 'Q2') return { prevQuarter: 'Q1', prevFy: fy };
  if (quarter === 'Q3') return { prevQuarter: 'Q2', prevFy: fy };
  if (quarter === 'Q4') return { prevQuarter: 'Q3', prevFy: fy };
  // For Q1, previous quarter is Q4 of prior FY e.g. "2026-27" -> "2025-26"
  const match = fy.match(/(\d{4})[-–](\d{2})/);
  if (match) {
    const y1 = parseInt(match[1], 10) - 1;
    const y2 = parseInt(match[2], 10) - 1;
    const prevFy = `${y1}-${String(y2).padStart(2, '0')}`;
    return { prevQuarter: 'Q4', prevFy };
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const financialYear = req.nextUrl.searchParams.get('fy') || '2026-27';
    const quarter = req.nextUrl.searchParams.get('quarter') || 'Q2';
    const clientId = req.nextUrl.searchParams.get('clientId');

    const whereClause: any = {
      financialYear,
      quarter,
    };
    if (clientId) {
      whereClause.clientId = clientId;
    }

    const records = await prisma.compositionSchemeLedger.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { inwardInvoices: true }
        }
      },
      orderBy: { clientCode: 'asc' }
    });

    // Check previous quarter closing stocks for auto-carryforward
    const prev = getPreviousQuarter(quarter, financialYear);
    const enrichedRecords = await Promise.all(
      records.map(async (rec) => {
        let prevClosingStock: number | null = null;
        if (prev) {
          const prevRec = await prisma.compositionSchemeLedger.findUnique({
            where: {
              clientId_gstin_financialYear_quarter: {
                clientId: rec.clientId,
                gstin: rec.gstin,
                financialYear: prev.prevFy,
                quarter: prev.prevQuarter,
              }
            }
          });
          if (prevRec) {
            prevClosingStock = Number(prevRec.closingStock);
          }
        }

        return {
          id: rec.id,
          clientId: rec.clientId,
          clientCode: rec.clientCode,
          clientName: rec.clientName,
          gstin: rec.gstin,
          financialYear: rec.financialYear,
          quarter: rec.quarter,
          openingStock: Number(rec.openingStock),
          prevQuarterClosingStock: prevClosingStock,
          totalPurchases: Number(rec.totalPurchases),
          rcmTaxableValue: Number(rec.rcmTaxableValue),
          rcmTaxPayable: Number(rec.rcmTaxPayable),
          gpMargin: Number(rec.gpMargin),
          salesMode: rec.salesMode,
          actualSales: Number(rec.actualSales),
          taxRateOnSales: Number(rec.taxRateOnSales),
          taxPayableOnSales: Number(rec.taxPayableOnSales),
          totalCmp08Tax: Number(rec.totalCmp08Tax),
          closingStock: Number(rec.closingStock),
          status: rec.status,
          arn: rec.arn,
          notes: rec.notes,
          inwardInvoiceCount: rec._count.inwardInvoices,
          updatedAt: rec.updatedAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      financialYear,
      quarter,
      records: enrichedRecords
    });
  } catch (err: any) {
    console.error('Error fetching composition ledger:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch ledger' }, { status: 500 });
  }
}

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
      openingStock = 0,
      totalPurchases = 0,
      rcmTaxableValue = 0,
      rcmTaxPayable = 0,
      gpMargin = 10.0,
      salesMode = 'ACTUAL',
      actualSales = 0,
      targetClosingStock = 0,
      taxRateOnSales = 1.0,
      notes = ''
    } = body;

    if (!clientId || !gstin) {
      return NextResponse.json({ error: 'clientId and gstin are required' }, { status: 400 });
    }

    // Run statutory formula calculations
    const computed = computeCompositionQuarter({
      openingStock: Number(openingStock) || 0,
      totalPurchases: Number(totalPurchases) || 0,
      rcmTaxableValue: Number(rcmTaxableValue) || 0,
      rcmTaxPayable: Number(rcmTaxPayable) || 0,
      gpMarginPercent: Number(gpMargin) || 10.0,
      salesMode: salesMode === 'DERIVED' ? 'DERIVED' : 'ACTUAL',
      actualSales: Number(actualSales) || 0,
      targetClosingStock: Number(targetClosingStock) || 0,
      taxRatePercent: Number(taxRateOnSales) || 1.0,
    });

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
        clientName: clientName || 'Unknown Client',
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
        notes,
      },
      update: {
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
        notes,
      }
    });

    return NextResponse.json({
      success: true,
      ledger: {
        ...ledger,
        openingStock: Number(ledger.openingStock),
        totalPurchases: Number(ledger.totalPurchases),
        rcmTaxableValue: Number(ledger.rcmTaxableValue),
        rcmTaxPayable: Number(ledger.rcmTaxPayable),
        gpMargin: Number(ledger.gpMargin),
        actualSales: Number(ledger.actualSales),
        taxRateOnSales: Number(ledger.taxRateOnSales),
        taxPayableOnSales: Number(ledger.taxPayableOnSales),
        totalCmp08Tax: Number(ledger.totalCmp08Tax),
        closingStock: Number(ledger.closingStock),
      },
      computation: computed
    });
  } catch (err: any) {
    console.error('Error saving composition ledger:', err);
    return NextResponse.json({ error: err.message || 'Failed to save ledger' }, { status: 500 });
  }
}
