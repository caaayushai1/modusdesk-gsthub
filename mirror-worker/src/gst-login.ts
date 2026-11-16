import { type BrowserContext, type Page } from 'playwright-core';
import { createBrowserContext, step_fillLoginCredentials, bringWindowToForeground } from './portal-steps';
import { createRun, log, saveLog } from './portal-tracing';

/**
 * Active browser sessions tracked by a simple in-memory map.
 */
const activeContexts = new Map<string, BrowserContext>();

export interface LoginRequest {
  portalUrl?: string;
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
 * Launches a VISIBLE browser window on the staff's monitor,
 * navigates to the GST login page, fills username + password,
 * and places cursor focus on the CAPTCHA input field.
 */
export async function launchGSTLoginSession(req: LoginRequest): Promise<LoginResult> {
  const sessionKey = `${req.username}_${Date.now()}`;
  const artifacts = createRun(`login_${req.username}`);

  try {
    log(artifacts, `[GST-LOGIN] Launching visible browser for ${req.username}...`);
    const { context, page, channel } = await createBrowserContext('login');
    activeContexts.set(sessionKey, context);

    log(artifacts, `[GST-LOGIN] Browser channel: ${channel}`);

    // Pre-fill username and password, focus CAPTCHA
    await step_fillLoginCredentials(page, req.username, req.password, artifacts);

    // Bring browser to foreground on Windows desktop
    bringWindowToForeground('Goods');

    saveLog(artifacts);

    return {
      success: true,
      message: 'Browser opened on your screen with credentials filled. Please complete the CAPTCHA and log in.',
      sessionKey,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during login launch.';
    log(artifacts, `[GST-LOGIN FATAL ERROR] ${message}`);
    saveLog(artifacts);

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
