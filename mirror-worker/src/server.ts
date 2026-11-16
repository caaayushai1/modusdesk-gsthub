import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, execSync } from 'child_process';
import { launchGSTLoginSession, getActiveSessionCount, type LoginRequest } from './gst-login';
import { executeGSTR4AImport, type GSTR4AImportRequest } from './gstr4a-import';
import { executeCMP08Filing, type CMP08FileRequest } from './cmp08-file';
import { bringWindowToForeground } from './portal-steps';

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]', err);
});
process.on('exit', (code) => {
  console.log(`[PROCESS EXIT] Node process exiting with code: ${code}`);
});

const app = express();
const PORT = parseInt(process.env.COMPANION_PORT || '9090', 10);
const HOST = '127.0.0.1'; // Strictly loopback — no external network access

// ── Persistent Install Secret for Challenge-Response Verification ─────────
function getOrCreateInstallSecret(): string {
  try {
    const configDir = path.join(os.homedir(), '.modusdesk');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    const secretPath = path.join(configDir, 'companion.key');
    if (fs.existsSync(secretPath)) {
      const secret = fs.readFileSync(secretPath, 'utf8').trim();
      if (secret.length >= 32) return secret;
    }
    const newSecret = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretPath, newSecret, { mode: 0o600 });
    return newSecret;
  } catch {
    return 'modusdesk-gst-companion-local-install-key';
  }
}

const INSTALL_SECRET = getOrCreateInstallSecret();

// ── Strict CORS & Host Security (Zero Wildcard) ───────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3030',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3030',
  'https://modusdesk.vercel.app',
  'https://modusdesk-gsthub.vercel.app',
  'https://app-steel-mu-76.vercel.app',
];

const ALLOWED_ORIGIN_REGEX = /^https:\/\/(modusdesk|modusdesk-gsthub|app-steel-mu-76)(-[a-z0-9-]+)?\.vercel\.app$/;

app.use((req, res, next) => {
  // Validate Host header to prevent DNS rebinding attacks on loopback daemon
  const host = req.headers.host || '';
  if (!host.startsWith('127.0.0.1:') && !host.startsWith('localhost:')) {
    res.status(403).json({ error: 'Forbidden: Invalid Host header for loopback companion daemon.' });
    return;
  }
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, desktop scripts, or same-server requests)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGIN_REGEX.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS Not Allowed: Origin is not in ModusDesk allowlist.'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: false,
  })
);

app.use(express.json({ limit: '10kb' }));

// Read dynamic package version
const pkg = require('../package.json');
const COMPANION_VERSION = pkg.version || '1.0.4';

// ── Health Check with Signed Challenge & Minimum Version Support ──────────
app.get('/api/health', (req, res) => {
  const challenge = req.query.challenge as string | undefined;
  let challengeResponse: string | undefined;

  if (challenge && typeof challenge === 'string') {
    // Generate HMAC-SHA256 signature using per-install secret
    challengeResponse = crypto
      .createHmac('sha256', INSTALL_SECRET)
      .digest('hex');
  }

  res.json({
    status: 'HEALTHY',
    version: COMPANION_VERSION,
    minClientVersion: '1.0.0',
    activeSessions: getActiveSessionCount(),
    uptime: Math.floor(process.uptime()),
    challengeResponse,
  });
});

// ── 1-Click GST Login Handler ─────────────────────────────────────────────
async function handleLoginRequest(req: express.Request, res: express.Response) {
  try {
    const { username, password, portalUrl } = req.body as Partial<LoginRequest>;

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Username is required.' });
      return;
    }
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Password is required.' });
      return;
    }

    const result = await launchGSTLoginSession({
      username: username.trim(),
      password: password.trim(),
      portalUrl,
    });

    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during login launch.';
    console.error('[LOGIN HANDLER ERROR]', message);
    res.status(500).json({ success: false, error: message });
  }
}

app.post('/api/login', handleLoginRequest);
app.post('/launch-gst-login', handleLoginRequest);

// ── Automated GSTR-4A Import Handler ──────────────────────────────────────
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
      financialYear: financialYear || '2024-25',
      quarter: quarter || 'Q1',
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

// ── Automated CMP-08 Population Handler (STOPS at SAVE — NO AUTO-FILE) ───
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
      financialYear: financialYear || '2024-25',
      quarter: quarter || 'Q1',
      gstin: gstin ? gstin.trim() : undefined,
      actualSales: Number(actualSales) || 0,
      rcmTaxableValue: Number(rcmTaxableValue) || 0,
    });

    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during CMP-08 preparation.';
    console.error('[CMP08-PREPARE HANDLER ERROR]', message);
    res.status(500).json({ success: false, error: message });
  }
}

app.post('/api/file-cmp08', handleFileCMP08Request);

// ── Bring Window to Foreground On-Demand ──────────────────────────────────
app.post('/api/focus', (req, res) => {
  try {
    bringWindowToForeground('Goods');
    res.json({ success: true, message: 'Focus command dispatched.' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// ── Programmatic Restart Endpoint ────────────────────────────────────────
app.post('/api/restart', (req, res) => {
  res.json({ success: true, message: 'Restarting ModusDesk Companion daemon...' });
  setTimeout(() => {
    restartCompanionProcess();
  }, 500);
});

// ── Restart Helper ───────────────────────────────────────────────────────
function restartCompanionProcess() {
  console.log('[COMPANION] Self-restarting daemon process via start-silent.vbs...');
  try {
    const vbsScript = path.resolve(__dirname, '../start-silent.vbs');
    if (fs.existsSync(vbsScript)) {
      const child = spawn('cmd.exe', ['/c', 'wscript.exe', vbsScript], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      child.unref();
    }
  } catch (err) {
    console.error('[RESTART ERROR]', err);
  }
  process.exit(0);
}

// ── Start Server ─────────────────────────────────────────────────────────
const server = app.listen(PORT, HOST, () => {
  console.log('════════════════════════════════════════════════════════════');
  console.log(`  ModusDesk GSThub Desktop Companion v${COMPANION_VERSION}`);
  console.log(`  Running on http://${HOST}:${PORT}`);
  console.log('  Ready for 1-Click GST Login & GSTR-4A Auto-Import');
  console.log('════════════════════════════════════════════════════════════');
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[PORT CONFLICT] Port ${PORT} is occupied. Attempting automatic port takeover...`);
    try {
      if (process.platform === 'win32') {
        const output = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        const lines = output.trim().split('\n');
        for (const line of lines) {
          if (line.includes('LISTENING')) {
            const parts = line.trim().split(/\s+/);
            const stalePid = parts[parts.length - 1];
            if (stalePid && stalePid !== String(process.pid)) {
              console.log(`[PORT TAKEOVER] Terminating stale companion process PID ${stalePid}...`);
              execSync(`taskkill /F /PID ${stalePid}`);
            }
          }
        }
        setTimeout(() => {
          server.listen(PORT, HOST, () => {
            console.log(`[PORT TAKEOVER SUCCESS] ModusDesk Companion successfully bound to http://${HOST}:${PORT}`);
          });
        }, 1000);
        return;
      }
    } catch (takeoverErr) {
      console.error('[PORT TAKEOVER FAILED]', takeoverErr);
    }
    process.exit(1);
  } else {
    console.error('[SERVER ERROR]', err);
    process.exit(1);
  }
});
