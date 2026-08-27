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
export async function checkCompanionHealth(): Promise<CompanionHealthResponse> {
  for (const baseUrl of HOSTS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

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
