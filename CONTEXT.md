# ModusDesk_GSThub — Master Project Context

> This file is the **single source of truth** for any AI agent or developer working on GSThub.
> Read this ENTIRE file before making any changes, asking questions, or writing code.

> [!IMPORTANT]
> **MANDATORY PROTOCOL**: This file MUST be updated every time a new decision is made, a feature is designed, or architecture changes. Every update must also be logged in the Changelog (Section 11).

---

## 1. What Is GSThub?

**ModusDesk_GSThub** is a **zero-storage utility application** that automates interactions with India's GST Common Portal (`services.gst.gov.in`) for Gupta Aayush & Co. (Chartered Accountants). It eliminates repetitive manual tasks like logging into the portal, downloading returns, checking ledgers, and reconciling ITC — saving 10–20 hours per client per month during the GST filing cycle (1st–20th of every month).

### 1.1 Relationship to ModusDesk Core

GSThub is a **utility tool consumed by ModusDesk**. It stores NO data of its own. All persistent data (client info, credentials, reconciliation results, filing status, etc.) lives in **ModusDesk's database**.

```
┌──────────────────────────────────┐           ┌───────────────────────────────┐
│  ModusDesk Core (Main App)       │           │  ModusDesk_GSThub (Utility)   │
│  ─────────────────────────────   │           │  ─────────────────────────    │
│  • Client management             │  invokes  │  • GST portal automation      │
│  • Credential Vault (encrypted)  ├──────────►│  • Return downloads           │
│  • Staff RBAC & Auth             │  passes   │  • Ledger checks              │
│  • Document management           │  creds    │  • 2B vs Tally reconciliation │
│  • Work tracking                 │           │  • Filing status matrix       │
│  • ALL persistent storage        │◄──────────┤  • Sends results BACK         │
│                                  │  results  │  • ZERO own storage            │
│  Vercel: modusdesk-gaco          │           │  Vercel: separate project     │
│  Supabase: dwvxnnfdjcagsraomooq  │           │  Supabase: NONE (stateless)   │
└──────────────────────────────────┘           └───────────────────────────────┘
```

### 1.2 Key Architectural Rules

1. GSThub has **NO auth, login, or RBAC** of its own.
2. GSThub has **NO database** of its own. It is stateless.
3. **All persistent data** (reconciliation results, filing status, ledger snapshots, download logs) is stored in **ModusDesk's Supabase database** via new tables/columns added to ModusDesk's Prisma schema.
4. Credentials are passed transiently from ModusDesk at invocation time. GSThub never stores them.
5. GSThub is accessed from within the ModusDesk UI (embedded or linked).

### 1.3 Bidirectional Data Flow

```
ModusDesk → GSThub:
  • Client list, GSTIN registrations
  • Decrypted portal credentials (transient, in-memory only)
  • Task instructions (which clients, which periods, which returns)

GSThub → ModusDesk:
  • Reconciliation results (matched/mismatched/missing invoices)
  • Filing status data (filed/pending/ARN per client per period)
  • Ledger balances (cash, credit, liability snapshots)
  • Downloaded return files (passed back, not stored in GSThub)
```

### 1.4 ModusDesk Schema Extension Protocol

> [!IMPORTANT]
> Building GSThub features will require adding new tables, columns, or APIs to ModusDesk Core.
> These changes follow ModusDesk's existing **6-Gate Release SOP** (defined in ModusDesk's `AGENTS.md`).

Examples of ModusDesk changes that GSThub features will trigger:
- New Prisma models (e.g., `GSTFilingStatus`, `ITCReconciliation`, `LedgerSnapshot`)
- New API routes in ModusDesk (e.g., `POST /api/gst/reconciliation-results`)
- New UI components in ModusDesk (e.g., GST filing status widget on client detail page)

