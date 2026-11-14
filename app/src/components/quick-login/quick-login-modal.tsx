'use client';

import React, { useState, useEffect } from 'react';
import { X, Zap, Eye, EyeOff, Check, AlertCircle, Download, Loader2 } from 'lucide-react';
import { useGSTClients, GSTClient } from '@/lib/use-gst-clients';
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
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [companionOnline, setCompanionOnline] = useState(true);
  const [isStartingCompanion, setIsStartingCompanion] = useState(false);

  // Check companion status when modal opens
  useEffect(() => {
    if (isOpen) {
      checkCompanionHealth().then((h) => setCompanionOnline(h.status === 'HEALTHY'));
    }
  }, [isOpen]);

  const handleStartCompanion = async () => {
    try {
      setIsStartingCompanion(true);
      launchCompanionViaProtocol();

      for (let i = 0; i < 6; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const health = await checkCompanionHealth();
        if (health.status === 'HEALTHY') {
          setCompanionOnline(true);
          setStatusMessage({ type: 'success', text: 'Desktop Companion connected! Ready for 1-Click Login.' });
          break;
        }
      }
    } finally {
      setIsStartingCompanion(false);
    }
  };

  // Reset fields when opening
  useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      if (clients.length > 0 && !selectedClientId) {
        // Leave unselected or default to first
      }
    }
  }, [isOpen, clients]);

  if (!isOpen) return null;

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setStatusMessage(null);

    if (!clientId) {
      // Manual / Guest mode
      setUsername('');
      setPassword('');
      return;
    }

    const client = clients.find((c) => c.id === clientId);
    if (client) {
      // If client has GSTIN, use it or placeholder username
      setUsername(client.gstin || client.clientCode || '');
      // If password stored in vault, it will be auto-filled or populated
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

      const res = await triggerGSTLogin({
        username: username.trim(),
        password: password,
      });

      if (res.success) {
        setStatusMessage({ type: 'success', text: 'GST Portal launched! Chrome browser opened with credentials auto-filled.' });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        // If companion offline, offer opening GST Portal directly in new tab
        window.open('https://services.gst.gov.in/services/login', '_blank');
        setStatusMessage({
          type: 'error',
          text: 'Desktop Companion is offline. Opened official GST Portal login in your browser.',
        });
      }
    } catch (err: any) {
      window.open('https://services.gst.gov.in/services/login', '_blank');
      setStatusMessage({
        type: 'error',
        text: 'Opened official GST Portal in a new tab.',
      });
    } finally {
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

        {/* Form */}
        <form onSubmit={handleLaunch} className="p-5 space-y-3.5">
          {/* Companion Offline Banner */}
          {!companionOnline && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[11px] font-medium">Desktop Companion is offline</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartCompanion}
                  disabled={isStartingCompanion}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {isStartingCompanion ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Zap className="w-3 h-3 fill-white" />
                  )}
                  <span>Start</span>
                </button>
                <a
                  href="/api/download/companion"
                  download="ModusDesk-GST-Companion-Setup.bat"
                  className="p-1 text-slate-500 hover:text-slate-800"
                  title="Download 1-Click Setup"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

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
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>{isLaunching ? 'Launching...' : 'Launch Quick Login'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
