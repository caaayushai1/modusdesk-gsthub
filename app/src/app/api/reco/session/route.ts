import { NextRequest, NextResponse } from 'next/server';

// In-memory / server session cache for 30-day GSTN tokens
interface ApiSession {
  gstin: string;
  clientId: string;
  token: string;
  expiresAt: number; // timestamp
  activatedAt: string;
  durationDays: number;
}

const activeSessions: Map<string, ApiSession> = new Map();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gstin = (searchParams.get('gstin') || '').toUpperCase().trim();

  if (!gstin) {
    return NextResponse.json({ active: false });
  }

  const session = activeSessions.get(gstin);
  if (!session) {
    return NextResponse.json({ active: false });
  }

  const now = Date.now();
  if (now > session.expiresAt) {
    activeSessions.delete(gstin);
    return NextResponse.json({ active: false, expired: true });
  }

  const daysRemaining = Math.ceil((session.expiresAt - now) / (1000 * 60 * 60 * 24));

  return NextResponse.json({
    active: true,
    gstin: session.gstin,
    daysRemaining,
    activatedAt: session.activatedAt,
    durationDays: session.durationDays,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, gstin = '', clientId = '', otp = '' } = body;
    const cleanGstin = gstin.toUpperCase().trim();

    if (action === 'REQUEST_OTP') {
      if (!cleanGstin) {
        return NextResponse.json({ error: 'GSTIN is required' }, { status: 400 });
      }

      // In production, hits GSP / GSTN API: POST /taxpayerapi/v1.0/authenticate/otp
      return NextResponse.json({
        success: true,
        message: `OTP sent to registered mobile/email for GSTIN ${cleanGstin}. Valid for 10 minutes.`,
        maskedMobile: '+91 ******' + (cleanGstin.slice(-4) || '9912'),
      });
    }

    if (action === 'VERIFY_OTP') {
      if (!cleanGstin || !otp) {
        return NextResponse.json({ error: 'GSTIN and OTP are required' }, { status: 400 });
      }

      // Validate 6-digit OTP
      if (otp.length !== 6) {
        return NextResponse.json({ error: 'Invalid OTP. Must be 6 digits.' }, { status: 400 });
      }

      const durationDays = 30;
      const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;
      const sessionToken = `gstn_sess_${cleanGstin}_${Date.now()}`;

      const session: ApiSession = {
        gstin: cleanGstin,
        clientId,
        token: sessionToken,
        expiresAt,
        activatedAt: new Date().toISOString(),
        durationDays,
      };

      activeSessions.set(cleanGstin, session);

      return NextResponse.json({
        success: true,
        message: `30-Day API Session successfully activated for ${cleanGstin}. Valid for 30 days.`,
        session: {
          gstin: cleanGstin,
          daysRemaining: durationDays,
          activatedAt: session.activatedAt,
        },
      });
    }

    if (action === 'DISCONNECT') {
      activeSessions.delete(cleanGstin);
      return NextResponse.json({ success: true, message: 'Session disconnected.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Session management failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
