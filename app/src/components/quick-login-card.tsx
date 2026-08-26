'use client';

import { useState } from 'react';
import { triggerGSTLogin, type LoginResponse } from '@/lib/companion-client';

type LoginStep = 'idle' | 'launching' | 'success' | 'error';

export function QuickLoginCard() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<LoginStep>('idle');
  const [result, setResult] = useState<LoginResponse | null>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return;

    setStep('launching');
    setResult(null);

    const response = await triggerGSTLogin({
      username: username.trim(),
      password: password.trim(),
    });

    setResult(response);
    setStep(response.success ? 'success' : 'error');

    // Reset status after 10 seconds
    setTimeout(() => {
      setStep('idle');
      setResult(null);
    }, 10000);
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">⚡ 1-Click GST Portal Login</h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter credentials to auto-fill the GST portal login page.
          A browser window will open on your screen.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Username / GSTIN
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. 27ABCDE1234F1Z5"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            disabled={step === 'launching'}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter portal password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            disabled={step === 'launching'}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={step === 'launching' || !username.trim() || !password.trim()}
          className={`w-full rounded-lg py-2.5 text-sm font-medium transition-all ${
            step === 'launching'
              ? 'bg-blue-400 text-white cursor-wait'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {step === 'launching' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Launching Browser...
            </span>
          ) : (
            '🔑 Launch Portal & Auto-Fill'
          )}
        </button>
      </div>

      {/* Result Feedback */}
      {result && (
        <div
          className={`mt-4 rounded-lg p-3 text-sm ${
            result.success
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {result.success ? '✅' : '❌'} {result.message}
        </div>
      )}
    </div>
  );
}
