import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { MatrixApiResponse, MatrixRow } from '@/lib/matrix-types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedPeriod = searchParams.get('period') || '2026-07';
    const searchQuery = searchParams.get('search')?.toLowerCase().trim() || '';
    const statusFilter = searchParams.get('status') || 'ALL'; // ALL | PENDING_GSTR1 | PENDING_GSTR3B | FULLY_FILED | OVERDUE | QRMP

    // 1. Fetch available periods for selector dropdown
    const distinctPeriods = await prisma.gSTFilingStatus.findMany({
      select: { period: true },
      distinct: ['period'],
      orderBy: { period: 'desc' },
    });
    const availablePeriods = distinctPeriods.map((p) => p.period);

    // 2. Fetch all records for the selected period to compute practice-wide metrics
    const allPeriodRecords = await prisma.gSTFilingStatus.findMany({
      where: { period: selectedPeriod },
      orderBy: [{ clientCode: 'asc' }, { gstin: 'asc' }],
    });

    // Compute Metrics
    const totalGstins = allPeriodRecords.length;
    let gstr1FiledCount = 0;
    let gstr3bFiledCount = 0;
    let fullyFiledCount = 0;
    let overdueCount = 0;

    for (const r of allPeriodRecords) {
      const g1Filed = r.gstr1Status === 'FILED';
      const g3bFiled = r.gstr3bStatus === 'FILED';

      if (g1Filed) gstr1FiledCount++;
      if (g3bFiled) gstr3bFiledCount++;
      if (g1Filed && g3bFiled) fullyFiledCount++;
      if (r.gstr1Status === 'OVERDUE' || r.gstr3bStatus === 'OVERDUE') overdueCount++;
    }

    const gstr1Percentage = totalGstins > 0 ? Math.round((gstr1FiledCount / totalGstins) * 100) : 0;
    const gstr3bPercentage = totalGstins > 0 ? Math.round((gstr3bFiledCount / totalGstins) * 100) : 0;
    const pendingCount = totalGstins - fullyFiledCount;

    // 3. Apply search and filters for table display
    let filteredRecords = allPeriodRecords;

    if (searchQuery) {
      filteredRecords = filteredRecords.filter(
        (r) =>
          r.clientCode.toLowerCase().includes(searchQuery) ||
          r.clientName.toLowerCase().includes(searchQuery) ||
          r.gstin.toLowerCase().includes(searchQuery) ||
          r.stateCode.includes(searchQuery)
      );
    }

    if (statusFilter === 'PENDING_GSTR1') {
      filteredRecords = filteredRecords.filter((r) => r.gstr1Status !== 'FILED');
    } else if (statusFilter === 'PENDING_GSTR3B') {
      filteredRecords = filteredRecords.filter((r) => r.gstr3bStatus !== 'FILED');
    } else if (statusFilter === 'FULLY_FILED') {
      filteredRecords = filteredRecords.filter((r) => r.gstr1Status === 'FILED' && r.gstr3bStatus === 'FILED');
    } else if (statusFilter === 'OVERDUE') {
      filteredRecords = filteredRecords.filter((r) => r.gstr1Status === 'OVERDUE' || r.gstr3bStatus === 'OVERDUE');
    } else if (statusFilter === 'QRMP') {
      filteredRecords = filteredRecords.filter((r) => r.isQrmp);
    }

    const rows: MatrixRow[] = filteredRecords.map((r) => ({
      id: r.id,
      clientId: r.clientId,
      clientCode: r.clientCode,
      clientName: r.clientName,
      gstin: r.gstin,
      stateCode: r.stateCode,
      period: r.period,
      financialYear: r.financialYear,
      isQrmp: r.isQrmp,
      gstr1Status: r.gstr1Status as 'FILED' | 'PENDING' | 'OVERDUE',
      gstr1Arn: r.gstr1Arn,
      gstr1FilingDate: r.gstr1FilingDate ? r.gstr1FilingDate.toISOString() : null,
      gstr3bStatus: r.gstr3bStatus as 'FILED' | 'PENDING' | 'OVERDUE',
      gstr3bArn: r.gstr3bArn,
      gstr3bFilingDate: r.gstr3bFilingDate ? r.gstr3bFilingDate.toISOString() : null,
      gstr2bGenerated: r.gstr2bGenerated,
      lastSyncedAt: r.lastSyncedAt.toISOString(),
    }));

    const response: MatrixApiResponse = {
      period: selectedPeriod,
      financialYear: allPeriodRecords[0]?.financialYear || '2026-2027',
      availablePeriods,
      metrics: {
        totalGstins,
        gstr1FiledCount,
        gstr1Percentage,
        gstr3bFiledCount,
        gstr3bPercentage,
        fullyFiledCount,
        pendingCount,
        overdueCount,
      },
      rows,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch filing matrix';
    console.error('[API/MATRIX ERROR]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
