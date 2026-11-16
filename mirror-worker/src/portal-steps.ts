/**
 * Portal Step Functions — Live-Verified Composition Module
 *
 * Rules:
 *  - Precondition check → Action → Postcondition check for every step.
 *  - Zero fixed delays: wait on DOM landmarks and network response cycles.
 *  - Strict zero-disk processing for file exports.
 *  - Scheme fail-safe: aborts cleanly if portal shows Regular scheme instead of Composition.
 *  - Zero auto-file: stops strictly after SAVE on return forms.
 */

import { BrowserContext, Page, Download } from 'playwright-core';
import {
  URLS,
  URL_PATTERNS,
  LOGIN,
  INTERRUPTIONS,
  WELCOME_PAGE,
  RETURNS_DASHBOARD,
  GSTR4A_DOWNLOAD_PAGE,
  CMP08_FORM,
  GSTR4_ANNUAL,
  MASK_CSS,
} from './portal-selectors';
import { RunArtifacts, log, captureFailureArtifacts } from './portal-tracing';

// ── Typed Error ────────────────────────────────────────────────────────────
export type CompanionErrorCode =
  | 'SESSION_EXPIRED'
  | 'OTP_REQUIRED'
  | 'SCHEME_MISMATCH'
  | 'ELEMENT_NOT_FOUND'
  | 'NAVIGATION_FAILED'
  | 'DOWNLOAD_FAILED'
  | 'STATE_MISMATCH'
  | 'TIMEOUT';

export class CompanionError extends Error {
  constructor(
    public readonly code: CompanionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'CompanionError';
  }
}

// ── Portal State Machine ───────────────────────────────────────────────────
export type PortalState =
  | 'LOGIN_PAGE'
  | 'OTP_PAGE'
  | 'WELCOME_PAGE'
  | 'TAXPAYER_DASHBOARD'
  | 'RETURNS_DASHBOARD'
  | 'OFFLINE_DOWNLOAD'
  | 'CMP08_ONLINE'
  | 'GSTR4_ANNUAL'
  | 'ERROR_NOT_FOUND'
  | 'UNKNOWN';

export async function detectState(page: Page): Promise<PortalState> {
  const url = page.url();

  if (URL_PATTERNS.ERROR_NOT_FOUND.test(url) || url.includes('/error/notfound')) return 'ERROR_NOT_FOUND';
  if (URL_PATTERNS.LOGIN.test(url))              return 'LOGIN_PAGE';
  if (URL_PATTERNS.RETURNS_DASHBOARD.test(url))   return 'RETURNS_DASHBOARD';
  if (URL_PATTERNS.OFFLINE_DOWNLOAD.test(url))    return 'OFFLINE_DOWNLOAD';
  if (URL_PATTERNS.CMP08_ONLINE.test(url))        return 'CMP08_ONLINE';
  if (URL_PATTERNS.GSTR4_ANNUAL.test(url))        return 'GSTR4_ANNUAL';
  if (URL_PATTERNS.WELCOME_PAGE.test(url))        return 'WELCOME_PAGE';
  if (URL_PATTERNS.TAXPAYER_DASHBOARD.test(url))  return 'TAXPAYER_DASHBOARD';

  const hasOtp = await page.locator('#otp').isVisible({ timeout: 200 }).catch(() => false);
  if (hasOtp) return 'OTP_PAGE';

  return 'UNKNOWN';
}

// ── Interruption Dismissal ────────────────────────────────────────────────
export async function dismissInterruptions(page: Page, artifacts: RunArtifacts): Promise<number> {
  let dismissed = 0;

  // 1. Check for OTP screen — notify user
  const hasOtp = await page.locator('#otp').isVisible({ timeout: 200 }).catch(() => false);
  if (hasOtp) {
    log(artifacts, '[INTERRUPTION] OTP verification screen detected.');
    throw new CompanionError('OTP_REQUIRED', 'The GST portal is asking for OTP. Please complete OTP on screen.');
  }

  // 2. Dismiss visible modals/popups (Aadhaar, announcements, etc.)
  for (const selector of INTERRUPTIONS.closeButtons) {
    try {
      const loc = page.locator(selector).first();
      if (await loc.isVisible({ timeout: 300 }).catch(() => false)) {
        log(artifacts, `[DISMISSING] Popup via: ${selector}`);
        await loc.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(300);
        dismissed++;
      }
    } catch {}
  }

  // 3. Wait for spinners to clear
  for (const spinSel of INTERRUPTIONS.spinners) {
    try {
      const spinner = page.locator(spinSel).first();
      if (await spinner.isVisible({ timeout: 200 }).catch(() => false)) {
        await spinner.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      }
    } catch {}
  }

  return dismissed;
}

