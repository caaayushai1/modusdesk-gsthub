import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.nextUrl.searchParams.get('token') ||
      req.cookies.get('gsthub_token')?.value;

    // Parse token payload as immediate self-contained identity
    let tokenStaff: { id: string; name: string; email?: string | null; role: string } | null = null;
    let tokenFirm: { name: string } | null = null;
    let tokenAllowedClientIds: string[] | 'ALL' = 'ALL';
    let tokenOrigin: string | null = null;

    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          const now = Math.floor(Date.now() / 1000);
          if (!payload.expiresAt || payload.expiresAt >= now) {
            tokenStaff = {
              id: payload.staffId,
              name: payload.staffName,
              email: payload.staffEmail || payload.email || null,
              role: payload.role,
            };
            if (payload.firmName) {
              tokenFirm = { name: payload.firmName };
            }
            if (payload.allowedClientIds) {
              tokenAllowedClientIds = payload.allowedClientIds;
            }
            if (payload.origin) {
              tokenOrigin = payload.origin;
            }
          }
        }
      } catch (err) {
        console.warn('Failed to parse token payload in /api/clients:', err);
      }
    }

    const devStaff = req.cookies.get('dev_staff_username')?.value;

    // If neither token nor devStaff is present, this is clean Standalone Guest Mode
    if (!token && !devStaff) {
      return NextResponse.json({
        success: true,
        firm: null,
        staff: null,
        allowedClientIds: [],
        clients: []
      });
    }

    const candidateUrls = [
      tokenOrigin,
      process.env.NEXT_PUBLIC_MODUSDESK_URL,
      'https://app-steel-mu-76.vercel.app',
      'https://modusdesk.vercel.app',
      'http://localhost:3030',
    ].filter(Boolean) as string[];

    const headers: Record<string, string> = {};
    if (token) {
      headers['authorization'] = `Bearer ${token}`;
    }
    if (devStaff) {
      headers['cookie'] = `dev_staff_username=${devStaff}`;
    }

    let data: any = null;
    for (const baseUrl of candidateUrls) {
      try {
        const res = await fetch(`${baseUrl}/api/integrations/gsthub/handshake`, {
          headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) {
          data = await res.json();
          if (data && data.success) {
            break;
          }
        }
      } catch {
        // try next candidate URL
      }
    }

    if (data && data.success) {
      return NextResponse.json({
        success: true,
        firm: tokenFirm || data.firm,
        staff: tokenStaff || data.staff,
        allowedClientIds: tokenAllowedClientIds !== 'ALL' ? tokenAllowedClientIds : (data.allowedClientIds || 'ALL'),
        clients: data.clients || []
      });
    }

    // Fallback: return token staff/firm and empty clients list rather than hardcoded mock data
    return NextResponse.json({
      success: true,
      firm: tokenFirm,
      staff: tokenStaff,
      allowedClientIds: tokenAllowedClientIds,
      clients: []
    });
  } catch (error: any) {
    console.error('GSThub clients fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch clients' }, { status: 500 });
  }
}
