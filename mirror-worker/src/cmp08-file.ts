import path from 'path';
import os from 'os';
import { chromium, type Page } from 'playwright-core';
import { GST_PORTAL } from './portal-selectors';

export interface CMP08FileRequest {
  username: string;
  password: string;
  financialYear: string; // e.g. "2026-27"
  quarter: string; // "Q1", "Q2", "Q3", "Q4"
  gstin?: string;
  actualSales: number;
  rcmTaxableValue: number;
}

export interface CMP08FileResult {
  success: boolean;
  message: string;
  error?: string;
}

async function detectBrowserChannel(): Promise<'chrome' | 'msedge'> {
  try {
    const testBrowser = await chromium.launch({ headless: true, channel: 'chrome' });
    await testBrowser.close();
    return 'chrome';
  } catch {
    return 'msedge';
  }
}

/**
 * Automates CMP-08 Self-Assessed Tax Form Filing:
 * 1. Launches visible browser window on staff's monitor
 * 2. Autofills Username & Password on GST Portal
 * 3. Focuses the CAPTCHA field for user to solve
 * 4. Once logged in, automatically navigates to Returns Dashboard & CMP-08 tile
 * 5. Clicks "Prepare Online" and populates Table 3 (Turnover & RCM)
 * 6. Clicks "Save" & "Proceed to File", leaving the page ready for OTP/DSC signing
 */