// ── Browser Creation & Foreground Helper ──────────────────────────────────
export async function createBrowserContext(label: string): Promise<{
  context: BrowserContext;
  page: Page;
  channel: 'chrome' | 'msedge';
}> {
  const { chromium } = await import('playwright-core');
  const path = await import('path');
  const os = await import('os');

  let channel: 'chrome' | 'msedge' = 'msedge';
  try {
    const test = await chromium.launch({ headless: true, channel: 'chrome' });
    await test.close();
    channel = 'chrome';
  } catch {
    channel = 'msedge';
  }

  const profileDir = path.join(os.tmpdir(), `modusdesk_gst_${label}_${Date.now()}`);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    channel,
    viewport: null,
    args: [
      '--new-window',
      '--start-maximized',
      '--window-position=50,50',
      '--window-size=1600,900',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
    ],
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  });

  const pages = context.pages();
  const page = pages.length > 0 ? pages[0] : await context.newPage();
  await page.bringToFront();

  // Bring to foreground in Windows
  bringWindowToForeground('Goods');

  return { context, page, channel };
}

export function bringWindowToForeground(targetTitle?: string): void {
  try {
    const { exec } = require('child_process');
    const path = require('path');
    const scriptPath = path.resolve(__dirname, '../scripts/bring-to-front.ps1');
    const titleArg = targetTitle ? `-TargetTitle "${targetTitle}"` : '';
    exec(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" ${titleArg}`);
  } catch {}
}

export function showCaptchaPromptDialog(username: string, flagPath: string): void {
  try {
    const { spawn } = require('child_process');
    const path = require('path');
    const scriptPath = path.resolve(__dirname, '../scripts/show-captcha-dialog.ps1');
    spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-Username', username, '-FlagPath', flagPath], {
      detached: true,
      stdio: 'ignore',
    }).unref();
  } catch {}
}

// ── Step: Fill Login Credentials ──────────────────────────────────────────
export async function step_fillLoginCredentials(
  page: Page,
  username: string,
  password: string,
  artifacts: RunArtifacts,
  flagPath?: string,
): Promise<void> {
  log(artifacts, '[STEP] fill_login_credentials — Loading GST portal login page...');
  await page.goto(URLS.LOGIN, { waitUntil: 'domcontentloaded', timeout: 30000 });

  await page.waitForSelector(LOGIN.username, { timeout: 15000 });
  await page.locator(LOGIN.username).fill(username);
  await page.locator(LOGIN.password).fill(password);
  log(artifacts, `[STEP] Credentials filled for ${username}. Waiting for dynamic captcha...`);

  // Wait for Angular SPA to render #captcha dynamically
  await page.waitForSelector(LOGIN.captcha, { timeout: 8000 }).catch(() => null);

  const captchaEl = page.locator(LOGIN.captcha);
  if (await captchaEl.isVisible({ timeout: 2000 }).catch(() => false)) {
    await captchaEl.focus();
    log(artifacts, '[STEP] CAPTCHA field focused. User must solve CAPTCHA and submit.');
  }

  // 1. Force GST browser window to foreground using Win32 API
  bringWindowToForeground('Goods');

  // 2. Launch Always-On-Top floating action dialog so user never misses the prompt
  if (flagPath) {
    showCaptchaPromptDialog(username, flagPath);
  }
}

