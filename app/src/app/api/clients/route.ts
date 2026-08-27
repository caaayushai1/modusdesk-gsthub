import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.nextUrl.searchParams.get('token') ||
      req.cookies.get('gsthub_token')?.value;

    const modusdeskUrl = process.env.NEXT_PUBLIC_MODUSDESK_URL || 'http://localhost:3030';
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['authorization'] = `Bearer ${token}`;
    }
    // Also pass forward dev staff cookie if present
    const devStaff = req.cookies.get('dev_staff_username')?.value;
    if (devStaff) {
      headers['cookie'] = `dev_staff_username=${devStaff}`;
    }

    const res = await fetch(`${modusdeskUrl}/api/integrations/gsthub/handshake`, {
      headers,
      cache: 'no-store',
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json({
        success: true,
        staff: data.staff,
        allowedClientIds: data.allowedClientIds,
        clients: data.clients || []
      });
    }

    // Fallback: return empty list rather than hardcoded mock data
    return NextResponse.json({
      success: true,
      clients: []
    });
  } catch (error: any) {
    console.error('GSThub clients fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch clients' }, { status: 500 });
  }
}
