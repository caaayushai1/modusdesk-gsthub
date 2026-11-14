'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, Eye, EyeOff, Check, AlertCircle, Download, Loader2 } from 'lucide-react';
import { useGSTClients } from '@/lib/use-gst-clients';
import { triggerGSTLogin, checkCompanionHealth, launchCompanionViaProtocol } from '@/lib/companion-client';

interface QuickLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickLoginModal({ isOpen, onClose }: QuickLoginModalProps) {
  const { clients } = useGSTClients();

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  // Reset fields when opening
  useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      setNeedsSetup(false);
      setIsLaunching(false);
      setIsWakingUp(false);
    }
  }, [isOpen]);

  const triggerSetupDownload = () => {
    const link = document.createElement('a');
    link.href = '/api/download/companion';
    link.download = 'ModusDesk-GST-Companion-Setup.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeLaunch = async () => {
    try {
      setIsLaunching(true);
      const res = await triggerGSTLogin({
        username: username.trim(),
        password: password,
      });

      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Chrome opened with credentials filled! Please complete CAPTCHA.' });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setStatusMessage({
          type: 'error',
          text: `Auto-Login Failed: ${res.error || res.message || 'Could not launch browser'}`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Launch error: ${err?.message || 'Connection failed'}`,
      });
    } finally {
      setIsLaunching(false);
    }
  };

  // Background poller when waiting for 1-time setup file to run
  useEffect(() => {
    if (!needsSetup) return;
    const interval = setInterval(async () => {
      const h = await checkCompanionHealth(400);
      if (h.status === 'HEALTHY') {
        clearInterval(interval);
        setNeedsSetup(false);
        setStatusMessage({ type: 'success', text: 'Connected! Launching portal now...' });
        executeLaunch();
      }
    }, 800);
    return () => clearInterval(interval);
  }, [needsSetup, username, password]);

  if (!isOpen) return null;

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setStatusMessage(null);

    if (!clientId) {
      setUsername('');
      setPassword('');
      return;
    }

    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setUsername(client.gstin || client.clientCode || '');
      setPassword('');
    }
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a GST portal username or GSTIN.' });
      return;
    }

    try {
      setIsLaunching(true);
      setStatusMessage(null);

      // 1. Fast check if companion is running
      let health = await checkCompanionHealth(600);

      // 2. If offline, try waking it up via protocol handler
      if (health.status !== 'HEALTHY') {
        setIsWakingUp(true);
        launchCompanionViaProtocol();

        for (let i = 0; i < 5; i++) {
          await new Promise((r) => setTimeout(r, 500));
          health = await checkCompanionHealth(400);
          if (health.status === 'HEALTHY') {
            break;
          }
        }
        setIsWakingUp(false);
      }

      // 3. If STILL offline, check 24h download guard and show 1-time setup prompt
      if (health.status !== 'HEALTHY') {
        const lastDownloaded = localStorage.getItem('modusdesk_setup_downloaded_at');
        const now = Date.now();
        if (!lastDownloaded || now - parseInt(lastDownloaded, 10) > 24 * 60 * 60 * 1000) {
          triggerSetupDownload();
          localStorage.setItem('modusdesk_setup_downloaded_at', now.toString());
        }
        setNeedsSetup(true);
        setIsLaunching(false);
        return;
      }

      // 4. Companion active: execute launch into Chrome
      await executeLaunch();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Launch error: ${err?.message || 'Connection failed'}`,
      });
      setIsLaunching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60">
              <Zap className="w-4 h-4 fill-emerald-600" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              Quick Login
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        {needsSetup ? (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Download className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    One-Time Setup Required
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    To enable 1-click logins on this computer
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                The setup file <strong className="text-slate-900 font-semibold">ModusDesk-GST-Companion-Setup.bat</strong> was downloaded.
                Please click to open the downloaded file once to enable automated portal logins.
              </p>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={triggerSetupDownload}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                >
                  Download again
                </button>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Waiting for setup...</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setNeedsSetup(false)}
              className="w-full py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Back to form
            </button>
          </div>
        ) : (
          <form onSubmit={handleLaunch} className="p-5 space-y-3.5">
            {/* Client Selector (Optional for Guest) */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Select Client (Optional)
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              >
                <option value="">Manual / Guest Mode</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.clientCode} — {c.clientName} ({c.gstin || 'No GSTIN'})
                  </option>
                ))}
              </select>
            </div>

            {/* Portal Username */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Portal Username / GSTIN
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. 27AAAAA0000A1Z5 or username"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-mono"
              />
            </div>

            {/* Portal Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 pr-9 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Status Alert */}
            {statusMessage && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">{statusMessage.text}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={isLaunching}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer mt-2"
            >
              {isLaunching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isWakingUp ? 'Connecting...' : 'Connecting...'}</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>Launch Quick Login</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}