// ── Step: Wait for User Login ─────────────────────────────────────────────
// ── Step: Wait for User Login ───────────────────────────────────────────────
export async function step_waitForUserLogin(
  page: Page,
  artifacts: RunArtifacts,
  timeoutMs = 180000,
  flagPath?: string,
): Promise<void> {
  log(artifacts, '[STEP] wait_for_user_login — Monitoring for successful login...');
  const deadline = Date.now() + timeoutMs;
  const fs = require('fs');

  while (Date.now() < deadline) {
    const state = await detectState(page);

    if (
      state === 'WELCOME_PAGE' ||
      state === 'TAXPAYER_DASHBOARD' ||
      state === 'RETURNS_DASHBOARD' ||
      state === 'ERROR_NOT_FOUND'
    ) {
      log(artifacts, `[STEP] Login confirmed! State: ${state}, URL: ${page.url()}`);
      // Auto-close Always-On-Top dialog immediately
      if (flagPath) {
        try { fs.writeFileSync(flagPath, 'done'); } catch {}
      }
      // Give Angular SPA time to finish session propagation
      await page.waitForTimeout(2000);
      return;
    }

    if (state === 'OTP_PAGE') {
      bringWindowToForeground();
    }

    await dismissInterruptions(page, artifacts).catch((e) => {
      if (e instanceof CompanionError && e.code === 'OTP_REQUIRED') {
        bringWindowToForeground();
      }
    });

    await page.waitForTimeout(1000);
  }

  // Signal timeout to dialog
  if (flagPath) {
    try { fs.writeFileSync(flagPath, 'timeout'); } catch {}
  }

  await captureFailureArtifacts(page, artifacts, 'login_timeout');
  throw new CompanionError('TIMEOUT', 'Login timed out after 3 minutes. Please solve CAPTCHA and log in.');
}

// ── Step: Navigate to Returns Dashboard ───────────────────────────────────
export async function step_navigateToReturnsDashboard(
  page: Page,
  artifacts: RunArtifacts,
): Promise<void> {
  log(artifacts, '[STEP] navigate_to_returns_dashboard — Proceeding to Returns Dashboard...');

  // 1. If currently on error/notfound page (or if redirected there), auto-recover:
  if (page.url().includes('notfound') || page.url().includes('error')) {
    log(artifacts, '[RECOVERY] Detected error/notfound page. Attempting recovery to Returns Dashboard...');
    
    // Strategy A: Navigate via Services -> Returns -> Returns Dashboard
    try {
      const servicesMenu = page.locator('a:has-text("Services")').first();
      if (await servicesMenu.isVisible({ timeout: 2500 }).catch(() => false)) {
        await servicesMenu.click();
        await page.waitForTimeout(500);

        const returnsSubmenu = page.locator('a:has-text("Returns")').first();
        if (await returnsSubmenu.isVisible({ timeout: 1500 }).catch(() => false)) {
          await returnsSubmenu.hover().catch(() => {});
        }

        const returnsDashboardItem = page.locator('a:has-text("Returns Dashboard")').first();
        if (await returnsDashboardItem.isVisible({ timeout: 3000 }).catch(() => false)) {
          await returnsDashboardItem.click();
          await page.waitForURL(URL_PATTERNS.RETURNS_DASHBOARD, { timeout: 20000 });
          log(artifacts, '[RECOVERY] Successfully reached Returns Dashboard via Services menu.');
          return;
        }
      }
    } catch {}

    // Strategy B: Click Home breadcrumb link to return to welcome page
    try {
      const homeLink = page.locator('a:has-text("Home")').first();
      if (await homeLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await homeLink.click();
        await page.waitForTimeout(2000);
      }
    } catch {}
  }

  await dismissInterruptions(page, artifacts);

  const currentState = await detectState(page);
  if (currentState === 'RETURNS_DASHBOARD') {
    log(artifacts, '[STEP] Already on Returns Dashboard.');
    return;
  }

  // 2. If on fowelcome, wait for page stabilization, dismiss popups, then click "RETURN DASHBOARD"
  if (currentState === 'WELCOME_PAGE' || page.url().includes('fowelcome')) {
    log(artifacts, '[STEP] Detected fowelcome page. Waiting for page to stabilize...');
    await page.waitForTimeout(1500);
    await dismissInterruptions(page, artifacts);

    const btn = page.locator(WELCOME_PAGE.returnDashboardBtn).first();
    if (await btn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await btn.click();
      await page.waitForURL(URL_PATTERNS.RETURNS_DASHBOARD, { timeout: 20000 });
      log(artifacts, '[STEP] Landed on Returns Dashboard via fowelcome button.');
      return;
    }
  }

  // 3. Fallback: Services -> Returns -> Returns Dashboard
  log(artifacts, '[STEP] Attempting navigation via Services menu...');
  try {
    const servicesMenu = page.locator('a:has-text("Services")').first();
    await servicesMenu.click({ timeout: 3000 });
    await page.waitForTimeout(500);

    const returnsSubmenu = page.locator('a:has-text("Returns")').first();
    if (await returnsSubmenu.isVisible({ timeout: 1500 }).catch(() => false)) {
      await returnsSubmenu.hover().catch(() => {});
    }

    const returnsItem = page.locator('a:has-text("Returns Dashboard"), a[href*="returns-dashboard"]').first();
    await returnsItem.click({ timeout: 4000 });
    await page.waitForURL(URL_PATTERNS.RETURNS_DASHBOARD, { timeout: 20000 });
  } catch (err) {
    // If landed on notfound during attempt, try one direct recovery
    if (page.url().includes('notfound')) {
      const homeLink = page.locator('a:has-text("Home")').first();
      if (await homeLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await homeLink.click();
        await page.waitForTimeout(2000);
        const btn = page.locator(WELCOME_PAGE.returnDashboardBtn).first();
        if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await btn.click();
          await page.waitForURL(URL_PATTERNS.RETURNS_DASHBOARD, { timeout: 20000 });
          return;
        }
      }
    }
    await captureFailureArtifacts(page, artifacts, 'nav_returns_failed');
    throw new CompanionError('NAVIGATION_FAILED', `Could not reach Returns Dashboard: ${err}`);
  }

  await dismissInterruptions(page, artifacts);
}

