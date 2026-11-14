'use client';

import { useState, useEffect } from 'react';

export interface GSTClient {
  id: string;
  code: string;
  clientCode: string;
  name: string;
  clientName: string;
  gstin: string;
  stateCode: string;
  label?: string | null;
}

export interface StaffInfo {
  id: string;
  name: string;
  email?: string | null;
  role: string;
}

function parseHandshakeToken(token: string): { staff: StaffInfo; firmName?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonStr);
    const now = Math.floor(Date.now() / 1000);
    if (payload.expiresAt && payload.expiresAt < now) {
      return null;
    }
    return {
      staff: {
        id: payload.staffId,
        name: payload.staffName,
        email: payload.staffEmail || payload.email || null,
        role: payload.role || 'STAFF',
      },
      firmName: payload.firmName || undefined,
    };
  } catch {
    return null;
  }
}

export function useGSTClients() {
  const [clients, setClients] = useState<GSTClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firmName, setFirmName] = useState<string | null>(null);
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);

  useEffect(() => {
    let activeToken: string | null = null;

    // If token in URL query, persist to cookie/localStorage and tidy URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      if (urlToken) {
        activeToken = urlToken;
        localStorage.setItem('gsthub_token', urlToken);
        document.cookie = `gsthub_token=${urlToken}; path=/; max-age=604800; SameSite=Lax`;
        urlParams.delete('token');
        const newSearch = urlParams.toString() ? `?${urlParams.toString()}` : '';
        window.history.replaceState({}, document.title, `${window.location.pathname}${newSearch}`);
      } else {
        activeToken = localStorage.getItem('gsthub_token');
      }
    }

    // Immediately parse token client-side for zero-latency UI rendering
    if (activeToken) {
      const parsed = parseHandshakeToken(activeToken);
      if (parsed) {
        setStaffInfo(parsed.staff);
        if (parsed.firmName) {
          setFirmName(parsed.firmName);
        }
      }
    }

    async function load() {
      try {
        const token = activeToken || (typeof window !== 'undefined' ? localStorage.getItem('gsthub_token') : null);
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/clients', { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.clients && Array.isArray(json.clients)) {
            const normalized: GSTClient[] = json.clients.map((c: any) => ({
              id: c.id,
              code: c.clientCode || c.code || '---',
              clientCode: c.clientCode || c.code || '---',
              name: c.clientName || c.name || '---',
              clientName: c.clientName || c.name || '---',
              gstin: c.gstin || '',
              stateCode: c.stateCode || (c.gstin ? c.gstin.substring(0, 2) : '27'),
              label: c.label || null,
            }));
            setClients(normalized);
          }
          if (json.firm?.name) {
            setFirmName(json.firm.name);
          }
          if (json.staff) {
            setStaffInfo((prev) => ({
              id: prev?.id || json.staff.id || '',
              name: prev?.name || json.staff.name || '',
              email: prev?.email || json.staff.email || null,
              role: prev?.role || json.staff.role || 'STAFF',
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load GST clients:', err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  return { clients, isLoading, staffInfo, firmName };
}