**Protocol**: When a GSThub feature requires a ModusDesk schema/API change:
1. Document the required change in the feature's Sub-PRD
2. Implement the ModusDesk change first (follows ModusDesk's 6-Gate SOP)
3. Then implement the GSThub utility code that uses it

---

## 2. Architecture Decisions (Finalized)

### 2.1 Infrastructure
| Component | Decision |
|---|---|
| **Frontend** | Separate Next.js app on its own Vercel project |
| **Database** | **NONE.** GSThub is stateless. All data persisted in ModusDesk's Supabase (`dwvxnnfdjcagsraomooq`) |
| **Auth/RBAC** | None. Invoked as a tool from ModusDesk which handles all access control |
| **Credentials** | Never stored. Received transiently from ModusDesk's `ClientCredential` vault via API |

### 2.2 GST Portal Automation Engine
| Component | Decision |
|---|---|
| **Office automation** | **Local Mirror Worker** (Playwright on office network machine) — core engine for all features |
| **Remote login** | **Chrome/Edge Extension** — lightweight add-on for single-client manual login when staff is outside office |
| **Bulk tasks** | Always via Local Mirror (headless Playwright). Extension cannot do background work |

### 2.3 Why Local Mirror?
The existing ModusDesk **Local Mirror** service already runs on the office network. It provides:
- Direct LAN access (consistent IP reduces GST portal OTP triggers)
- Playwright/headless browser capability
- Authenticated connection back to ModusDesk cloud via `MIRROR_AUTH_TOKEN`
- Access to Tally (via XML Server port 9000 or Excel exports on the same network)

GSThub adds a **GST Worker module** to this existing Local Mirror infrastructure.

---

## 3. Feature Scope & Priority

### Confirmed Features (Build Order)

| # | Feature | Priority | Description |
|---|---|---|---|
| **F1** | **Automated Login** | 🔴 P0 | Auto-fill username + password on GST portal via Local Mirror (headed Playwright). Staff types CAPTCHA and uses portal normally. Chrome Extension for remote login. |
| **F2** | **Bulk Return Downloader** | 🔴 P0 | Download GSTR-1, 3B, 2B (JSON/Excel), acknowledgements for multiple clients × multiple periods. Queued CAPTCHA solving. Multi-period selection. |
| **F3** | **Live Filing Status Matrix** | 🔴 P0 | Single grid: all clients × return types × periods showing filed/pending/ARN/date. Practice-wide filing dashboard. |
| **F4** | **GSTR-2B vs Tally Purchase ITC Reconciliation** | 🔴 P0 | Fuzzy invoice matching (format differences, date tolerance). Buckets: Exact Match, Value Mismatch, Missing in 2B, Missing in Tally, Ineligible ITC. Vendor defaulter letter generation. |
| **F5** | **Cash & Credit Ledger Dashboard** | 🟡 P1 | Multi-client view of Electronic Credit Ledger (IGST/CGST/SGST/Cess), Cash Ledger balances, and Liability Ledger. |
| **F6** | **TDS/TCS Reconciliation (GSTR-7/8)** | 🟡 P1 | Pull and reconcile TDS credits under Section 51 available in Electronic Cash Ledger. |

### Explicitly Deferred
- Tally-to-GSTR-1 JSON generation (Tally already does this natively)
- Document Vault sync for downloaded returns (unnecessary storage cost — returns are always available online)

---

## 4. ModusDesk Integration Surface

### 4.1 Credential Vault API (ModusDesk Core → GSThub)

GSThub retrieves decrypted credentials from ModusDesk's existing API:

```
GET /api/clients/[clientId]/credentials
Authorization: Bearer <staff-session-cookie>

Response: [
  {
    "id": "cred_xxx",
    "platform": "GST",
    "username": "27ABCDE1234F1Z5",   // Decrypted
    "password": "p@ssw0rd",           // Decrypted
    "secondaryPasscode": null,
    "portalUrl": "https://services.gst.gov.in/services/login",
    "registration": {
      "id": "reg_xxx",
      "registrationType": "GST",
      "registrationNumber": "27ABCDE1234F1Z5",
      "label": "Maharashtra GSTIN"
    }
  }
]
```

**Security**: Credentials are decrypted by ModusDesk's `decryptCredentialFields()` using AES-256-GCM with `FIELD_ENCRYPTION_KEY`. GSThub never sees the encryption key or ciphertext.

### 4.2 Client Data API (ModusDesk Core → GSThub)

```
GET /api/clients?limit=1000&status=ALL
GET /api/clients/[id]
GET /api/clients/[id]/registrations
```

### 4.3 Results Storage API (GSThub → ModusDesk Core)

> [!NOTE]
> These APIs don't exist yet. They will be created in ModusDesk as each GSThub feature is built.

```
POST /api/gst/filing-status          ← F3: Filing status matrix data
POST /api/gst/reconciliation         ← F4: 2B vs Tally reconciliation results
POST /api/gst/ledger-snapshot        ← F5: Cash/Credit ledger balances
```

### 4.4 Local Mirror Communication

The Local Mirror authenticates to ModusDesk Cloud via:
```
Authorization: Bearer <MIRROR_AUTH_TOKEN>
```

GSThub will communicate with Local Mirror for browser automation tasks via a similar authenticated channel on the LAN.

---

## 5. GST Portal Technical Knowledge

### 5.1 Login Flow (services.gst.gov.in)

```
1. Navigate to https://services.gst.gov.in/services/login
2. Input: Username (typically GSTIN or custom username)
3. Input: Password
4. Input: CAPTCHA (6-character distorted image, changes every load)
5. Click "Login"
6. Possible: OTP verification on registered mobile (triggered by new IP/device)
```

**CAPTCHA handling**: Screenshot CAPTCHA element → send to staff browser → staff types it → submit. Zero cost, no third-party service.

**OTP handling**: The `registeredContactNote` field in ClientCredential stores whose phone gets the OTP (e.g., "OTP goes to Director phone: 98765xxxxx"). Staff enters OTP manually when prompted.

**Session duration**: ~15 minutes of inactivity before auto-logout.

### 5.2 Key Portal URLs

| Portal | URL | Use Case |
|---|---|---|
| GST Login | `https://services.gst.gov.in/services/login` | Authentication |
| GSTR-1 | `https://return.gst.gov.in/returns/auth/gstr1` | Sales return |
| GSTR-3B | `https://return.gst.gov.in/returns/auth/gstr3b` | Summary return |
| GSTR-2B | `https://return.gst.gov.in/returns/auth/gstr2b` | ITC statement |
| Cash Ledger | `https://return.gst.gov.in/returns/auth/cashledger` | Cash balance |
| Credit Ledger | `https://return.gst.gov.in/returns/auth/creditledger` | ITC balance |
| Returns Dashboard | `https://return.gst.gov.in/returns/auth/dashboard` | Filing status |

### 5.3 Portal Anti-Bot Defenses

| Defense | Impact | Mitigation |
|---|---|---|
| Image CAPTCHA on login | Cannot auto-solve reliably | Staff manually types (2-3 seconds) |
| OTP on new IP/device | Blocks automation from cloud | Local Mirror on office LAN maintains consistent IP |
| Session timeout (15 min) | Session expires if idle | Refresh session before operations; re-login if expired |
| Rate limiting | Too many requests = temp block | Queue operations with 3-5 second delays between clients |
| Dynamic selectors | Portal UI updates can break selectors | Maintain selector config file; version-pinned Playwright |

---

## 6. Tally Integration Knowledge

### 6.1 Connection Method
- **Primary**: Tally runs on the office LAN. ModusDesk Local Mirror is on the same network.
- **Tally XML Server**: Tally Prime exposes an HTTP server (default port `9000`) that accepts XML queries and returns structured data.
- **Fallback**: Staff exports Purchase Register / Sales Register as Excel from Tally and uploads to GSThub.

### 6.2 Data Needed from Tally (for GSTR-2B Reconciliation)
- Purchase Register: Supplier GSTIN, Invoice Number, Invoice Date, Taxable Value, IGST, CGST, SGST, Cess
- Sales Register: (for future GSTR-1 validation, currently deferred)

---

## 7. Technical Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend API | Next.js API Routes (Vercel serverless) |
| Database | **ModusDesk's Supabase** (GSThub is stateless; new tables added to ModusDesk schema) |
| ORM | Prisma with `@prisma/adapter-pg` (ModusDesk's existing setup) |
| Browser Automation | Playwright (runs on Local Mirror office machine) |
| Remote Login | Chrome/Edge Extension (Manifest V3) |
| Tally Integration | HTTP/XML over LAN (port 9000) or Excel upload |

---

## 8. Directory Structure (Planned)

```
ModusDesk_GSThub/
├── AGENTS.md                    # Operating guidelines & release protocol
├── CONTEXT.md                   # THIS FILE — project knowledge base
├── docs/
│   ├── PRD_F1_Automated_Login.md
│   ├── PRD_F2_Bulk_Return_Downloader.md
│   ├── PRD_F3_Filing_Status_Matrix.md
│   ├── PRD_F4_2B_Tally_Reconciliation.md
│   ├── PRD_F5_Ledger_Dashboard.md
│   └── PRD_F6_TDS_Reconciliation.md
├── app/                         # Next.js utility application (stateless)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── package.json
├── extension/                   # Chrome Extension (for remote login)
│   ├── manifest.json
│   └── ...
└── mirror-worker/               # GST Worker module for Local Mirror
    ├── gst-login.ts
    ├── gst-downloader.ts
    └── ...
```

---

## 9. Cross-Reference: ModusDesk Core Files

These ModusDesk files are relevant to GSThub integration (changes to these follow ModusDesk's 6-Gate SOP):

| File | Purpose | Location |
|---|---|---|
| `ClientCredential` model | Encrypted vault schema | `app/prisma/schema.prisma` (lines 462–495) |
| Credentials API (GET) | Fetch decrypted creds | `app/src/app/api/clients/[id]/credentials/route.ts` |
| Credentials API (CRUD) | Update/delete creds | `app/src/app/api/clients/[id]/credentials/[credentialId]/route.ts` |
| `server-crypto.ts` | AES-256-GCM encrypt/decrypt | `app/src/lib/server-crypto.ts` |
| `permissions.ts` | `canSeeClient()` RBAC | `app/src/lib/permissions.ts` |
| Mirror auth pattern | `MIRROR_AUTH_TOKEN` | `app/src/middleware.ts` (line 18) |
| Client vault UI | Vault component | `app/src/components/clients/client-credentials-vault.tsx` |
| Prisma schema | All models | `app/prisma/schema.prisma` |

---

## 10. Key Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-08-25 | GSThub is a separate standalone app (own Vercel, own git repo) | Code isolation from ModusDesk; independent deployment |
| 2026-08-25 | GSThub is a **zero-storage stateless utility** | All data persists in ModusDesk's DB; avoids data duplication and sync issues |
| 2026-08-25 | Building GSThub will require ModusDesk schema/API changes | New tables for filing status, reconciliation results, ledger snapshots added to ModusDesk's Prisma schema |
| 2026-08-25 | No auth/RBAC in GSThub | Internal tool invoked from ModusDesk which handles access control |
| 2026-08-25 | Zero credentials stored in GSThub | Security: single vault of truth in ModusDesk |
| 2026-08-25 | Local Mirror (Playwright) for office automation | Already deployed, same LAN as Tally, consistent IP reduces OTP |
| 2026-08-25 | Chrome Extension for remote login only | Extension can't do background/bulk work; only needed for quick remote login |
| 2026-08-25 | No Document Vault sync for downloaded returns | Returns always available online; saves storage cost |
| 2026-08-25 | Tally connection via LAN (XML port 9000) with Excel fallback | Staff runs Tally on same office network as Local Mirror |
| 2026-08-25 | Tally→GSTR-1 JSON generation deferred | Tally natively generates upload-ready JSON |

---

## 11. Changelog

> [!NOTE]
> Every update to this document must be logged here with date, what changed, and why.

| Date | Section | Change | Reason |
|---|---|---|---|
| 2026-08-25 | Initial | Created CONTEXT.md with full project scope | Foundation document for GSThub development |
| 2026-08-25 | §1, §2, §4, §7 | Removed separate Supabase; GSThub is now fully stateless | User decision: GSThub stores zero data; all results persist in ModusDesk's DB |
| 2026-08-25 | §1.3 | Added bidirectional data flow diagram | Clarify that GSThub sends processed results back to ModusDesk |
| 2026-08-25 | §1.4 | Added ModusDesk Schema Extension Protocol | Building GSThub features will require ModusDesk schema/API changes |
| 2026-08-25 | §11 | Added mandatory Changelog section | Protocol: all context updates must be logged |
