import express from 'express';
import cors from 'cors';
import { launchGSTLoginSession, getActiveSessionCount, type LoginRequest } from './gst-login';
import { executeGSTR4AImport, type GSTR4AImportRequest } from './gstr4a-import';
import { executeCMP08Filing, type CMP08FileRequest } from './cmp08-file';

const app = express();
const PORT = parseInt(process.env.COMPANION_PORT || '9090', 10);
const HOST = '127.0.0.1'; // Strictly loopback — no external access

// CORS: Allow ModusDesk and GSThub web UI origins
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3030',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3030',
      /^https:\/\/.*\.vercel\.app$/,
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: false,
  })
);

app.use(express.json({ limit: '10kb' }));

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    version: '1.0.0',
    activeSessions: getActiveSessionCount(),
    uptime: Math.floor(process.uptime()),
  });
});

// ── 1-Click GST Login Handler ─────────────────────────────────
async function handleLoginRequest(req: express.Request, res: express.Response) {
  try {
    const { portalUrl, username, password } = req.body as Partial<LoginRequest>;

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Username is required.' });
      return;
    }
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Password is required.' });
      return;
    }

    const result = await launchGSTLoginSession({
      portalUrl: portalUrl || 'https://services.gst.gov.in/services/login',
      username: username.trim(),
      password: password.trim(),
    });

    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during login launch.';
    console.error('[GST-LOGIN ERROR]', message);
    res.status(500).json({ success: false, error: message });
  }
}

app.post('/api/login', handleLoginRequest);
app.post('/launch-gst-login', handleLoginRequest);

// ── Automated GSTR-4A Import Handler ──────────────────────────
async function handleImportGSTR4ARequest(req: express.Request, res: express.Response) {
  try {
    const { username, password, financialYear, quarter, gstin } = req.body as Partial<GSTR4AImportRequest>;

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Username is required.' });
      return;
    }
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Password is required.' });
      return;
    }

    const result = await executeGSTR4AImport({
      username: username.trim(),
      password: password.trim(),
      financialYear: financialYear || '2026-27',
      quarter: quarter || 'Q2',
      gstin: gstin ? gstin.trim() : undefined,
    });

    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during GSTR-4A import.';
    console.error('[GSTR4A-IMPORT HANDLER ERROR]', message);
    res.status(500).json({ success: false, error: message });
  }
}

app.post('/api/import-gstr4a', handleImportGSTR4ARequest);

// ── Automated CMP-08 Filing Handler ───────────────────────────
async function handleFileCMP08Request(req: express.Request, res: express.Response) {
  try {
    const { username, password, financialYear, quarter, gstin, actualSales, rcmTaxableValue } = req.body as Partial<CMP08FileRequest>;

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Username is required.' });
      return;
    }
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Password is required.' });
      return;
    }

    const result = await executeCMP08Filing({
      username: username.trim(),
      password: password.trim(),
      financialYear: financialYear || '2026-27',
      quarter: quarter || 'Q2',
      gstin: gstin ? gstin.trim() : undefined,
      actualSales: Number(actualSales) || 0,
      rcmTaxableValue: Number(rcmTaxableValue) || 0,
    });

    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during CMP-08 filing.';
    console.error('[CMP08-FILE HANDLER ERROR]', message);
    res.status(500).json({ success: false, error: message });
  }
}

app.post('/api/file-cmp08', handleFileCMP08Request);

// ── Start Server ──────────────────────────────────────────────
const server = app.listen(PORT, HOST, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('  ModusDesk GSThub Desktop Companion v1.0.0');
  console.log(`  Running on http://${HOST}:${PORT}`);
  console.log('  Ready for 1-Click GST Login & GSTR-4A Auto-Import');
  console.log('═══════════════════════════════════════════════════');
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[INFO] Port ${PORT} is already in use by another instance. Exiting cleanly.`);
    process.exit(0);
  } else {
    console.error('[SERVER ERROR]', err);
    process.exit(1);
  }
});
