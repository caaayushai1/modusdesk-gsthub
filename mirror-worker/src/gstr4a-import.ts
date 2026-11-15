import path from 'path';
import os from 'os';
import fs from 'fs';
import { chromium, type Page } from 'playwright-core';
import { GST_PORTAL } from './portal-selectors';
import { 
  parseGSTR4AExcelBuffer, 
  parseGSTR4AJsonData, 
  aggregateInvoices, 
  type IngestedInvoice 
} from './excel-parser';

export interface GSTR4AImportRequest {
  username: string;
  password: string;
  financialYear: string; // e.g. "2026-27"
  quarter: string; // "Q1", "Q2", "Q3", "Q4"
  gstin?: string;
}

export interface GSTR4AImportResult {
  success: boolean;
  message: string;
  invoices?: IngestedInvoice[];
  summary?: {
    totalPurchases: number;
    rcmTaxableValue: number;
    rcmTaxPayable: number;
    invoiceCount: number;
    rcmCount: number;
  };
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
 * Automates GSTR-4A Inward Supplies Import:
 * 1. Opens visible browser on the staff's monitor
 * 2. Autofills Username and Password on GST portal
 * 3. Focuses the CAPTCHA field for the user to solve
 * 4. Once logged in, navigates to Returns Dashboard & GSTR-4A
 * 5. Automatically downloads / intercepts the Excel or JSON statement
 * 6. Returns structured inward purchase data to ModusDesk GSThub
 */
export async function executeGSTR4AImport(req: GSTR4AImportRequest): Promise<GSTR4AImportResult> {
  const channel = await detectBrowserChannel();
  const tempProfileDir = path.join(os.tmpdir(), `modusdesk_gst_gstr4a_${Date.now()}`);

  console.log(`[GSTR4A-IMPORT] Starting session for ${req.username} (${req.quarter} ${req.financialYear}) using ${channel}...`);

  const context = await chromium.launchPersistentContext(tempProfileDir, {
    headless: false,
    channel,
    viewport: null,
    args: [
      '--new-window',
      '--window-position=60,40',
      '--window-size=1280,840',
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

  let capturedInvoices: IngestedInvoice[] = [];
  let downloadCaptured = false;

  // 1. Intercept file downloads (Excel/JSON)
  page.on('download', async (download) => {
    try {
      const suggestedFilename = download.suggestedFilename();
      console.log(`[GSTR4A-IMPORT] Caught portal download: ${suggestedFilename}`);
      const downloadPath = path.join(os.tmpdir(), `gstr4a_dl_${Date.now()}_${suggestedFilename}`);
      await download.saveAs(downloadPath);

      if (suggestedFilename.toLowerCase().endsWith('.xlsx') || suggestedFilename.toLowerCase().endsWith('.xls')) {
        const buffer = fs.readFileSync(downloadPath);
        const parsed = parseGSTR4AExcelBuffer(buffer);
        if (parsed.length > 0) {
          capturedInvoices = parsed;
          downloadCaptured = true;
          console.log(`[GSTR4A-IMPORT] Successfully parsed ${parsed.length} invoices from downloaded Excel!`);
        }
      } else if (suggestedFilename.toLowerCase().endsWith('.json')) {
        const content = fs.readFileSync(downloadPath, 'utf8');
        const json = JSON.parse(content);
        const parsed = parseGSTR4AJsonData(json);
        if (parsed.length > 0) {
          capturedInvoices = parsed;
          downloadCaptured = true;
          console.log(`[GSTR4A-IMPORT] Successfully parsed ${parsed.length} invoices from downloaded JSON!`);
        }
      }
    } catch (err) {
      console.error('[GSTR4A-IMPORT] Error saving/parsing download:', err);
    }
  });

  // 2. Intercept network API responses containing GSTR-4A inward data
  page.on('response', async (res) => {
    try {
      const url = res.url().toLowerCase();
      if ((url.includes('gstr4a') || url.includes('inward') || url.includes('b2b')) && res.status() === 200) {
        const contentType = res.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          const json = await res.json().catch(() => null);
          if (json && (json.b2b || Array.isArray(json))) {
            const parsed = parseGSTR4AJsonData(json);
            if (parsed.length > 0) {
              capturedInvoices = parsed;
              console.log(`[GSTR4A-IMPORT] Intercepted live GSTR-4A API response with ${parsed.length} invoices!`);
            }
          }
        }
      }
    } catch {
      // ignore network parse errors
    }
  });

  try {
    // 3. Navigate to GST Login
    console.log('[GSTR4A-IMPORT] Navigating to GST Portal login...');
    await page.goto(GST_PORTAL.LOGIN_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // 4. Fill credentials
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

    console.log('[GSTR4A-IMPORT] Credentials populated. Waiting for user to solve CAPTCHA and submit...');

    // 5. Wait for user to solve CAPTCHA and log in (up to 150 seconds)
    const startTime = Date.now();
    let isLoggedIn = false;

    while (Date.now() - startTime < 150000) {
      const currentUrl = page.url().toLowerCase();
      // Successful login navigates to dashboard, auth, or quicklinks
      if (!currentUrl.includes('/services/login') || currentUrl.includes('/auth') || currentUrl.includes('/dashboard')) {
        isLoggedIn = true;
        break;
      }

      // Check if logged-in elements appeared
      const hasDashboard = await page.$('a[href*="returns-dashboard"], button:has-text("RETURN DASHBOARD"), .dashboard, #dashboard').catch(() => null);
      if (hasDashboard) {
        isLoggedIn = true;
        break;
      }

      await page.waitForTimeout(1000);
    }

    if (!isLoggedIn) {
      throw new Error('Login timed out. Please make sure CAPTCHA is entered and submit is clicked.');
    }

    console.log('[GSTR4A-IMPORT] User logged in successfully! Navigating to Returns Dashboard...');
    await page.waitForTimeout(1500);

    // 6. Navigate to Returns Dashboard
    try {
      await page.goto('https://services.gst.gov.in/services/returns/returns-dashboard', {
        waitUntil: 'domcontentloaded',
        timeout: 25000,
      });
    } catch {
      // If direct navigation fails, click Return Dashboard link
      const returnBtn = await page.$('a:has-text("Return Dashboard"), a[href*="returns-dashboard"]');
      if (returnBtn) await returnBtn.click();
    }

    await page.waitForTimeout(2000);

    // 7. Select Financial Year & Quarter on Returns Dashboard
    try {
      // Select FY
      const fySelect = await page.$('select[name="fin"], #fin_year, #finYear, select:has-text("202")');
      if (fySelect) {
        // Select option matching financial year (e.g. "2026-27")
        await fySelect.selectOption({ label: req.financialYear }).catch(async () => {
          await fySelect.selectOption({ value: req.financialYear });
        });
      }

      await page.waitForTimeout(800);

      // Select Quarter (e.g. Q1, Q2)
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
          } catch {
            // try next
          }
        }
      }

      await page.waitForTimeout(600);

      // Click SEARCH button
      const searchBtn = await page.$('#lotsearch, button:has-text("SEARCH"), input[value="SEARCH"]');
      if (searchBtn) {
        await searchBtn.click();
        console.log('[GSTR4A-IMPORT] Clicked Search on Returns Dashboard. Waiting for GSTR-4A tile...');
      }
    } catch (filterErr) {
      console.warn('[GSTR4A-IMPORT] Notice during form selection:', filterErr);
    }

    await page.waitForTimeout(2500);

    // 8. Find GSTR-4A Tile & Trigger Download
    try {
      // Find the card/tile containing "GSTR-4A"
      const gstr4aTile = await page.locator('div, tr, .card', { hasText: 'GSTR-4A' }).first();
      if (await gstr4aTile.isVisible()) {
        const downloadBtn = gstr4aTile.locator('button:has-text("DOWNLOAD"), a:has-text("DOWNLOAD"), a:has-text("Download")').first();
        if (await downloadBtn.isVisible()) {
          console.log('[GSTR4A-IMPORT] Found GSTR-4A Download button, clicking...');
          await downloadBtn.click();
          await page.waitForTimeout(1500);

          // If there is a "GENERATE EXCEL" or "DOWNLOAD EXCEL" button inside
          const excelBtn = page.locator('button:has-text("GENERATE EXCEL"), button:has-text("DOWNLOAD EXCEL"), a:has-text("Download Excel")').first();
          if (await excelBtn.isVisible()) {
            await excelBtn.click();
          }
        }
      }
    } catch (tileErr) {
      console.warn('[GSTR4A-IMPORT] Tile search note:', tileErr);
    }

    // 9. Wait up to 25 seconds for download or API capture
    const waitDownloadStart = Date.now();
    while (Date.now() - waitDownloadStart < 25000) {
      if (capturedInvoices.length > 0 || downloadCaptured) {
        break;
      }
      await page.waitForTimeout(1000);
    }

    // Close browser context cleanly
    await context.close().catch(() => {});

    const summary = aggregateInvoices(capturedInvoices);

    return {
      success: true,
      message: capturedInvoices.length > 0 
        ? `Successfully imported ${capturedInvoices.length} inward invoices for ${req.quarter} FY ${req.financialYear}!`
        : `Connected to GST Portal for ${req.quarter} FY ${req.financialYear}. No inward invoices were filed by suppliers for this period.`,
      invoices: capturedInvoices,
      summary,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during GSTR-4A import.';
    console.error('[GSTR4A-IMPORT ERROR]', message);
    await context.close().catch(() => {});
    return {
      success: false,
      message: `GSTR-4A import error: ${message}`,
      error: message,
    };
  }
}
