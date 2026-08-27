import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
      request.nextUrl.searchParams.get('token') ||
      request.cookies.get('gsthub_token')?.value;

    const modusdeskUrl = process.env.NEXT_PUBLIC_MODUSDESK_URL || 'http://localhost:3030';
    const headers: Record<string, string> = {};
    if (token) headers['authorization'] = `Bearer ${token}`;
    const devStaff = request.cookies.get('dev_staff_username')?.value;
    if (devStaff) headers['cookie'] = `dev_staff_username=${devStaff}`;

    let clients: any[] = [];
    try {
      const res = await fetch(`${modusdeskUrl}/api/integrations/gsthub/handshake`, {
        headers,
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        clients = json.clients || [];
      }
    } catch {
      // fallback
    }

    const totalClients = clients.length;
    const totalGstins = clients.length;

    const data = {
      practiceOverview: {
        totalClients,
        totalGstins,
        monthlyClients: totalClients,
        qrmpClients: 0,
        activeFiscalYear: 'FY 2026-27',
        activePeriod: '2026-07',
      },
      kpis: {
        complianceRate: 0,
        totalFiledThisMonth: 0,
        totalPendingThisMonth: totalClients,
        totalOverdueThisMonth: 0,
        totalAtRiskItc: 0,
        totalCreditLedgerBalance: 0,
        totalCashLedgerBalance: 0,
      },
      upcomingDeadlines: [
        {
          returnType: 'GSTR-1 (August 2026)',
          description: 'Outward supplies for August 2026 (Monthly)',
          dueDate: '2026-09-11',
          daysRemaining: 15,
          status: 'UPCOMING',
          category: 'Monthly Return',
        },
        {
          returnType: 'GSTR-3B (August 2026)',
          description: 'Summary return & tax payment for August 2026',
          dueDate: '2026-09-20',
          daysRemaining: 24,
          status: 'UPCOMING',
          category: 'Tax Discharge',
        },
      ],
      recentActivities: totalClients > 0
        ? [
            {
              id: 'act_1',
              timestamp: 'Just now',
              type: 'SYNC',
              title: 'Practice Scope Synchronized',
              description: `Connected ${totalClients} authorized practice client${totalClients === 1 ? '' : 's'}.`,
              status: 'SUCCESS',
            },
          ]
        : [],
      defaulterWatchlist: [],
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
    console.error('[API/DASHBOARD ERROR]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