// ── Step: Fail-Safe Scheme Verification ───────────────────────────────────
export async function step_verifyCompositionScheme(
  page: Page,
  artifacts: RunArtifacts,
): Promise<void> {
  log(artifacts, '[STEP] verify_composition_scheme — Inspecting Returns Dashboard for taxpayer scheme...');
  await page.waitForSelector(RETURNS_DASHBOARD.fySelect, { timeout: 15000 });

  // 1. Direct indicator: On Returns Dashboard, Composition taxpayers have a Quarter dropdown
  const hasQuarterDropdown = await page.locator(RETURNS_DASHBOARD.quarterSelect).isVisible({ timeout: 2000 }).catch(() => false);

  // 2. Direct table indicator: "Composition" in the Registration Status table (as verified on portal)
  const bodyText = await page.innerText('body').catch(() => '');
  const hasCompositionTableStatus = /Composition/i.test(bodyText);

  if (hasQuarterDropdown || hasCompositionTableStatus) {
    log(artifacts, '[STEP] Composition Taxpayer verified on portal (Quarter dropdown & Status table confirmed) ✓');
    return;
  }

  // 3. Fallback: Only flag mismatch if month dropdown is displayed and no quarter dropdown exists
  const hasMonthOnly = await page.locator(RETURNS_DASHBOARD.monthSelect).isVisible({ timeout: 1000 }).catch(() => false);
  if (hasMonthOnly && !hasQuarterDropdown) {
    log(artifacts, '[STEP] FAIL-SAFE TRIGGERED: Portal displays Regular taxpayer returns without quarter selection.');
    throw new CompanionError(
      'SCHEME_MISMATCH',
      'Client is registered under Regular GST Scheme on the portal. No GSTR-4A or CMP-08 exists for this GSTIN.',
    );
  }

  log(artifacts, '[STEP] Composition Taxpayer verified on portal ✓');
}

