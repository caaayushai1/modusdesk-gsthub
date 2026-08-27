import express from 'express';
import cors from 'cors';
import { launchGSTLoginSession, getActiveSessionCount, type LoginRequest } from './gst-login';

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

    // Strict input validation — zero assumptions
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

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, HOST, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('  ModusDesk GSThub Desktop Companion v1.0.0');
  console.log(`  Running on http://${HOST}:${PORT}`);
  console.log('  Ready for 1-Click GST Login & Portal Automation');
  console.log('═══════════════════════════════════════════════════');
});
