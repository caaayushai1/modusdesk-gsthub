import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
      request.nextUrl.searchParams.get('token') ||
      request.cookies.get('gsthub_token')?.value;

    let tokenOrigin: string | null = null;
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          if (payload.origin) tokenOrigin = payload.origin;
        }
      } catch {}
    }

    const candidateUrls = [
      tokenOrigin,
      process.env.NEXT_PUBLIC_MODUSDESK_URL,
      'https://app-steel-mu-76.vercel.app',
      'https://modusdesk.vercel.app',
      'http://localhost:3030',
    ].filter(Boolean) as string[];

    const headers: Record<string, string> = {};
    if (token) headers['authorization'] = `Bearer ${token}`;
    const devStaff = request.cookies.get('dev_staff_username')?.value;
    if (devStaff) headers['cookie'] = `dev_staff_username=${devStaff}`;

    let clients: any[] = [];
    for (const baseUrl of candidateUrls) {
      try {
        const res = await fetch(`${baseUrl}/api/integrations/gsthub/handshake`, {
          headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.clients && Array.isArray(json.clients)) {
            clients = json.clients;
            if (clients.length > 0) break;
          }
        }
      } catch {
        // try next candidate URL
      }
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
