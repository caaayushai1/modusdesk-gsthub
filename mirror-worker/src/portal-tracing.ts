/**
 * Portal Tracing & Observability
 *
 * Every automation run gets a unique directory under %TEMP%/modusdesk_traces/<runId>/ containing:
 *   trace.zip        — Playwright full trace (view: npx playwright show-trace trace.zip)
 *   failure_<step>.png — Masked screenshot on any error
 *   failure_<step>.html — HTML dump at failure point (passwords redacted)
 *   run.log          — Structured line-by-line log with timestamps
 *   console.log      — Browser console messages (credentials filtered)
 *   network.log      — GST portal network requests (URLs only, no bodies)
 */

import { BrowserContext, Page } from 'playwright-core';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { MASK_CSS } from './portal-selectors';

const TRACE_BASE_DIR = path.join(os.tmpdir(), 'modusdesk_traces');

// ── Run Artifact Container ─────────────────────────────────────────────────

export interface RunArtifacts {
  readonly runId: string;
  readonly runDir: string;
  readonly logLines: string[];
  readonly consoleLines: string[];
  readonly networkLines: string[];
}

export function createRun(label: string): RunArtifacts {
  const runId = `${label}_${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const runDir = path.join(TRACE_BASE_DIR, runId);
  fs.mkdirSync(runDir, { recursive: true });

  const artifacts: RunArtifacts = {
    runId,
    runDir,
    logLines: [],
    consoleLines: [],
    networkLines: [],
  };

  log(artifacts, `[RUN] Started: ${runId}`);
  log(artifacts, `[RUN] Artifacts directory: ${runDir}`);
  return artifacts;
}

// ── Logging ────────────────────────────────────────────────────────────────

export function log(artifacts: RunArtifacts, message: string): void {
  const timestamp = new Date().toISOString();
  const line = `${timestamp}  ${message}`;
  (artifacts.logLines as string[]).push(line);
  console.log(message);
}

export function saveLog(artifacts: RunArtifacts): void {
  try {
    const logPath = path.join(artifacts.runDir, 'run.log');
    fs.writeFileSync(logPath, artifacts.logLines.join('\n'), 'utf8');

    if (artifacts.consoleLines.length > 0) {
      fs.writeFileSync(
        path.join(artifacts.runDir, 'console.log'),
        artifacts.consoleLines.join('\n'),
        'utf8',
      );
    }
    if (artifacts.networkLines.length > 0) {
      fs.writeFileSync(
        path.join(artifacts.runDir, 'network.log'),
        artifacts.networkLines.join('\n'),
        'utf8',
      );
    }
    console.log(`[RUN] Logs saved → ${artifacts.runDir}`);
  } catch (err) {
    console.error('[RUN] Could not save logs:', err);
  }
}

// ── Playwright Tracing ─────────────────────────────────────────────────────

export async function startTracing(
  context: BrowserContext,
  artifacts: RunArtifacts,
): Promise<void> {
  await context.tracing.start({
    screenshots: true,
    snapshots: true,
    sources: false, // skip source files to keep trace compact
  });
  log(artifacts, '[TRACE] Tracing started.');
}

export async function saveTrace(
  context: BrowserContext,
  artifacts: RunArtifacts,
): Promise<void> {
  try {
    const tracePath = path.join(artifacts.runDir, 'trace.zip');
    await context.tracing.stop({ path: tracePath });
    log(artifacts, `[TRACE] Saved → ${tracePath}`);
    log(artifacts, `[TRACE] View with:  npx playwright show-trace "${tracePath}"`);
  } catch (err) {
    log(artifacts, `[TRACE] Could not save trace: ${err}`);
  }
}

// ── Failure Artifact Capture ───────────────────────────────────────────────

/**
 * Captures a masked screenshot + HTML dump when a step fails.
 * Credentials are hidden before the screenshot is taken.
 * Sensitive attribute values are stripped from the HTML dump.
 */
export async function captureFailureArtifacts(
  page: Page,
  artifacts: RunArtifacts,
  stepName: string,
): Promise<void> {
  const safeName = stepName.replace(/[^a-zA-Z0-9_-]/g, '_');

  try {
    // 1. Inject credential-masking CSS before screenshot
    await page.addStyleTag({ content: MASK_CSS }).catch(() => {});

    // 2. Masked screenshot
    const ssPath = path.join(artifacts.runDir, `failure_${safeName}.png`);
    await page.screenshot({ path: ssPath, fullPage: true }).catch(() => {});
    log(artifacts, `[ARTIFACT] Screenshot → ${ssPath}`);

    // 3. HTML dump with values redacted
    const rawHtml = await page.content().catch(() => '');
    const redacted = rawHtml
      .replace(/(<input[^>]*type=["']password["'][^>]*)value=["'][^"']*["']/gi, '$1value="[REDACTED]"')
      .replace(/(<input[^>]*id=["'](captcha|user_pass|otp)[^"']*["'][^>]*)value=["'][^"']*["']/gi, '$1value="[REDACTED]"');
    const htmlPath = path.join(artifacts.runDir, `failure_${safeName}.html`);
    fs.writeFileSync(htmlPath, redacted, 'utf8');
    log(artifacts, `[ARTIFACT] HTML dump → ${htmlPath}`);

    // 4. Current URL
    log(artifacts, `[ARTIFACT] URL at failure: ${page.url()}`);
  } catch (captureErr) {
    log(artifacts, `[ARTIFACT] Could not capture some artifacts: ${captureErr}`);
  }
}

// ── Browser Console & Network Capture ─────────────────────────────────────

/** Redact any console message that looks like it contains credentials */
function redactConsoleLine(text: string): string | null {
  if (/password|user_pass|secret|FIELD_ENCRYPTION/i.test(text)) return null;
  return text.substring(0, 300);
}

export function setupConsoleCapture(page: Page, artifacts: RunArtifacts): void {
  page.on('console', (msg) => {
    if (!['log', 'warn', 'error', 'info'].includes(msg.type())) return;
    const safe = redactConsoleLine(msg.text());
    if (safe === null) return;
    const line = `[CONSOLE:${msg.type()}] ${safe}`;
    (artifacts.consoleLines as string[]).push(line);
    if (msg.type() === 'error') log(artifacts, line);
  });

  page.on('pageerror', (err) => {
    const safe = redactConsoleLine(err.message);
    if (safe) log(artifacts, `[PAGE-ERROR] ${safe}`);
  });
}

export function setupNetworkCapture(page: Page, artifacts: RunArtifacts): void {
  page.on('response', (res) => {
    const url = res.url();
    // Log only GST portal API calls, not static assets
    if (
      url.includes('gst.gov.in') &&
      !/\.(css|js|png|jpg|jpeg|gif|ico|woff|woff2|svg|map)(\?|$)/i.test(url)
    ) {
      const line = `[NETWORK] ${res.status()} ${res.request().method()} ${url}`;
      (artifacts.networkLines as string[]).push(line);
    }
  });
}
