import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Split JWT
    const parts = token.split('.');
    if (parts.length !== 3) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.expiresAt && payload.expiresAt < now) {
      return NextResponse.json({ error: 'Handshake token expired' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        staffId: payload.staffId,
        staffName: payload.staffName,
        role: payload.role,
        allowedClientIds: payload.allowedClientIds
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Handshake verification failed' }, { status: 500 });
  }
}
