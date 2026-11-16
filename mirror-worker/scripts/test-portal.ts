/**
 * Interactive GST Portal Playwright Verification & Diagnostics Runner
 *
 * Usage:
 *   npx tsx scripts/test-portal.ts [financialYear] [quarter]
 *   Example: npx tsx scripts/test-portal.ts 2024-25 Q1
 *
 * This script opens a visible browser with slowMo, starts tracing,
 * pauses for you to enter your credentials and CAPTCHA directly in the window,
 * and then executes step-by-step navigation with automated diagnostics and interruption handling.
 */

import readline from 'readline';
import { chromium, type Page, type BrowserContext } from 'playwright-core';
import path from 'path';
import os from 'os';
import fs from 'fs';
import {
  URLS,
  PORTAL_VERSION,
  GSTR4A,
} from '../src/portal-selectors';
import {
  createRun,
  startTracing,
  saveTrace,
  saveLog,
  setupConsoleCapture,
  setupNetworkCapture,
  captureFailureArtifacts,
  log,
} from '../src/portal-tracing';
import {
  detectState,
  dismissInterruptions,
  step_navigateToReturnsDashboard,
  step_selectPeriod,
  step_openGSTR4A,
  step_downloadGSTR4AFile,
  CompanionError,
} from '../src/portal-steps';
import {
  parseGSTR4AExcelBuffer,
  parseGSTR4AJsonData,
  aggregateInvoices,
} from '../src/excel-parser';

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

