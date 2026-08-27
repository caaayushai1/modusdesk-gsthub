import path from 'path';
import os from 'os';
import { chromium, type BrowserContext, type Page } from 'playwright-core';
import { GST_PORTAL } from './portal-selectors';

/**
 * Active browser sessions tracked by a simple in-memory map.
 */
const activeContexts = new Map<string, BrowserContext>();

export interface LoginRequest {
  portalUrl: string;
  username: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  message: string;
  sessionKey?: string;
  error?: string;
}

/**
 * Detects available browser channel on this machine.
 * Prefers Google Chrome (distinct separate window) -> Edge fallback.
 */
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
 * Launches a VISIBLE browser window on the staff's monitor,
 * navigates to the GST login page, fills username + password,
 * and places cursor focus on the CAPTCHA input field.
 */
export async function launchGSTLoginSession(req: LoginRequest): Promise<LoginResult> {
  const sessionKey = `${req.portalUrl}__${req.username}`;

  try {
    const channel = await detectBrowserChannel();
    console.log(`[GST-LOGIN] Launching ${channel} with persistent context in headed mode...`);

    const tempProfileDir = path.join(
      os.tmpdir(),
      `modusdesk_gst_${Date.now()}`
    );

    const context = await chromium.launchPersistentContext(tempProfileDir, {
      headless: false,
      channel,
      viewport: null,
      args: [
        '--new-window',
        '--window-position=60,40',
        '--window-size=1280,820',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-blink-features=AutomationControlled',
      ],
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    });

    activeContexts.set(sessionKey, context);

    const pages = context.pages();
    const page: Page = pages.length > 0 ? pages[0] : await context.newPage();
    await page.bringToFront();

    // Navigate to GST login page
    const targetUrl = req.portalUrl || GST_PORTAL.LOGIN_URL;
    try {
      await page.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    } catch (navErr) {
      console.warn('[GST-LOGIN] Page navigation warning:', navErr);
    }

    // Attempt auto-filling credentials with fallback selectors
    try {
      const usernameSelectors = ['#username', 'input[name="user_name"]', 'input[placeholder*="Username"]', 'input[type="text"]'];
      let usernameFound = false;

      for (const sel of usernameSelectors) {
        try {
          const el = await page.waitForSelector(sel, { timeout: 4000 });
          if (el) {
            await el.fill(req.username);
            usernameFound = true;
            break;
          }
        } catch {
          // try next selector
        }
      }

      if (usernameFound) {
        const passwordSelectors = ['#user_pass', 'input[name="user_pass"]', 'input[type="password"]'];
        for (const pSel of passwordSelectors) {
          try {
            const pEl = await page.$(pSel);
            if (pEl) {
              await pEl.fill(req.password);
              break;
            }
          } catch {
            // continue
          }
        }

        // Try focusing CAPTCHA
        try {
          const captchaEl = await page.$('#captcha');
          if (captchaEl) {
            await captchaEl.focus();
          }
        } catch {
          // ignore
        }
      }
    } catch (fillErr) {
      console.warn('[GST-LOGIN] Auto-fill soft warning:', fillErr);
    }

    return {
      success: true,
      message: 'Chrome opened on your screen with credentials filled. Please complete the CAPTCHA and log in.',
      sessionKey,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during login launch.';
    console.error('[GST-LOGIN FATAL ERROR]', message);
    return {
      success: false,
      message: `Could not launch browser: ${message}`,
      error: message,
    };
  }
}

export function getActiveSessionCount(): number {
  return activeContexts.size;
}
