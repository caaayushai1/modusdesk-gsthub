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

export function useGSTClients() {
  const [clients, setClients] = useState<GSTClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [staffInfo, setStaffInfo] = useState<{ id: string; name: string; role: string } | null>(null);

  useEffect(() => {
    // If token in URL query, persist to cookie/localStorage
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        localStorage.setItem('gsthub_token', token);
        document.cookie = `gsthub_token=${token}; path=/; max-age=86400; SameSite=Lax`;
      }
    }

    async function load() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('gsthub_token') : null;
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
          if (json.staff) {
            setStaffInfo(json.staff);
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

  return { clients, isLoading, staffInfo };
}
