# ModusDesk_GSThub — Master Project Context

> This file is the **single source of truth** for any AI agent or developer working on GSThub.
> Read this ENTIRE file before making any changes, asking questions, or writing code.

> [!IMPORTANT]
> **MANDATORY PROTOCOL**: This file MUST be updated every time a new decision is made, a feature is designed, or architecture changes. Every update must also be logged in the Changelog (Section 11).

---

## 1. What Is GSThub?

**ModusDesk_GSThub** is a **zero-storage utility application** and companion engine that automates interactions with India's GST Common Portal (`services.gst.gov.in`) and reconciles data with **Tally Prime / ERP 9** for Gupta Aayush & Co. (Chartered Accountants).

It eliminates repetitive manual tasks like logging into the portal, downloading returns, checking cash/ITC credit ledgers, and matching purchase ITC — saving 10–20 hours per client per month during the GST filing cycle (1st–20th of every month).

### 1.1 Relationship to ModusDesk Core

GSThub is a **utility tool consumed by ModusDesk**. It stores NO data of its own. All persistent data (client info, credentials, reconciliation results, filing status, ledger snapshots) lives in **ModusDesk's database**.

```
┌─────────────────────────────────────────────────────────────┐
│                 ModusDesk Core (Main App)                   │
│  ─────────────────────────────────────────────────────────  │
│  • Client & Group Management                                │
│  • Statutory Credential Vault (AES-256-GCM encrypted)       │
│  • Staff RBAC & Auth Session Layer                          │
│  • Floating GST Quick Action Menu on Client Pages           │
│  • Master Persistent Storage (Supabase dwvxnnfdjcagsraomooq)│
└──────────────┬───────────────────────────────▲──────────────┘
               │ Invokes with                  │ Sends back
               │ transient creds               │ processed data
               ▼                               │
┌───────────────────────────────┐              │
│   ModusDesk_GSThub Web UI     ├──────────────┤
│  ───────────────────────────  │              │
│  • Multi-Client GST Hub       │              │
│  • Filing Status Matrix       │              │
│  • 2B vs Tally Reco Studio    │              │
│  • Ledger Health Aggregator   │              │
└──────────────┬────────────────┘              │
               │ Commands                      │ Local data
               │ (localhost:9090)              │ & downloads
               ▼                               │
┌──────────────────────────────────────────────┴──────────────┐
│       GSThub Desktop Companion (Local Machine Worker)       │
│  ─────────────────────────────────────────────────────────  │
│  • Single installer / ZIP downloadable from ModusDesk       │
│  • Runs locally on any staff PC (Office or Remote)          │
│  • Headed Playwright: launches visible Chrome on staff's PC │
│  • Reads Tally directly via LAN XML Server (Port 9000)      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Key Architectural Rules

1. GSThub has **NO auth, login, or RBAC** of its own. It inherits permissions from ModusDesk.
2. GSThub has **NO database** of its own. It is completely stateless.
3. **All persistent data** (reconciliation results, filing status matrices, ledger snapshots, download job logs) is stored in **ModusDesk's Supabase database** via new tables/columns added to ModusDesk's Prisma schema.
4. Credentials are passed transiently from ModusDesk at invocation time. GSThub never persists them.
5. **No Chrome Extension**: Eliminated in favor of the **Universal Desktop Companion** (`localhost:9090`) which works identically for office and remote staff.

---

## 2. Architecture & Components

### 2.1 The 3-Tier Execution Model

| Component | Role | Deployment |
|---|---|---|
| **ModusDesk Core** | Master client directory, encrypted credentials vault, RBAC, and storage of filing/reco records | Vercel (`modusdesk-gaco`) + Supabase |
| **GSThub Web App** | Web interface for multi-client matrix, bulk download config, reconciliation studio, and ledger dashboard | Vercel (standalone utility project) |
| **GSThub Desktop Companion** | Local worker running on staff's PC (`http://localhost:9090`). Launches visible Chrome for auto-login, performs headless bulk portal operations, and connects to local Tally | Downloadable setup/zip from ModusDesk |

### 2.2 Why the Universal Desktop Companion?
* **Zero Headless Streaming Complexity**: Launches a real, visible Edge/Chrome window directly on the staff's monitor.
* **Natural CAPTCHA Flow**: Auto-fills username and password in under 500ms, places cursor focus into the CAPTCHA box — staff types the 6-character captcha and hits Enter.
* **Remote Friendly**: Remote staff install the single setup file once on their laptop; it works seamlessly from home or office.
* **Direct Tally Access**: Can query Tally Prime running locally on the same PC (`http://localhost:9000`) without network firewalls.

