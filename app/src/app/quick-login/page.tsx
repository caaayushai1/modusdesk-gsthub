'use client';

import React from 'react';
import { QuickLoginCard } from '@/components/quick-login-card';
import { Zap, ShieldCheck, Terminal, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function QuickLoginPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg font-bold text-slate-900">
              1-Click Automated GST Login
            </h1>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
              Desktop Companion
            </span>
          </div>
          <p className="text-body-md text-slate-500 mt-1">
            Instantly launch the official GST Common Portal in Chrome with credentials securely auto-filled.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors self-start sm:self-auto"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Quick Login Card */}
      <QuickLoginCard />

      {/* Companion Instructions Banner */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-xs text-slate-600 space-y-3">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Terminal className="w-4 h-4 text-emerald-600" />
          <span>Desktop Companion Instructions</span>
        </div>
        <p className="leading-relaxed">
          The 1-Click login uses Playwright via your local Desktop Companion running on <code className="font-jetbrains text-[11px] bg-slate-200/70 px-1 py-0.5 rounded text-slate-800">http://127.0.0.1:9090</code>. It opens a dedicated Chrome browser window on your primary monitor with your client&apos;s username and password auto-typed, leaving the cursor in the CAPTCHA box for fast 5-second logins.
        </p>
        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Credentials are transmitted ephemerally via AES-256-GCM memory buffers and never stored in plain text.</span>
        </div>
      </div>
    </div>
  );
}