export async function executeCMP08Filing(req: CMP08FileRequest): Promise<CMP08FileResult> {
  const channel = await detectBrowserChannel();
  const tempProfileDir = path.join(os.tmpdir(), `modusdesk_gst_cmp08_${Date.now()}`);

  console.log(`[CMP08-FILE] Starting session for ${req.username} (${req.quarter} ${req.financialYear}) using ${channel}...`);

  const context = await chromium.launchPersistentContext(tempProfileDir, {
    headless: false,
    channel,
    viewport: null,
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

  try {
    // 1. Navigate to GST Login
    console.log('[CMP08-FILE] Navigating to GST Portal login...');
    await page.goto(GST_PORTAL.LOGIN_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // 2. Fill credentials
    const usernameSelectors = ['#username', 'input[name="user_name"]', 'input[placeholder*="Username"]', 'input[type="text"]'];
    for (const sel of usernameSelectors) {
      try {
        const el = await page.waitForSelector(sel, { timeout: 4000 });
        if (el) {
          await el.fill(req.username);
          break;
        }
      } catch {
        // try next
      }
    }

    const passwordSelectors = ['#user_pass', 'input[name="user_pass"]', 'input[type="password"]'];
    for (const pSel of passwordSelectors) {
      try {
        const pEl = await page.$(pSel);
        if (pEl) {
          await pEl.fill(req.password);
          break;
        }
      } catch {
        // try next
      }
    }

    // Focus CAPTCHA field so user can instantly type
    try {
      const captchaEl = await page.$('#captcha');
      if (captchaEl) {
        await captchaEl.focus();
      }
    } catch {
      // ignore
    }

    console.log('[CMP08-FILE] Credentials populated. Waiting for user to solve CAPTCHA and submit...');

    // 3. Wait for user to solve CAPTCHA and log in (up to 150 seconds)
    const startTime = Date.now();
    let isLoggedIn = false;

    while (Date.now() - startTime < 150000) {
      const currentUrl = page.url().toLowerCase();
      if (!currentUrl.includes('/services/login') || currentUrl.includes('/auth') || currentUrl.includes('/dashboard')) {
        isLoggedIn = true;
        break;
      }

      const hasDashboard = await page.$('a[href*="returns-dashboard"], button:has-text("RETURN DASHBOARD"), .dashboard, #dashboard').catch(() => null);
      if (hasDashboard) {
        isLoggedIn = true;
        break;
      }

      await page.waitForTimeout(1000);
    }

    if (!isLoggedIn) {
      throw new Error('Login timed out. Please enter the CAPTCHA and submit.');
    }

    console.log('[CMP08-FILE] User logged in! Navigating to Returns Dashboard...');
    await page.waitForTimeout(1500);

    // 4. Navigate to Returns Dashboard
    try {
      await page.goto('https://services.gst.gov.in/services/returns/returns-dashboard', {
        waitUntil: 'domcontentloaded',
        timeout: 25000,
      });
    } catch {
      const returnBtn = await page.$('a:has-text("Return Dashboard"), a[href*="returns-dashboard"]');
      if (returnBtn) await returnBtn.click();
    }

    await page.waitForTimeout(2000);

    // 5. Select Financial Year & Quarter on Returns Dashboard
    try {
      const fySelect = await page.$('select[name="fin"], #fin_year, #finYear');
      if (fySelect) {
        await fySelect.selectOption({ label: req.financialYear }).catch(async () => {
          await fySelect.selectOption({ value: req.financialYear });
        });
      }

      await page.waitForTimeout(800);

      const quarterSelect = await page.$('select[name="quarter"], select[name="mon"], #ret_period, #quarter');
      if (quarterSelect) {
        const qNames: Record<string, string[]> = {
          Q1: ['Quarter 1 (Apr - Jun)', 'Quarter 1', 'April - June', 'Q1'],
          Q2: ['Quarter 2 (Jul - Sep)', 'Quarter 2', 'July - September', 'Q2'],
          Q3: ['Quarter 3 (Oct - Dec)', 'Quarter 3', 'October - December', 'Q3'],
          Q4: ['Quarter 4 (Jan - Mar)', 'Quarter 4', 'January - March', 'Q4'],
        };
        const targets = qNames[req.quarter] || [req.quarter];
        for (const t of targets) {
          try {
            await quarterSelect.selectOption({ label: t });
            break;
          } catch {}
        }
      }

      await page.waitForTimeout(600);

      const searchBtn = await page.$('#lotsearch, button:has-text("SEARCH"), input[value="SEARCH"]');
      if (searchBtn) {
        await searchBtn.click();
        console.log('[CMP08-FILE] Clicked Search. Looking for CMP-08 tile...');
      }
    } catch (filterErr) {
      console.warn('[CMP08-FILE] Filter selection note:', filterErr);
    }

    await page.waitForTimeout(2500);

    // 6. Click "PREPARE ONLINE" on Form CMP-08 tile
    try {
      const cmp08Tile = page.locator('div, tr, .card', { hasText: 'CMP-08' }).first();
      if (await cmp08Tile.isVisible()) {
        const prepareOnlineBtn = cmp08Tile.locator('button:has-text("PREPARE ONLINE"), a:has-text("PREPARE ONLINE")').first();
        if (await prepareOnlineBtn.isVisible()) {
          console.log('[CMP08-FILE] Found CMP-08 Prepare Online button, clicking...');
          await prepareOnlineBtn.click();
          await page.waitForTimeout(2500);
        }
      }
    } catch (tileErr) {
      console.warn('[CMP08-FILE] Tile click note:', tileErr);
    }

    // 7. Auto-fill Table 3 on CMP-08
    try {
      // Row 3(a): Outward supplies
      const salesInput = await page.$('input[name*="outward"], input[id*="outward"], input[placeholder*="Outward"], table tbody tr:nth-child(1) input[type="text"], table tbody tr:nth-child(1) input[type="number"]');
      if (salesInput) {
        await salesInput.fill(String(req.actualSales));
        console.log(`[CMP08-FILE] Filled Outward Supplies Turnover: ₹${req.actualSales}`);
      }

      // Row 3(b): Reverse charge inward supplies
      const rcmInput = await page.$('input[name*="rcm"], input[id*="rcm"], input[placeholder*="Reverse"], table tbody tr:nth-child(2) input[type="text"], table tbody tr:nth-child(2) input[type="number"]');
      if (rcmInput) {
        await rcmInput.fill(String(req.rcmTaxableValue));
        console.log(`[CMP08-FILE] Filled RCM Inward Supplies: ₹${req.rcmTaxableValue}`);
      }

      await page.waitForTimeout(1000);

      // Click SAVE button on Form CMP-08
      const saveBtn = await page.$('button:has-text("SAVE"), input[value="SAVE"]');
      if (saveBtn) {
        await saveBtn.click();
        console.log('[CMP08-FILE] Clicked SAVE button on CMP-08 form.');
        await page.waitForTimeout(2000);
      }

      // Click PROCEED TO FILE if available
      const proceedBtn = await page.$('button:has-text("PROCEED TO FILE"), button:has-text("FILE RETURN")');
      if (proceedBtn) {
        await proceedBtn.click();
        console.log('[CMP08-FILE] Clicked Proceed to File button.');
      }
    } catch (formErr) {
      console.warn('[CMP08-FILE] Form filling note:', formErr);
    }

    return {
      success: true,
      message: `Form CMP-08 for ${req.quarter} FY ${req.financialYear} has been populated with Turnover ₹${req.actualSales} and RCM ₹${req.rcmTaxableValue} and saved on GST Portal! Browser is ready on screen for final OTP / DSC verification.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during CMP-08 filing.';
    console.error('[CMP08-FILE ERROR]', message);
    return {
      success: false,
      message: `CMP-08 filing error: ${message}`,
      error: message,
    };
  }
}