---

## 3. Feature Scope & Priority (Master Roadmap)

| # | Feature Code | Module Name | Priority | Description |
|---|---|---|---|---|
| **F1** | `GST-LOGIN` | **1-Click Automated Login** | 🔴 P0 | Auto-fills credentials on GST portal via Desktop Companion on staff screen. Staff types CAPTCHA and works interactively. |
| **F2** | `GST-DOWNLOAD` | **Bulk Return & Statement Downloader** | 🔴 P0 | Multi-period, selectable return types (GSTR-1, 3B, 2B JSON/Excel, acknowledgements), batch queue with interactive captcha prompt. |
| **F3** | `GST-MATRIX` | **Live Filing Status Matrix** | 🔴 P0 | Unified practice grid showing all clients × return types × periods with filing status, ARN, and filing timestamp. |
| **F4** | `GST-RECO-2B` | **GSTR-2B vs Tally Purchase Reco Engine** | 🔴 P0 | Automated fuzzy invoice matching, 5 classification buckets, tax rate difference checks, ineligible ITC warnings, and vendor defaulter letter generation. |
| **F5** | `GST-LEDGER` | **Cash & Credit Ledger Health Dashboard** | 🟡 P1 | Multi-client live view of Electronic Credit Ledger (IGST, CGST, SGST, Cess), Electronic Cash Ledger, and liability balances. |
| **F6** | `GST-TDS` | **TDS & TCS on GST Reconciliation** | 🟡 P1 | Section 51/52 TDS/TCS cash credit extraction from portal and reconciliation. |

### Explicitly Excluded / Deferred
- ❌ **Chrome / Edge Extension**: Removed completely from architecture.
- ❌ **Tally to GSTR-1 JSON Generation**: Deferred (Tally already exports upload-ready JSON).
- ❌ **Document Vault Sync for Raw Returns**: Excluded (downloaded returns are stored locally by the user or fetched on demand to save cloud storage costs).

---

## 4. UI & ModusDesk Integration Surface

### 4.1 ModusDesk Floating Quick Action Menu
On every Client Detail Page (`/clients/[id]`), a floating context menu provides instant actions:
1. **⚡ Quick Login**: Directly sends client GST credentials to local Desktop Companion → opens browser with credentials filled.
2. **📥 Download Returns**: Opens GSThub directly in the Returns Downloader module pre-filtered for this client.
3. **🚀 Open in GSThub**: Launches GSThub with all client modules active (Ledgers, 2B Reco, Filing Status).

### 4.2 API Contracts

#### ModusDesk → GSThub:
* `GET /api/clients/[id]/credentials` (Decrypted credentials for GST platform)
* `GET /api/clients?limit=1000` (Client directory & GSTIN registrations)

#### GSThub → ModusDesk (Persistence):
* `POST /api/gst/filing-status` (Saves multi-client matrix status)
* `POST /api/gst/reconciliation-runs` (Saves 2B vs Tally reconciliation snapshots)
* `POST /api/gst/ledger-snapshots` (Saves cash/credit ledger balances)

#### GSThub Web UI → GSThub Desktop Companion:
* `POST http://localhost:9090/api/login` (Triggers headed browser auto-fill)
* `POST http://localhost:9090/api/download-returns` (Triggers download batch)
* `GET http://localhost:9090/api/tally/purchase-register` (Pulls Tally purchase data)

---

## 5. Changelog

| Date | Section | Change | Reason |
|---|---|---|---|
| 2026-08-25 | Initial | Created CONTEXT.md with full project scope | Baseline architecture |
| 2026-08-25 | §1, §2, §4 | Converted GSThub to zero-storage stateless utility | Data persistence unified into ModusDesk DB |
| 2026-08-26 | §1.1, §2.2 | Adopted **Universal Desktop Companion** (`localhost:9090`) | Solves shared server issue & enables remote staff with 1 installer |
| 2026-08-26 | §3, §4.1 | Removed Chrome Extension completely; added **ModusDesk Floating Quick Action Menu** | Streamlined UI and consolidated user workflow |
| 2026-08-26 | §3 | Confirmed Master Feature Roadmap (F1 to F6) | Basis for Master PRD and Sub-PRDs |
