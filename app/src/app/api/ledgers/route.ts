import { NextRequest, NextResponse } from 'next/server';
import type { CreditLedgerBalance, CashLedgerBalance } from '@/lib/ledger-types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId') || 'client_001A';

    // Electronic Credit Ledger
    const creditLedger: CreditLedgerBalance = {
      igst: 1420000.0,
      cgst: 865000.0,
      sgst: 865000.0,
      cess: 0.0,
      totalCredit: 3150000.0,
    };

    // Electronic Cash Ledger
    const cashLedger: CashLedgerBalance = {
      igst: { tax: 150000.0, interest: 0, penalty: 0, fee: 0, other: 0, total: 150000.0 },
      cgst: { tax: 75000.0, interest: 0, penalty: 0, fee: 0, other: 0, total: 75000.0 },
      sgst: { tax: 75000.0, interest: 0, penalty: 0, fee: 0, other: 0, total: 75000.0 },
      cess: { tax: 0, interest: 0, penalty: 0, fee: 0, other: 0, total: 0 },
      totalCash: 300000.0,
    };

    return NextResponse.json({
      success: true,
      clientId,
      asOfDate: new Date().toISOString(),
      creditLedger,
      cashLedger,
      liabilityBalance: 0.0,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch ledger balances';
    console.error('[API/LEDGERS ERROR]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