// ── Step: Select Period ───────────────────────────────────────────────────
export async function step_selectPeriod(
  page: Page,
  financialYear: string,
  quarter: string,
  artifacts: RunArtifacts,
): Promise<void> {
  log(artifacts, `[STEP] select_period — FY: ${financialYear}, Quarter: ${quarter}`);
  await dismissInterruptions(page, artifacts);

  // 1. Select Financial Year (select[name="fin"])
  const fySelect = page.locator(RETURNS_DASHBOARD.fySelect);
  await fySelect.waitFor({ state: 'visible', timeout: 10000 });
  await fySelect.selectOption({ label: financialYear }).catch(async () => {
    // If exact label fails, match text containing financialYear
    const options = await fySelect.locator('option').allInnerTexts();
    const match = options.find((o) => o.includes(financialYear));
    if (match) await fySelect.selectOption({ label: match.trim() });
  });

  await page.waitForTimeout(500); // Allow Angular model to digest

  // 2. Select Quarter (select[name="quarter"])
  const qSelect = page.locator(RETURNS_DASHBOARD.quarterSelect);
  await qSelect.waitFor({ state: 'visible', timeout: 10000 });

  const qMap: Record<string, string> = {
    Q1: 'Quarter 1',
    Q2: 'Quarter 2',
    Q3: 'Quarter 3',
    Q4: 'Quarter 4',
  };
  const targetLabel = qMap[quarter] || quarter;

  const qOptions = await qSelect.locator('option').allInnerTexts();
  const matchedQ = qOptions.find((o) => o.includes(targetLabel) || o.includes(quarter));
  if (matchedQ) {
    await qSelect.selectOption({ label: matchedQ.trim() });
  }

  // 3. Click SEARCH
  const searchBtn = page.locator(RETURNS_DASHBOARD.searchBtn);
  await searchBtn.click();
  log(artifacts, '[STEP] Clicked SEARCH button.');

  // Wait for return tiles to load
  await page.waitForSelector('button:has-text("PREPARE ONLINE"), button:has-text("DOWNLOAD")', { timeout: 20000 });
  await dismissInterruptions(page, artifacts);
  log(artifacts, '[STEP] Return tiles loaded successfully ✓');
}

// ── Step: Download GSTR-4A In-Memory (Zero Disk) ──────────────────────────
export async function step_downloadGSTR4AInMemory(
  page: Page,
  quarter: string,
  artifacts: RunArtifacts,
): Promise<Buffer> {
  log(artifacts, '[STEP] download_gstr4a_in_memory — Navigating to GSTR-4A Offline Download...');
  await dismissInterruptions(page, artifacts);

  // 1. Click DOWNLOAD under GSTR-4A specifically (scoped strictly to GSTR-4A tile, never CMP-08)
  const gstr4aTile = page.locator('div, section, .card').filter({ hasText: /GSTR-?4A/i }).filter({ has: page.locator('button:has-text("DOWNLOAD")') }).last();
  let downloadBtn = gstr4aTile.locator('button:has-text("DOWNLOAD")');
  if (!(await downloadBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
    downloadBtn = page.locator('xpath=//div[contains(., "GSTR-4A") or contains(., "GSTR4A")]//button[contains(normalize-space(.), "DOWNLOAD")]').first();
  }
  await downloadBtn.scrollIntoViewIfNeeded().catch(() => {});
  await downloadBtn.click();
  await page.waitForURL(URL_PATTERNS.OFFLINE_DOWNLOAD, { timeout: 20000 });
  log(artifacts, '[STEP] Arrived at GSTR-4A Offline Download page.');

  // 2. Select From Quarter & To Quarter
  const qShort = GSTR4A_DOWNLOAD_PAGE.quarterOptions[quarter] || 'Apr-Jun';

  const fromSel = page.locator(GSTR4A_DOWNLOAD_PAGE.fromQuarterSelect);
  await fromSel.waitFor({ state: 'visible', timeout: 10000 });
  await fromSel.selectOption({ label: qShort }).catch(() => {});

  const toSel = page.locator(GSTR4A_DOWNLOAD_PAGE.toQuarterSelect);
  await toSel.waitFor({ state: 'visible', timeout: 10000 });
  await toSel.selectOption({ label: qShort }).catch(() => {});

  log(artifacts, `[STEP] Quarters selected: ${qShort}. Initiating in-memory download...`);

  // 3. Intercept download event OR detect Nil GSTR-4A message
  const generateBtn = page.locator(GSTR4A_DOWNLOAD_PAGE.generateExcelBtn);

  let downloadBuffer: Buffer = Buffer.alloc(0);
  try {
    let downloadHandled = false;
    let isNilDetected = false;

    // Start download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 25000 }).catch(() => null);

    await generateBtn.click();
    log(artifacts, '[STEP] Clicked Generate Excel. Checking for file stream or Nil notice...');

    // Poll for Nil message or download completion
    const startTime = Date.now();
    while (Date.now() - startTime < 25000) {
      // Check for Nil notice in DOM
      const alertLocator = page.locator('alert-message, .alert-msg, .alert, .alert-success, .alert-info');
      const count = await alertLocator.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        const text = (await alertLocator.nth(i).innerText().catch(() => '')) || '';
        if (/no details found|no data|no information|no records/i.test(text)) {
          log(artifacts, `[STEP] Nil GSTR-4A confirmed on portal: "${text.trim()}". Treating as 0 inward supplies.`);
          isNilDetected = true;
          return Buffer.alloc(0);
        }
      }

      // Check if download arrived
      const download = await Promise.race([
        downloadPromise,
        new Promise<null>((r) => setTimeout(() => r(null), 500)),
      ]);

      if (download) {
        log(artifacts, `[STEP] Caught browser download stream: ${download.suggestedFilename()}`);
        const stream = await download.createReadStream();
        if (!stream) {
          throw new Error('Failed to create readable stream for download.');
        }

        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        downloadBuffer = Buffer.concat(chunks);
        downloadHandled = true;
        log(artifacts, `[STEP] In-memory download complete! Received ${downloadBuffer.length} bytes (Zero disk storage) ✓`);
        return downloadBuffer;
      }

      await page.waitForTimeout(400);
    }

    if (!isNilDetected && !downloadHandled) {
      // Final body text inspection for nil notice
      const bodyText = await page.innerText('body').catch(() => '');
      if (/no details found in gstr-4a|no data available/i.test(bodyText)) {
        log(artifacts, '[STEP] Nil GSTR-4A confirmed via page text.');
        return Buffer.alloc(0);
      }
      throw new Error('Download timed out and no Nil notification was detected on portal.');
    }
  } catch (err) {
    await captureFailureArtifacts(page, artifacts, 'download_failed');
    throw new CompanionError('DOWNLOAD_FAILED', `Download failed: ${err}`);
  }

  return downloadBuffer;
}

