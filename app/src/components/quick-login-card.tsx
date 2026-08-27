import React, { useState, useEffect } from 'react';
import { Zap, Lock, Building2, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { useGSTClients } from '@/lib/use-gst-clients';
import { triggerGSTLogin } from '@/lib/companion-client';

export function QuickLoginCard() {
  const { clients } = useGSTClients();
  const [selectedGstin, setSelectedGstin] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (clients.length > 0 && !selectedGstin) {
      setSelectedGstin(clients[0].gstin);
      setUsername(`gst_${clients[0].code.toLowerCase()}`);
    }
  }, [clients, selectedGstin]);

  const handleClientChange = (gstin: string) => {
    setSelectedGstin(gstin);
    const found = clients.find((c) => c.gstin === gstin);
    if (found) {
      setUsername(`gst_${found.code.toLowerCase()}`);
    }
  };

  const handleLaunchLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage('Connecting to Desktop Companion on localhost:9090...');
    setIsSuccess(null);

    try {
      const result = await triggerGSTLogin({
        portalUrl: 'https://services.gst.gov.in/services/login',
        username,
        password,
      });

      if (result.success) {
        setIsSuccess(true);
        setStatusMessage('Browser launched! Credentials auto-filled. Please solve the CAPTCHA and click Login.');
      } else {
        setIsSuccess(false);
        setStatusMessage(result.error || result.message || 'Failed to trigger automated login.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Companion connection error';
      setIsSuccess(false);
      setStatusMessage(`Companion unreachable: ${msg}. Make sure start-companion.bat is running.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-enterprise p-6 md:p-8 bg-white border border-slate-200/90 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
            <Zap className="w-5 h-5 fill-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-headline-sm font-bold text-slate-900">
                1-Click Automated GST Login
              </h2>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Universal Companion
              </span>
            </div>
            <p className="text-body-sm text-slate-500 mt-0.5">
              Instantly opens official GST Common Portal in Chrome with auto-filled credentials and cursor positioned in CAPTCHA.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleLaunchLogin} className="mt-6 space-y-5">
        <div>
          <label className="text-label-caps text-slate-600 block mb-1.5">
            Select Practice Client:
          </label>
          <div className="relative">
            <select
              value={selectedGstin}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 shadow-2xs focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all cursor-pointer"
            >
              {clients.map((client) => (
                <option key={client.gstin} value={client.gstin}>
                  {client.name} — {client.gstin}
                </option>
              ))}
            </select>
            <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-label-caps text-slate-600 block mb-1.5">
              Portal Username:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 font-jetbrains text-xs font-medium text-slate-900 shadow-2xs focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-label-caps text-slate-600 block mb-1.5">
              Encrypted Password:
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 font-jetbrains text-xs font-medium text-slate-900 shadow-2xs focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
              />
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-bold text-white shadow-xs transition-all ${
              isLoading
                ? 'bg-emerald-400 cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/20 hover:shadow-md cursor-pointer'
            }`}
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{isLoading ? 'Opening GST Portal in Chrome...' : 'Launch 1-Click GST Login'}</span>
          </button>
        </div>
      </form>

      {/* Status Notice Banner */}
      {statusMessage && (
        <div
          className={`mt-5 rounded-xl border p-4 text-xs flex items-start gap-3 transition-all ${
            isSuccess === true
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : isSuccess === false
              ? 'bg-rose-50/80 border-rose-200 text-rose-900'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          {isSuccess === true && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
          {isSuccess === false && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
          {isSuccess === null && <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />}
          <div className="flex-1 font-medium leading-relaxed">{statusMessage}</div>
        </div>
      )}
    </div>
  );
}
