import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({
      success: false,
      message: 'Direct portal download integration is currently in calibration. Please use Desktop Companion Quick Login.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch return data';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