async function runInteractiveTest() {
  const args = process.argv.slice(2);
  const financialYear = args[0] || '2024-25';
  const quarter = (args[1] || 'Q1').toUpperCase();

  console.log('\n============================================================');
  console.log('  ModusDesk GST Portal Interactive Diagnostics (Composition)');
  console.log(`  Selector Version: ${PORTAL_VERSION}`);
  console.log(`  Target Period: FY ${financialYear} | Quarter ${quarter}`);
  console.log('============================================================\n');

  const artifacts = createRun(`diagnostic_${quarter}_${financialYear.replace('-', '')}`);
  log(artifacts, `[DIAGNOSTIC] Initialized. Artifacts: ${artifacts.runDir}`);

  // Launch visible browser with slowMo so user can see every action
  let channel: 'chrome' | 'msedge' = 'msedge';
  try {
    const test = await chromium.launch({ headless: true, channel: 'chrome' });
    await test.close();
    channel = 'chrome';
  } catch {
    channel = 'msedge';
  }

  const profileDir = path.join(os.tmpdir(), `modusdesk_diag_${Date.now()}`);
  log(artifacts, `[DIAGNOSTIC] Launching ${channel} in headed mode (slowMo: 250ms)...`);

  const context: BrowserContext = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    channel,
    viewport: null,
    slowMo: 250, // Human-observable speed
    args: [
      '--new-window',
      '--start-maximized',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
    ],
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  });

  const pages = context.pages();
  const page: Page = pages.length > 0 ? pages[0] : await context.newPage();
  await page.bringToFront();

  // Initialize tracing and logs
  await startTracing(context, artifacts);
  setupConsoleCapture(page, artifacts);
  setupNetworkCapture(page, artifacts);

  // Setup API response listener for GSTR-4A JSON
  let interceptedData: any = null;
  page.on('response', async (res) => {
    try {
      const url = res.url().toLowerCase();
      if (GSTR4A.apiUrlPatterns.some((p) => p.test(url)) && res.status() === 200) {
        const ct = res.headers()['content-type'] || '';
        if (ct.includes('application/json')) {
          const json = await res.json().catch(() => null);
          if (json) {
            interceptedData = json;
            log(artifacts, `[DIAGNOSTIC] Intercepted network API data: ${url}`);
          }
        }
      }
    } catch {}
  });

  try {
    // ── Navigate to login page ──
    log(artifacts, `[DIAGNOSTIC] Navigating to ${URLS.LOGIN}...`);
    await page.goto(URLS.LOGIN, { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('\n------------------------------------------------------------');
    console.log('  👉  MANUAL LOGIN REQUIRED ON THE GST SCREEN');
    console.log('  1. Chrome window is now open on your screen.');
    console.log('  2. Enter Username, Password, and solve CAPTCHA manually.');
    console.log('  3. If OTP is asked, complete OTP verification as well.');
    console.log('  4. Once you are logged in and on the GST dashboard,');
    console.log('     press [ENTER] in this terminal to start automated flow.');
    console.log('------------------------------------------------------------\n');

    // Wait for user login (auto-detects when you log in on the browser window)
    let loginDetected = false;
    const loginPoll = new Promise<void>((resolve) => {
      const checker = setInterval(async () => {
        try {
          const state = await detectState(page);
          if (state === 'TAXPAYER_DASHBOARD' || state === 'RETURNS_DASHBOARD') {
            clearInterval(checker);
            loginDetected = true;
            console.log('\n[AUTO-DETECT] Login confirmed via URL/Landmark detection! Proceeding with automated steps...');
            resolve();
          }
        } catch {}
      }, 1000);

      // Auto-timeout after 3 minutes if user didn't log in
      setTimeout(() => {
        clearInterval(checker);
        if (!loginDetected) {
          resolve();
        }
      }, 180000);
    });

    let stdinListener: Promise<void> | null = null;
    if (process.stdin.isTTY) {
      stdinListener = askQuestion('Or press [ENTER] here once logged into the GST Portal: ').then(() => {});
    }

    if (stdinListener) {
      await Promise.race([loginPoll, stdinListener]);
    } else {
      await loginPoll;
    }

    log(artifacts, `[DIAGNOSTIC] User login confirmed. Page URL: ${page.url()}`);

    // Check detected state
    const currentState = await detectState(page);
    log(artifacts, `[DIAGNOSTIC] Detected Portal State: ${currentState}`);

    // Dismiss any popups or announcements
    const cleared = await dismissInterruptions(page, artifacts);
    log(artifacts, `[DIAGNOSTIC] Initial interruptions dismissed: ${cleared}`);

    // ── STEP 1: Navigate to Returns Dashboard ──
    console.log('\n[STEP 1/4] Navigating to Returns Dashboard...');
    await step_navigateToReturnsDashboard(page, artifacts);
    log(artifacts, '[DIAGNOSTIC] Successfully landed on Returns Dashboard!');

    // ── STEP 2: Select FY and Quarter ──
    console.log(`\n[STEP 2/4] Selecting Period: FY ${financialYear} | Quarter ${quarter}...`);
    await step_selectPeriod(page, financialYear, quarter, artifacts);
    log(artifacts, '[DIAGNOSTIC] Successfully selected period and executed search!');

    // ── STEP 3: Locate GSTR-4A tile ──
    console.log('\n[STEP 3/4] Locating and opening GSTR-4A tile (handling tab switch if any)...');
    const gstr4aPage = await step_openGSTR4A(page, context, artifacts);
    log(artifacts, `[DIAGNOSTIC] GSTR-4A view active on tab: ${gstr4aPage.url()}`);

    // ── STEP 4: Download / Retrieve GSTR-4A data ──
    console.log('\n[STEP 4/4] Triggering file download and validating data...');
    let invoices: any[] = [];
    try {
      const downloadPath = await step_downloadGSTR4AFile(gstr4aPage, artifacts);
      const ext = path.extname(downloadPath).toLowerCase();
      if (ext === '.xlsx' || ext === '.xls') {
        const buffer = fs.readFileSync(downloadPath);
        invoices = parseGSTR4AExcelBuffer(buffer);
      } else if (ext === '.json') {
        const content = fs.readFileSync(downloadPath, 'utf8');
        invoices = parseGSTR4AJsonData(JSON.parse(content));
      }
      log(artifacts, `[DIAGNOSTIC] Downloaded and parsed ${invoices.length} invoices from file.`);
    } catch (dlErr: any) {
      log(artifacts, `[DIAGNOSTIC] File download note: ${dlErr.message}`);
      if (interceptedData) {
        log(artifacts, '[DIAGNOSTIC] Using network-intercepted GSTR-4A API data instead.');
        invoices = parseGSTR4AJsonData(interceptedData);
      } else {
        throw dlErr;
      }
    }

    const summary = aggregateInvoices(invoices);
    console.log('\n============================================================');
    console.log('  🎉 SUCCESSFUL AUTOMATION AUDIT');
    console.log(`  Total Invoices Found: ${invoices.length}`);
    console.log(`  Total Purchases: ₹${summary.totalPurchases}`);
    console.log(`  RCM Taxable Value: ₹${summary.rcmTaxableValue}`);
    console.log(`  RCM Tax Payable: ₹${summary.rcmTaxPayable}`);
    console.log(`  RCM Invoice Count: ${summary.rcmCount}`);
    console.log('============================================================\n');

    await saveTrace(context, artifacts);
    saveLog(artifacts);
    await context.close().catch(() => {});

    console.log(`Trace saved at: ${path.join(artifacts.runDir, 'trace.zip')}`);
    console.log(`You can inspect full timeline with: npx playwright show-trace "${path.join(artifacts.runDir, 'trace.zip')}"\n`);
  } catch (err: any) {
    const isComp = err instanceof CompanionError;
    const errClass = isComp ? err.code : 'UNEXPECTED_FAILURE';

    console.log('\n============================================================');
    console.log(`  ❌ FAILURE OCCURRED DURING PORTAL RUN`);
    console.log(`  Cause Classification: ${errClass}`);
    console.log(`  Message: ${err.message}`);
    console.log('============================================================\n');

    await captureFailureArtifacts(page, artifacts, 'diagnostic_failure').catch(() => {});
    await saveTrace(context, artifacts).catch(() => {});
    saveLog(artifacts);
    await context.close().catch(() => {});

    console.log(`\nFailure Artifacts saved in: ${artifacts.runDir}`);
    console.log(`- failure_diagnostic_failure.png (Masked screenshot)`);
    console.log(`- failure_diagnostic_failure.html (DOM state at failure)`);
    console.log(`- trace.zip (Full Playwright action trace)`);
    console.log(`\nView the exact failing step in Playwright Trace Viewer:`);
    console.log(`npx playwright show-trace "${path.join(artifacts.runDir, 'trace.zip')}"\n`);
  }
  process.exitCode = 0;
}

runInteractiveTest().catch(console.error);
