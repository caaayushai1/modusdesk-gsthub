import { chromium, type Browser, type Page } from 'playwright-core';
import { GST_PORTAL } from './portal-selectors';

/**
 * Active browser sessions tracked by a simple in-memory map.
 * Key: portalUrl + username combo. Value: browser instance ref.
 * This prevents launching duplicate windows for the same client.
 */
const activeSessions = new Map<string, Browser>();

export interface LoginRequest {
  portalUrl: string;
  username: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  message: string;
  sessionKey?: string;
}

/**
 * Detects available browser channel on this machine.
 * Prefers Edge (pre-installed on Windows) -> Chrome -> Chromium.
 */
async function detectBrowserChannel(): Promise<'msedge' | 'chrome'> {
  try {
    const testBrowser = await chromium.launch({ headless: true, channel: 'msedge' });
    await testBrowser.close();
    return 'msedge';
  } catch {
    return 'chrome';
  }
}

/**
 * Launches a VISIBLE browser window on the staff's monitor,
 * navigates to the GST login page, fills username + password,
 * and places cursor focus on the CAPTCHA input field.
 *
 * The browser remains open for the staff to type the CAPTCHA
 * and use the portal interactively. It is NOT closed by this function.
 */
export async function launchGSTLoginSession(req: LoginRequest): Promise<LoginResult> {
  const sessionKey = `${req.portalUrl}__${req.username}`;

  // Prevent duplicate windows for the same client
  if (activeSessions.has(sessionKey)) {
    const existingBrowser = activeSessions.get(sessionKey)!;
    if (existingBrowser.isConnected()) {
      return {
        success: true,
        message: 'A session for this client is already open. Bringing it to focus.',
        sessionKey,
      };
    }
    // Stale reference, clean up
    activeSessions.delete(sessionKey);
  }

  const channel = await detectBrowserChannel();
  console.log(`[GST-LOGIN] Launching ${channel} in headed mode...`);

  const browser = await chromium.launch({
    headless: false,
    channel,
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
  });

  // Track for duplicate prevention
  activeSessions.set(sessionKey, browser);

  // Clean up tracking when browser is closed by user
  browser.on('disconnected', () => {
    activeSessions.delete(sessionKey);
    console.log(`[GST-LOGIN] Browser closed by user for ${req.username}`);
  });

  const context = await browser.newContext({
    viewport: null, // Use full monitor resolution
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  });

  const page: Page = await context.newPage();

  // Navigate to login page
  await page.goto(req.portalUrl || GST_PORTAL.LOGIN_URL, {
    waitUntil: 'domcontentloaded',
    timeout: GST_PORTAL.TIMEOUTS.PAGE_LOAD,
  });

  // Wait for username field to be ready
  await page.waitForSelector(GST_PORTAL.SELECTORS.USERNAME_INPUT, {
    timeout: GST_PORTAL.TIMEOUTS.ELEMENT_WAIT,
  });

  // Auto-fill credentials
  await page.fill(GST_PORTAL.SELECTORS.USERNAME_INPUT, req.username);
  await page.fill(GST_PORTAL.SELECTORS.PASSWORD_INPUT, req.password);

  // Focus the CAPTCHA input so staff can immediately start typing
  try {
    await page.waitForSelector(GST_PORTAL.SELECTORS.CAPTCHA_INPUT, {
      timeout: GST_PORTAL.TIMEOUTS.ELEMENT_WAIT,
    });
    await page.focus(GST_PORTAL.SELECTORS.CAPTCHA_INPUT);
  } catch {
    // CAPTCHA field might not be immediately available; proceed anyway
    console.log('[GST-LOGIN] CAPTCHA field not detected; user will locate manually.');
  }

  console.log(`[GST-LOGIN] Credentials filled for ${req.username}. Awaiting CAPTCHA from user.`);

  return {
    success: true,
    message: 'Browser launched on your monitor. Credentials filled. Type the CAPTCHA and press Enter.',
    sessionKey,
  };
}

/**
 * Returns count of currently active browser sessions.
 */
export function getActiveSessionCount(): number {
  return activeSessions.size;
}
