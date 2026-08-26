# ModusDesk_GSThub — Master Project Context

> This file is the **single source of truth** for any AI agent or developer working on GSThub.
> Read this ENTIRE file before making any changes, asking questions, or writing code.

> [!IMPORTANT]
> **MANDATORY PROTOCOL**: This file MUST be updated every time a new decision is made, a feature is designed, or architecture changes. Every update must also be logged in the Changelog (Section 11).

---

## 1. What Is GSThub?

**ModusDesk_GSThub** is a standalone web application, dedicated database, and companion engine that automates interactions with India's GST Common Portal (`services.gst.gov.in`) and reconciles compliance data for **Gupta Aayush & Co.** (Chartered Accountants).

It eliminates repetitive manual tasks like logging into the portal, downloading returns, checking cash/ITC credit ledgers, generating financial year MIS summaries, and matching purchase ITC — saving 10–20 hours per client per month during the GST filing cycle (1st–20th of every month).

### 1.1 Relationship to ModusDesk Core

GSThub is a **specialized statutory tool invoked from ModusDesk Core**. ModusDesk remains clean and unburdened by heavy scraping, calculation, or large invoice data.

```
┌─────────────────────────────────────────────────────────────┐
│                 ModusDesk Core (Main App)                   │
│  ─────────────────────────────────────────────────────────  │
│  • Master Client Directory & Multi-GSTIN Registrations      │
│  • Encrypted Statutory Credential Vault (AES-256-GCM)       │
│  • Staff RBAC & Session Security (Issues Signed JWT)        │
│  • Floating GST Quick Action Menu on Client Pages           │
│  • Production DB (Supabase dwvxnnfdjcagsraomooq)            │
└──────────────┬───────────────────────────────▲──────────────┘
               │ (1) Invokes with signed       │ (4) Reads client &
               │ JWT + transient credentials   │ credential details
               ▼                               │
┌──────────────────────────────────────────────┴──────────────┐
│                 ModusDesk_GSThub Web UI                     │
│  ─────────────────────────────────────────────────────────  │
│  • Hosted on Vercel (Instant updates, zero client installs) │
│  • Dedicated Free-Tier Supabase DB (Matrix, Reco, MIS)      │
│  • Practice-Wide Filing Matrix & Smart Delta Sync           │
│  • 2B vs Purchase Reco Studio (Excel Upload)                │
│  • Ledger Health Aggregator & CA MIS Comparison Suite       │
│  • Preview-First (Zero local disk clutter)                  │
└──────────────┬──────────────────────────────────────────────┘
               │ (2) Commands
               │ (http://localhost:9090)
               ▼
┌─────────────────────────────────────────────────────────────┐
│        GSThub Desktop Companion (Local PC Daemon)           │
│  ─────────────────────────────────────────────────────────  │
│  • Single installer / ZIP downloadable from ModusDesk       │
│  • Runs locally on any staff PC (Office or Remote)          │
│  • Headed Playwright: launches visible system Chrome/Edge   │
│  • Headless portal workers for bulk download & ledger pulls │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Key Architectural Rules

1. **Authentication & RBAC via JWT Handshake**: ModusDesk issues a short-lived cryptographic JWT containing `staffId`, `role` (`ADMIN` vs `STAFF`), and `allowedClientIds`. GSThub enforces client visibility strictly at the middleware and database level.
2. **Dedicated Free-Tier Supabase Database**: GSThub maintains its own isolated database for GST filing matrices, 2B reconciliation runs, and MIS comparison caches. ModusDesk's production database remains 100% clean.
3. **Transient Credential Handling**: Portal credentials decrypted by ModusDesk exist in memory only for <2 seconds during the active automation trigger. Never written to disk or logs.
4. **No Chrome Extension**: Eliminated in favor of the **Universal Desktop Companion** (`localhost:9090`).
5. **Tally Ingestion Method**: Manual Tally Excel/CSV exports are uploaded directly into GSThub. (Direct LAN XML port 9000 integration is skipped for now).
6. **Preview-First Principle**: Returns and statements preview interactively in the web UI. Zero automatic local hard drive file clutter. Export to Excel/PDF is strictly on-demand.

---

## 2. Architecture & Components

### 2.1 The 3-Tier Model

| Component | Role | Deployment |
|---|---|---|
| **ModusDesk Core** | Master client directory, encrypted credentials vault, RBAC token issuer | Vercel (`modusdesk-gaco`) + Supabase (`dwvxnnfdjcagsraomooq`) |
| **GSThub Web App** | Web UI for practice matrix, 2B reco studio, ledger dashboard, MIS reports, and dedicated storage | Vercel + Dedicated Free-Tier Supabase |
| **GSThub Desktop Companion** | Local worker running on staff PC (`http://localhost:9090`). Launches visible browser for auto-login and performs headless portal actions | Downloadable setup/zip from ModusDesk |