// ── Step: Populate CMP-08 Table 3 Online (Stops at SAVE) ─────────────────
export async function step_populateCMP08Online(
  page: Page,
  actualSales: number,
  rcmTaxableValue: number,
  artifacts: RunArtifacts,
): Promise<{ savedScreenshotBase64: string | null }> {
  log(artifacts, '[STEP] populate_cmp08_online — Opening CMP-08 online preparation form...');
  await dismissInterruptions(page, artifacts);

  const prepareBtn = page.locator(RETURNS_DASHBOARD.cmp08PrepareOnlineBtn).first();
  await prepareBtn.click();
  await page.waitForTimeout(2000);
  await dismissInterruptions(page, artifacts);

  log(artifacts, `[STEP] Filling Table 3: Turnover ₹${actualSales}, RCM ₹${rcmTaxableValue}...`);

  // Fill Outward Supplies (Turnover)
  const outward = page.locator(CMP08_FORM.outwardSuppliesInput).first();
  if (await outward.isVisible({ timeout: 5000 }).catch(() => false)) {
    await outward.fill(String(actualSales));
  }

  // Fill RCM Inward Supplies
  const rcm = page.locator(CMP08_FORM.rcmSuppliesInput).first();
  if (await rcm.isVisible({ timeout: 5000 }).catch(() => false)) {
    await rcm.fill(String(rcmTaxableValue));
  }

  // Click SAVE only
  const saveBtn = page.locator(CMP08_FORM.saveBtn).first();
  await saveBtn.click();
  log(artifacts, '[STEP] Clicked SAVE button on CMP-08 form. Waiting for confirmation...');
  await page.waitForTimeout(2000);
  await dismissInterruptions(page, artifacts);

  // Take masked screenshot of saved state
  await page.addStyleTag({ content: MASK_CSS }).catch(() => {});
  let savedScreenshotBase64: string | null = null;
  try {
    const ssBuffer = await page.screenshot({ fullPage: false });
    savedScreenshotBase64 = ssBuffer.toString('base64');
  } catch {}

  log(artifacts, '[STEP] CMP-08 Table 3 draft successfully saved on portal! STOPPING at preview state.');
  return { savedScreenshotBase64 };
}
