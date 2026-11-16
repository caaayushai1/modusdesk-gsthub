/**
 * GSThub Desktop Companion Client
 * Communicates with the local daemon running on http://127.0.0.1:9090 or http://localhost:9090
 */

const HOSTS = ['http://127.0.0.1:9090', 'http://localhost:9090'];

export const REQUIRED_COMPANION_VERSION = '1.0.4';

export interface CompanionHealthResponse {
  status: 'HEALTHY' | 'OFFLINE';
  version: string;
  activeSessions: number;
  uptime: number;
}

export interface LoginPayload {
  portalUrl?: string;
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  sessionKey?: string;
  error?: string;
}

/**
 * Checks if the Desktop Companion daemon is running.
 * Returns health data or a fallback OFFLINE status.
 */
export async function checkCompanionHealth(timeoutMs: number = 2000): Promise<CompanionHealthResponse> {
  for (const baseUrl of HOSTS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(`${baseUrl}/api/health`, {
        signal: controller.signal,
        mode: 'cors',
      });
      clearTimeout(timeout);

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // try next host
    }
  }

  return {
    status: 'OFFLINE',
    version: 'N/A',
    activeSessions: 0,
    uptime: 0,
  };
}

/**
 * Triggers a 1-Click GST Login via the Desktop Companion.
 * Sends decrypted credentials to localhost:9090 which launches
 * a visible browser window with fields auto-filled.
 */
export async function triggerGSTLogin(payload: LoginPayload): Promise<LoginResponse> {
  // Ensure companion is alive (and auto-starts if offline)
  await ensureCompanionReady();

  for (const baseUrl of HOSTS) {
    try {
      const res = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // try next host
    }
  }

  return {
    success: false,
    message: 'Desktop Companion is not reachable. Please start start-companion.bat on your PC.',
    error: 'COMPANION_OFFLINE',
  };
}

export interface GSTR4AImportPayload {
  username: string;
  password: string;
  financialYear: string;
  quarter: string;
  gstin?: string;
}

export interface GSTR4AImportResponse {
  success: boolean;
  message: string;
  invoices?: any[];
  summary?: {
    totalPurchases: number;
    rcmTaxableValue: number;
    rcmTaxPayable: number;
    invoiceCount: number;
    rcmCount: number;
  };
  error?: string;
}

/**
 * Triggers 1-Click Login & Auto GSTR-4A Import via the Desktop Companion.
 * Launches visible browser with credentials filled, waits for user to enter CAPTCHA,
 * then navigates to Returns Dashboard and imports GSTR-4A inward supplies automatically.
 */
export async function triggerGSTR4AImport(payload: GSTR4AImportPayload): Promise<GSTR4AImportResponse> {
  for (const baseUrl of HOSTS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180000);

      const res = await fetch(`${baseUrl}/api/import-gstr4a`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        return await res.json();
      } else {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          message: errJson.error || 'Failed to import GSTR-4A from portal',
          error: errJson.error || 'IMPORT_FAILED',
        };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          message: 'Operation timed out while waiting for portal login/import.',
          error: 'TIMEOUT',
        };
      }
    }
  }

  return {
    success: false,
    message: 'Desktop Companion is not reachable on localhost:9090. Please make sure start-companion.bat is running.',
    error: 'COMPANION_OFFLINE',
  };
}

export interface CMP08FilingPayload {
  username: string;
  password: string;
  financialYear: string;
  quarter: string;
  gstin?: string;
  actualSales: number;
  rcmTaxableValue: number;
}

export interface CMP08FilingResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Triggers 1-Click Auto-File CMP-08 via the Desktop Companion.
 * Launches visible browser with credentials filled, waits for user to enter CAPTCHA,
 * navigates to Returns Dashboard -> CMP-08 -> Prepare Online, fills Table 3 (Turnover & RCM),
 * clicks Save and Proceed to File, leaving the form ready for OTP/DSC.
 */
export async function triggerCMP08Filing(payload: CMP08FilingPayload): Promise<CMP08FilingResponse> {
  for (const baseUrl of HOSTS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180000);

      const res = await fetch(`${baseUrl}/api/file-cmp08`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        return await res.json();
      } else {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          message: errJson.error || 'Failed to auto-file CMP-08 on portal',
          error: errJson.error || 'FILING_FAILED',
        };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          message: 'Operation timed out while waiting for portal login/filing.',
          error: 'TIMEOUT',
        };
      }
    }
  }

  return {
    success: false,
    message: 'Desktop Companion is not reachable on localhost:9090. Please make sure start-companion.bat is running.',
    error: 'COMPANION_OFFLINE',
  };
}

/**
 * Requests the Desktop Companion to aggressively bring the GST Portal window to the foreground.
 */
export async function requestCompanionFocus(): Promise<boolean> {
  for (const baseUrl of HOSTS) {
    try {
      const res = await fetch(`${baseUrl}/api/focus`, {
        method: 'POST',
        mode: 'cors',
      });
      if (res.ok) return true;
    } catch {}
  }
  return false;
}

/**
 * Triggers the Windows registered protocol handler `modusdesk://launch`
 * to silently boot the Desktop Companion in the user's interactive Windows session.
 */
export function launchCompanionViaProtocol(): void {
  if (typeof window === 'undefined') return;
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = 'modusdesk://launch';
  document.body.appendChild(iframe);
  setTimeout(() => {
    try {
      document.body.removeChild(iframe);
    } catch {}
  }, 3000);
}

/**
 * Programmatically triggers a clean self-restart of the Companion daemon
 * to immediately hot-load newly compiled code or upgrades.
 */
export async function restartCompanion(): Promise<boolean> {
  for (const baseUrl of HOSTS) {
    try {
      const res = await fetch(`${baseUrl}/api/restart`, {
        method: 'POST',
        mode: 'cors',
      });
      if (res.ok) return true;
    } catch {}
  }
  return false;
}

/**
 * Ensures the companion is alive and on the required version.
 * If offline, wakes via `modusdesk://launch`.
 * If outdated, triggers `/api/restart` to reload the fresh build.
 */
export async function ensureCompanionReady(
  onStatus?: (msg: string) => void
): Promise<{ ok: boolean; version: string; error?: string }> {
  let health = await checkCompanionHealth(800);

  // 1. If offline, auto-wake via browser protocol
  if (health.status !== 'HEALTHY') {
    onStatus?.('Starting Desktop Companion on your PC...');
    launchCompanionViaProtocol();

    for (let i = 0; i < 7; i++) {
      await new Promise((r) => setTimeout(r, 500));
      health = await checkCompanionHealth(500);
      if (health.status === 'HEALTHY') break;
    }
  }

  if (health.status !== 'HEALTHY') {
    return {
      ok: false,
      version: 'OFFLINE',
      error: 'Companion service is offline and could not be auto-started.',
    };
  }

  // 2. If version is older than required, request hot-reload restart
  if (health.version && health.version < REQUIRED_COMPANION_VERSION) {
    onStatus?.(`Upgrading Companion to latest build v${REQUIRED_COMPANION_VERSION}...`);
    await restartCompanion();
    await new Promise((r) => setTimeout(r, 1200));

    // Re-verify health on newly loaded instance
    health = await checkCompanionHealth(1000);
  }

  return { ok: health.status === 'HEALTHY', version: health.version };
}
