'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

interface ApiSessionModalProps {
  client: {
    id: string;
    name: string;
    code: string;
    gstin: string;
  };
  onSessionActivated: () => void;
  onClose: () => void;
}

export function ApiSessionModal({ client, onSessionActivated, onClose }: ApiSessionModalProps) {
  const [step, setStep] = useState<'INITIAL' | 'OTP_SENT' | 'SUCCESS'>('INITIAL');
  const [otp, setOtp] = useState('');
  const [maskedMobile, setMaskedMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRequestOtp = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await fetch('/api/reco/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_OTP',
          clientId: client.id,
          gstin: client.gstin,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to request OTP');

      setMaskedMobile(json.maskedMobile || '+91 ******9912');
      setStep('OTP_SENT');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await fetch('/api/reco/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_OTP',
          clientId: client.id,
          gstin: client.gstin,
          otp,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Invalid OTP');

      setStep('SUCCESS');
      setTimeout(() => {
        onSessionActivated();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs select-none">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              30-Day GSTN API Session
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Client Details Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Client:</span>
              <span className="text-slate-900 font-semibold">{client.code} — {client.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">GSTIN:</span>
              <span className="font-mono text-slate-800 font-semibold">{client.gstin}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200/60 text-[11px]">
              <span className="text-slate-500">Session Validity:</span>
              <span className="text-slate-700 font-medium">30 Continuous Days</span>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'INITIAL' && (
            <div className="space-y-3 pt-1">
              <p className="text-xs text-slate-600 leading-relaxed">
                Clicking request will trigger a 1-time OTP to the registered authorized signatory. Once entered, GST Hub can pull GSTR-2B and ledger balances for <strong>30 days with zero additional OTPs</strong>.
              </p>
              <button
                onClick={handleRequestOtp}
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Requesting OTP...' : 'Send 30-Day Session OTP'}
              </button>
            </div>
          )}

          {step === 'OTP_SENT' && (
            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Enter 6-Digit OTP received on <span className="font-mono font-bold text-slate-900">{maskedMobile}</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-widest font-mono text-lg font-bold py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('INITIAL')}
                  className="w-1/3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
                >
                  Resend
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length !== 6}
                  className="w-2/3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isLoading ? 'Activating...' : 'Verify & Activate'}
                </button>
              </div>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="py-4 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="text-xs font-bold text-slate-900">
                30-Day API Session Active!
              </div>
              <p className="text-[11px] text-slate-500">
                GSTR-2B and ledger sync enabled for the next 30 days.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
