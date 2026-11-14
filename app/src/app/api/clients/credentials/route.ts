import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('clientId');
    const gstin = req.nextUrl.searchParams.get('gstin');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('gsthub_token')?.value;

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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['authorization'] = `Bearer ${token}`;
    }
    const devStaff = req.cookies.get('dev_staff_username')?.value;
    if (devStaff) {
      headers['cookie'] = `dev_staff_username=${devStaff}`;
    }

    let resultData: any = null;
    let lastError = 'Failed to fetch client credentials';

    for (const baseUrl of candidateUrls) {
      try {
        const url = `${baseUrl}/api/integrations/gsthub/portal-login?clientId=${encodeURIComponent(clientId)}${gstin ? `&gstin=${encodeURIComponent(gstin)}` : ''}`;
        const res = await fetch(url, {
          method: 'GET',
          headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            resultData = json.data;
            break;
          }
        } else {
          const errJson = await res.json().catch(() => ({}));
          if (errJson.error) lastError = errJson.error;
        }
      } catch (e: any) {
        lastError = e?.message || lastError;
      }
    }

    if (resultData) {
      return NextResponse.json({
        success: true,
        credentials: {
          username: resultData.username,
          password: resultData.password,
          gstin: resultData.gstin,
        }
      });
    }

    return NextResponse.json({ error: lastError }, { status: 404 });
  } catch (error: any) {
    console.error('Error fetching client credentials:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
