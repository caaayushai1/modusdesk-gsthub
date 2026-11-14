import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'ModusDesk-GST-Companion-Setup.bat');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Setup script file not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-bat',
        'Content-Disposition': 'attachment; filename="ModusDesk-GST-Companion-Setup.bat"',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Error serving companion setup script in GSThub:', error);
    return NextResponse.json({ error: 'Failed to download companion setup' }, { status: 500 });
  }
}
