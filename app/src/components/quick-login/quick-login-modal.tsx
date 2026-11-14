'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Zap, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  Download, 
  Loader2, 
  Search, 
  ChevronDown, 
  UserCheck 
} from 'lucide-react';
import { useGSTClients, GSTClient } from '@/lib/use-gst-clients';
import { triggerGSTLogin, checkCompanionHealth, launchCompanionViaProtocol } from '@/lib/companion-client';

interface QuickLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickLoginModal({ isOpen, onClose }: QuickLoginModalProps) {
  const { clients } = useGSTClients();

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isLoadingCreds, setIsLoadingCreds] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset fields when opening modal
  useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      setNeedsSetup(false);
      setIsLaunching(false);
      setIsWakingUp(false);
      setIsClientDropdownOpen(false);
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const triggerSetupDownload = () => {
    const link = document.createElement('a');
    link.href = '/api/download/companion';
    link.download = 'ModusDesk-GST-Companion-Setup.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter clients based on search query
  const filteredClients = clients.filter((c) => {
    if (!clientSearchQuery.trim()) return true;
    const q = clientSearchQuery.toLowerCase().trim();
    return (
      (c.clientCode && c.clientCode.toLowerCase().includes(q)) ||
      (c.clientName && c.clientName.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.gstin && c.gstin.toLowerCase().includes(q)) ||
      (c.portalUsername && c.portalUsername.toLowerCase().includes(q))
    );
  });

  // Fetch decrypted credentials when client is selected
  const handleSelectClient = async (client: GSTClient | null) => {
    setIsClientDropdownOpen(false);
    setStatusMessage(null);

    if (!client) {
      setSelectedClientId('');
      setClientSearchQuery('');
      setUsername('');
      setPassword('');
      return;
    }

    setSelectedClientId(client.id);
    setClientSearchQuery(`${client.clientCode} — ${client.clientName}`);

    // Pre-populate with cached portal username if known (never fall back to GSTIN)
    if (client.portalUsername) {
      setUsername(client.portalUsername);
    } else {
      setUsername('');
    }
    setPassword('');

    // Fetch live decrypted credentials from vault
    try {
      setIsLoadingCreds(true);
      const res = await fetch(`/api/clients/credentials?clientId=${encodeURIComponent(client.id)}&gstin=${encodeURIComponent(client.gstin || '')}`);
      if (res.ok) {
        const json = await res.json();
        if (json.credentials) {
          if (json.credentials.username) {
            setUsername(json.credentials.username);
          }
          if (json.credentials.password) {
            setPassword(json.credentials.password);
          }
          setStatusMessage({
            type: 'info',
            text: `Credentials loaded from Vault for ${client.clientName}`
          });
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (errJson.error) {
          setStatusMessage({
            type: 'info',
            text: `Vault note: ${errJson.error}`
          });
        }
      }
    } catch (err: any) {
      console.warn('Failed to load credentials for client:', err);
    } finally {
      setIsLoadingCreds(false);
    }
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
        }, 2200);
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

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a GST portal username.' });
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
            {/* Searchable Client Selector */}
            <div className="space-y-1 relative" ref={dropdownRef}>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                  Select Client (Optional)
                </label>
                {selectedClientId && (
                  <button
                    type="button"
                    onClick={() => handleSelectClient(null)}
                    className="text-[10px] text-emerald-600 hover:underline cursor-pointer font-medium"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              <div className="relative">
                <div className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={clientSearchQuery}
                  onFocus={() => setIsClientDropdownOpen(true)}
                  onChange={(e) => {
                    setClientSearchQuery(e.target.value);
                    setIsClientDropdownOpen(true);
                  }}
                  placeholder="Search client by name, code or GSTIN..."
                  className="w-full pl-8.5 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isClientDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Floating Dropdown List */}
              {isClientDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-100">
                  {/* Manual / Guest Mode */}
                  <button
                    type="button"
                    onClick={() => handleSelectClient(null)}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between text-xs text-slate-700 transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-slate-600">Manual / Guest Mode</span>
                    {!selectedClientId && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>

                  {/* Filtered Clients */}
                  {filteredClients.length > 0 ? (
                    filteredClients.map((c) => {
                      const isSelected = selectedClientId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectClient(c)}
                          className={`w-full px-3 py-2 text-left hover:bg-emerald-50/60 transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-800'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-xs truncate">
                              <span className="font-mono text-emerald-700 font-semibold">{c.clientCode}</span>
                              <span>—</span>
                              <span className="truncate">{c.clientName}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                              {c.gstin ? (
                                <span>GSTIN: {c.gstin}</span>
                              ) : (
                                <span className="text-slate-400">No GSTIN registered</span>
                              )}
                              {c.portalUsername && (
                                <span className="text-emerald-600">User: {c.portalUsername}</span>
                              )}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500">
                      No clients found matching &quot;{clientSearchQuery}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Username */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                  Username
                </label>
                {isLoadingCreds && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Fetching credentials...</span>
                  </div>
                )}
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter GST portal username"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-mono"
              />
            </div>

            {/* Password */}
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
                    : statusMessage.type === 'info'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : statusMessage.type === 'info' ? (
                  <UserCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">{statusMessage.text}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={isLaunching || isLoadingCreds}
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
