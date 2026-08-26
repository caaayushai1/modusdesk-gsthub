'use client';

import { useEffect, useState } from 'react';
import { checkCompanionHealth, type CompanionHealthResponse } from '@/lib/companion-client';

export function CompanionStatusBadge() {
  const [health, setHealth] = useState<CompanionHealthResponse | null>(null);

  useEffect(() => {
    // Initial check
    checkCompanionHealth().then(setHealth);

    // Poll every 5 seconds
    const interval = setInterval(() => {
      checkCompanionHealth().then(setHealth);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!health) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-500">
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
        Checking Companion...
      </div>
    );
  }

  const isOnline = health.status === 'HEALTHY';

  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
        isOnline
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-red-50 text-red-700 border border-red-200'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'
        }`}
      />
      {isOnline ? (
        <>
          Companion Connected
          <span className="text-green-500">v{health.version}</span>
          {health.activeSessions > 0 && (
            <span className="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px]">
              {health.activeSessions} active
            </span>
          )}
        </>
      ) : (
        <>
          Companion Offline
          <span className="ml-1 text-red-400">— Start start-companion.bat</span>
        </>
      )}
    </div>
  );
}
