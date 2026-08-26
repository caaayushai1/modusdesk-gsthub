import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const data = {
      practiceOverview: {
        totalClients: 10,
        totalGstins: 40,
        monthlyClients: 32,
        qrmpClients: 8,
        activeFiscalYear: 'FY 2026-27',
        activePeriod: '2026-07',
      },
      kpis: {
        complianceRate: 78, // 78% of returns filed on time
        totalFiledThisMonth: 31,
        totalPendingThisMonth: 6,
        totalOverdueThisMonth: 3,
        totalAtRiskItc: 228600, // Amount at risk from defaulting vendors
        totalCreditLedgerBalance: 3150000, // Practice total credit available
        totalCashLedgerBalance: 300000,
      },
      upcomingDeadlines: [
        {
          returnType: 'GSTR-1 (Monthly)',
          description: 'Outward supplies for July 2026 (Turnover > ₹5 Cr or Non-QRMP)',
          dueDate: '2026-08-11',
          daysRemaining: -15, // Overdue / Past
          status: 'OVERDUE_FOR_PENDING',
          category: 'Monthly Return',
        },
        {
          returnType: 'GSTR-1 IFF (QRMP)',
          description: 'Invoice Furnishing Facility for July 2026 (Optional QRMP)',
          dueDate: '2026-08-13',
          daysRemaining: -13,
          status: 'PAST',
          category: 'QRMP Quarterly',
        },
        {
          returnType: 'GSTR-3B (Monthly)',
          description: 'Monthly summary return & tax payment for July 2026',
          dueDate: '2026-08-20',
          daysRemaining: -6,
          status: 'ACTION_REQUIRED',
          category: 'Tax Discharge',
        },
        {
          returnType: 'PMT-06 (QRMP Month 1/2)',
          description: 'Fixed 35% or Self-Assessment tax challan deposit for QRMP',
          dueDate: '2026-08-25',
          daysRemaining: -1,
          status: 'URGENT',
          category: 'Tax Deposit',
        },
        {
          returnType: 'GSTR-1 (August 2026)',
          description: 'Outward supplies for August 2026',
          dueDate: '2026-09-11',
          daysRemaining: 16,
          status: 'UPCOMING',
          category: 'Next Cycle',
        },
      ],
      recentActivities: [
        {
          id: 'act_1',
          timestamp: '10 mins ago',
          type: 'SYNC',
          title: 'Smart Delta Sync Executed',
          description: 'Synced 10 practice clients for period Jul 2026. 31 filed, 3 overdue.',
          status: 'SUCCESS',
        },
        {
          id: 'act_2',
          timestamp: '25 mins ago',
          type: 'LOGIN',
          title: 'Automated Login Launched',
          description: 'Headed Chrome session opened for Acme Corporation Ltd. (27AABCA1234F1Z5).',
          status: 'SUCCESS',
        },
        {
          id: 'act_3',
          timestamp: '1 hour ago',
          type: 'RECO',
          title: 'GSTR-2B Reconciliation Run',
          description: 'Reconciled 7 purchase invoices against GSTR-2B. ₹2.28L At-Risk ITC flagged.',
          status: 'WARNING',
        },
        {
          id: 'act_4',
          timestamp: '2 hours ago',
          type: 'OFFSET',
          title: 'Rule 88A Tax Offset Simulated',
          description: 'Computed optimal IGST/CGST credit utilization for TechFlow Solutions LLP.',
          status: 'SUCCESS',
        },
      ],
      defaulterWatchlist: [
        {
          clientCode: '003A',
          clientName: 'Singhania Global Freight',
          gstin: '27AASCS1122K1Z1',
          issue: 'GSTR-3B Overdue (Jul 2026)',
          severity: 'HIGH',
          action: 'Follow up for tax payment',
        },
        {
          clientCode: '007A',
          clientName: 'Sunrise Diagnostics Center',
          gstin: '27AASCS7766R1Z0',
          issue: 'GSTR-1 & 3B Pending (Jul 2026)',
          severity: 'HIGH',
          action: 'Initiate data collection',
        },
        {
          clientCode: '001A',
          clientName: 'Acme Corporation Ltd.',
          gstin: '27AABCA1234F1Z5',
          issue: '₹2.28L Missing ITC from 2 vendors',
          severity: 'MEDIUM',
          action: 'Send vendor follow-up notices',
        },
      ],
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Dashboard error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
