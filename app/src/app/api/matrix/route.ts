import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { MatrixApiResponse, MatrixRow } from '@/lib/matrix-types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const selectedPeriod = searchParams.get('period') || '2026-07';
    const statusFilter = searchParams.get('status') || 'ALL';
    const schemeFilter = searchParams.get('scheme') || 'ALL';
    const searchQuery = (searchParams.get('q') || '').toLowerCase().trim();

    // Fetch authorized clients from ModusDesk
    const token = req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('gsthub_token')?.value;

    const modusdeskUrl = process.env.NEXT_PUBLIC_MODUSDESK_URL || 'http://localhost:3030';
    const headers: Record<string, string> = {};
    if (token) {
      headers['authorization'] = `Bearer ${token}`;
    }
    const devStaff = req.cookies.get('dev_staff_username')?.value;
    if (devStaff) {
      headers['cookie'] = `dev_staff_username=${devStaff}`;
    }

    let authorizedClients: Array<{ id: string; name: string; code: string; gstin: string }> = [];

    try {
      const handshakeRes = await fetch(`${modusdeskUrl}/api/integrations/gsthub/handshake`, {
        headers,
        cache: 'no-store',
      });
      if (handshakeRes.ok) {
        const handshakeData = await handshakeRes.json();
        if (handshakeData.clients && Array.isArray(handshakeData.clients)) {
          authorizedClients = handshakeData.clients.map((c: any) => ({
            id: c.id,
            name: c.clientName || c.name || '---',
            code: c.clientCode || c.code || '---',
            gstin: c.gstin || '',
          }));
        }
      }
    } catch (e) {
      console.warn('Could not sync authorized clients from ModusDesk:', e);
    }

    let rows: MatrixRow[] = [];

    if (authorizedClients.length > 0) {
      // Synchronize SQLite rows for authorized clients
      for (const c of authorizedClients) {
        const gstin = c.gstin || '';
        if (!gstin) continue;
        await prisma.gSTFilingStatus.upsert({
          where: {
            clientId_gstin_period: {
              clientId: c.id,
              gstin,
              period: selectedPeriod,
            },
          },
          update: {
            clientName: c.name,
            clientCode: c.code,
          },
          create: {
            clientId: c.id,
            clientCode: c.code,
            clientName: c.name,
            gstin,
            stateCode: gstin.substring(0, 2) || '27',
            period: selectedPeriod,
            financialYear: '2026-2027',
            gstr1Status: 'PENDING',
            gstr1Arn: null,
            gstr1FilingDate: null,
            gstr3bStatus: 'PENDING',
            gstr3bArn: null,
            gstr3bFilingDate: null,
            gstr2bGenerated: false,
          },
        }).catch(() => null);
      }

      const authorizedClientIds = authorizedClients.map((c) => c.id);
      const dbRecords = await prisma.gSTFilingStatus.findMany({
        where: {
          period: selectedPeriod,
          clientId: { in: authorizedClientIds },
        },
        orderBy: [{ clientCode: 'asc' }, { gstin: 'asc' }],
      });

      rows = dbRecords.map((r) => ({
        id: r.id,
        clientId: r.clientId,
        clientCode: r.clientCode,
        clientName: r.clientName,
        gstin: r.gstin,
        stateCode: r.stateCode,
        period: r.period,
        financialYear: r.financialYear || '2026-2027',
        isQrmp: false,
        frequency: 'MONTHLY' as const,
        gstr1Status: (r.gstr1Status as any) || 'PENDING',
        gstr1Arn: r.gstr1Arn,
        gstr1FilingDate: r.gstr1FilingDate ? r.gstr1FilingDate.toISOString().split('T')[0] : null,
        gstr3bStatus: (r.gstr3bStatus as any) || 'PENDING',
        gstr3bArn: r.gstr3bArn,
        gstr3bFilingDate: r.gstr3bFilingDate ? r.gstr3bFilingDate.toISOString().split('T')[0] : null,
        gstr2bGenerated: r.gstr2bGenerated,
        lastSyncedAt: r.lastSyncedAt ? r.lastSyncedAt.toISOString() : new Date().toISOString(),
      }));
    }

    // Compute Metrics
    const totalGstins = rows.length;
    let gstr1FiledCount = 0;
    let gstr3bFiledCount = 0;
    let fullyFiledCount = 0;
    let overdueCount = 0;

    for (const r of rows) {
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

    // Apply search filter
    let filteredRecords = rows;

    if (searchQuery) {
      filteredRecords = filteredRecords.filter(
        (r) =>
          r.clientCode.toLowerCase().includes(searchQuery) ||
          r.clientName.toLowerCase().includes(searchQuery) ||
          r.gstin.toLowerCase().includes(searchQuery) ||
          r.stateCode.includes(searchQuery)
      );
    }

    // Apply status filter
    if (statusFilter === 'PENDING') {
      filteredRecords = filteredRecords.filter((r) => r.gstr1Status !== 'FILED' || r.gstr3bStatus !== 'FILED');
    } else if (statusFilter === 'PENDING_GSTR1') {
      filteredRecords = filteredRecords.filter((r) => r.gstr1Status !== 'FILED' && (r.gstr1Status as any) !== 'NOT_APPLICABLE');
    } else if (statusFilter === 'PENDING_GSTR3B') {
      filteredRecords = filteredRecords.filter((r) => r.gstr3bStatus !== 'FILED');
    } else if (statusFilter === 'OVERDUE') {
      filteredRecords = filteredRecords.filter((r) => r.gstr1Status === 'OVERDUE' || r.gstr3bStatus === 'OVERDUE');
    } else if (statusFilter === 'FULLY_FILED') {
      filteredRecords = filteredRecords.filter((r) => (r.gstr1Status === 'FILED' || (r.gstr1Status as any) === 'NOT_APPLICABLE') && r.gstr3bStatus === 'FILED');
    }

    // Apply scheme filter
    if (schemeFilter === 'MONTHLY') {
      filteredRecords = filteredRecords.filter((r) => r.frequency === 'MONTHLY');
    } else if (schemeFilter === 'QRMP') {
      filteredRecords = filteredRecords.filter((r) => r.frequency === 'QRMP');
    } else if (schemeFilter === 'COMPOSITION') {
      filteredRecords = filteredRecords.filter((r) => r.frequency === 'COMPOSITION');
    }

    return NextResponse.json({
      rows: filteredRecords,
      totalCount: filteredRecords.length,
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
      availablePeriods: ['2026-07', '2026-06', '2026-05', '2026-04'],
    });
  } catch (error: any) {
    console.error('Matrix GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch matrix data' }, { status: 500 });
  }
}