---

## 3. Master Feature Roadmap

| # | Code | Module Name | Priority | Description |
|---|---|---|---|---|
| **F1** | `GST-LOGIN` | **1-Click Automated Login** | 🔴 P0 | Auto-fills credentials on GST portal via Desktop Companion on staff screen. Staff types CAPTCHA and works interactively. |
| **F2** | `GST-DOWNLOAD` | **Bulk Return & Statement Downloader** | 🔴 P0 | Multi-period, selectable return types (GSTR-1, 3B, 2B JSON/Excel, acknowledgements), batch queue with interactive captcha prompt and in-browser preview. |
| **F3** | `GST-MATRIX` | **Live Practice Filing Status Matrix** | 🔴 P0 | Unified grid: all clients × return types × periods with filed/pending status, ARN, and filing date. Permanent caching of filed returns + Smart Delta Sync. |
| **F4** | `GST-RECO-2B` | **GSTR-2B vs Tally Purchase Reco Engine** | 🔴 P0 | Excel export upload from Tally vs 2B JSON. 5 classification buckets, fuzzy invoice matching, rate diffs, Section 16(4) warnings, and vendor defaulter letters. |
| **F5** | `GST-LEDGER` | **Cash & Credit Ledger Health Dashboard** | 🟡 P1 | Multi-client live view of Electronic Credit Ledger (IGST, CGST, SGST, Cess), Cash Ledger balances, and liability offset calculator. |
| **F6** | `GST-TDS` | **TDS & TCS on GST Reconciliation** | 🟡 P1 | Section 51/52 TDS/TCS cash credit extraction from portal and reconciliation. |
| **F7** | `GST-MIS-REPORTS`| **CA Reports & Comparison Suite** | 🔴 P0 | GSTR-1 vs 3B tax comparison, GSTR-2B vs 3B ITC comparison (Rule 88D), Full FY Annual Summary for GSTR-9, and Challan/PMT-06 register. |

---

## 4. Changelog

| Date | Section | Change | Reason |
|---|---|---|---|
| 2026-08-25 | Initial | Created CONTEXT.md with full project scope | Baseline architecture |
| 2026-08-25 | §1, §2, §4 | Stateless utility discussion | Early design phase |
| 2026-08-26 | §1.1, §2.1 | Decided on **Dedicated Free-Tier Supabase for GSThub** | Prevents bloating ModusDesk DB and isolates heavy GST records at ₹0 cost |
| 2026-08-26 | §1.2, §3 | Skipped Tally auto-integration in favor of **Tally Excel Export Upload** | Simplifies companion setup; eliminates local network firewall friction |
| 2026-08-26 | §3 | Added **Module 7 (`GST-MIS-REPORTS`)** | Critical CA practice requirement: GSTR-1 vs 3B, 2B vs 3B, and Annual GSTR-9 schedules |
| 2026-08-26 | §1.2 | Established **Preview-First Principle** | Zero unwanted downloads or local disk clutter; physical export on-demand only |
| 2026-08-26 | §1.2 | Clarified **Cryptographic JWT RBAC Handshake** | Strict client isolation: staff sees assigned clients only; Admin sees all |
