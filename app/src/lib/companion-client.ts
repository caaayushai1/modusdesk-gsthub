/**
 * GSThub Desktop Companion Client
 * Communicates with the local daemon running on http://127.0.0.1:9090
 */

const COMPANION_BASE_URL = 'http://127.0.0.1:9090';

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
export async function checkCompanionHealth(): Promise<CompanionHealthResponse> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${COMPANION_BASE_URL}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error('Non-200 response');
    return await res.json();
  } catch {
    return {
      status: 'OFFLINE',
      version: 'N/A',
      activeSessions: 0,
      uptime: 0,
    };
  }
}

/**
 * Triggers a 1-Click GST Login via the Desktop Companion.
 * Sends decrypted credentials to localhost:9090 which launches
 * a visible browser window with fields auto-filled.
 */
export async function triggerGSTLogin(payload: LoginPayload): Promise<LoginResponse> {
  try {
    const res = await fetch(`${COMPANION_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data;
  } catch {
    return {
      success: false,
      message: 'Desktop Companion is not reachable. Please start the companion daemon.',
      error: 'COMPANION_OFFLINE',
    };
  }
}
