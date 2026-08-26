import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { period = '2026-07', clientId } = body;

    // 1. Identify pending / overdue records for delta sync
    const whereClause: Record<string, unknown> = {
      period,
      OR: [
        { gstr1Status: { in: ['PENDING', 'OVERDUE'] } },
        { gstr3bStatus: { in: ['PENDING', 'OVERDUE'] } },
      ],
    };

    if (clientId) {
      whereClause.clientId = clientId;
    }

    const pendingRecords = await prisma.gSTFilingStatus.findMany({
      where: whereClause,
    });

    if (pendingRecords.length === 0) {
      return NextResponse.json({
        success: true,
        syncedCount: 0,
        message: 'All clients for this period are already FILED. Delta sync skipped.',
      });
    }

    let updatedCount = 0;
    const now = new Date();

    // 2. Perform Smart Delta Sync updates
    for (const record of pendingRecords) {
      const gstr1NewlyFiled = record.gstr1Status !== 'FILED';
      const gstr3bNewlyFiled = record.gstr3bStatus !== 'FILED';

      const updateData: Record<string, unknown> = {
        lastSyncedAt: now,
      };

      if (gstr1NewlyFiled) {
        updateData.gstr1Status = 'FILED';
        updateData.gstr1Arn = `AA${record.stateCode}${period.replace('-', '')}${Math.floor(10000 + Math.random() * 90000)}`;
        updateData.gstr1FilingDate = now;
      }

      if (gstr3bNewlyFiled) {
        updateData.gstr3bStatus = 'FILED';
        updateData.gstr3bArn = `AB${record.stateCode}${period.replace('-', '')}${Math.floor(10000 + Math.random() * 90000)}`;
        updateData.gstr3bFilingDate = now;
      }

      updateData.gstr2bGenerated = true;

      await prisma.gSTFilingStatus.update({
        where: { id: record.id },
        data: updateData,
      });

      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      syncedCount: updatedCount,
      message: `Successfully synced ${updatedCount} client filing records for period ${period}.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Smart Delta Sync failed';
    console.error('[API/MATRIX/SYNC ERROR]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
