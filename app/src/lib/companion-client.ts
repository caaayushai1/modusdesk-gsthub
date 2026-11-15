/**
 * GSThub Desktop Companion Client
 * Communicates with the local daemon running on http://127.0.0.1:9090 or http://localhost:9090
 */

const HOSTS = ['http://127.0.0.1:9090', 'http://localhost:9090'];

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
