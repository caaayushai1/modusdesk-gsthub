# ModusDesk_GSThub — Master Technical Requirements Document (TRD)

> **Document Status**: Production Engineering Specification  
> **Target Engineering Stack**: Next.js 16 (App Router), TypeScript 5+, Tailwind CSS, Prisma ORM, PostgreSQL (Supabase), Playwright, Node.js (Daemon)  
> **Version**: 1.0.0  
> **Repository**: `ModusDesk_GSThub`  

---

## 1. Document Overview & Engineering Scope

This document specifies the technical architecture, data contracts, security protocols, database schemas, and automation algorithms for **`ModusDesk_GSThub`**. It translates the business capabilities in the Master PRD into precise engineering blueprints with zero assumptions.

---

## 2. System Architecture & Network Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            NETWORK TOPOLOGY                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [ ModusDesk Core Web App ] (Vercel)                                        │
│         │ (HTTPS / Signed JWT)                                              │
│         ▼                                                                   │
│  [ GSThub Web Application ] (Vercel: Next.js 16 App Router)                 │
│         │                                                                   │
│         ├──────── (HTTPS / Prisma Pg Adapter) ────────► [ GSThub Supabase ] │
│         │                                               (PostgreSQL DB)     │
│         │ (HTTP Loopback: 127.0.0.1:9090)                                   │
│         ▼                                                                   │
│  [ GSThub Desktop Companion ] (Local PC Daemon: Node.js)                    │
│         │                                                                   │
│         └──────── (Headless / Headed Playwright) ─────► [ GST Portal ]      │
│                                                         (gst.gov.in)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Component Specifications

| Component | Runtime / Stack | Hosting / Deployment | Network Boundary |
|---|---|---|---|
| **ModusDesk Core** | Next.js 16, TypeScript | Vercel (`modusdesk-gaco`) | Public HTTPS |
| **GSThub Web App** | Next.js 16, React 19, TypeScript, Tailwind CSS | Vercel (`gsthub-production`) | Public HTTPS |
| **GSThub Database** | PostgreSQL 15+ (Supabase Free Tier) | Supabase ap-south-1 | Encrypted SSL (Pooler 6543 / Direct 5432) |
| **Desktop Companion** | Node.js 20+ LTS, Express / Fastify, Playwright Core | Local Windows PC (`localhost:9090`) | Localhost Loopback (`127.0.0.1`) only |
| **GST Portal** | External Govt Service (`services.gst.gov.in`) | NIC / GSTN Cloud | Outbound HTTPS from Staff PC |

---

## 3. Security Architecture & Cryptographic Protocols

### 3.1 Authentication & Token Handshake Protocol

GSThub delegates all user identity and access control to ModusDesk Core via signed JSON Web Tokens (`HS256`).

```
ModusDesk Core                                           GSThub Web App
      │                                                        │
      │ 1. User clicks "GST Hub"                               │
      │ 2. Issues JWT: sign(payload, GSTHUB_JWT_SECRET)        │
      │    Payload: {                                          │
      │      staffId: string,                                  │
      │      name: string,                                     │
      │      role: "ADMIN" | "STAFF",                          │
      │      allowedClientIds: string[],                       │
      │      iat: number,                                      │
      │      exp: number (iat + 900s)                          │
      │    }                                                   │
      │                                                        │
      │ 3. Redirects / Embedded iframe with Bearer token ─────►│
      │                                                        │ 4. Middleware: verify(token)
      │                                                        │ 5. Attaches auth context
```

#### JWT Validation Middleware (`src/middleware.ts`)
```typescript
import { jwtVerify } from 'jose';

export interface GSThubAuthContext {
  staffId: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
  allowedClientIds: string[];
}

export async function verifyGSThubToken(token: string): Promise<GSThubAuthContext> {
  const secret = new TextEncoder().encode(process.env.GSTHUB_JWT_SECRET!);
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ['HS256'],
    clockTolerance: 15 // seconds
  });
  return payload as unknown as GSThubAuthContext;
}
```

### 3.2 Transient Credential Protection
* Credentials decrypted by ModusDesk Core are transmitted over HTTPS to the GSThub UI only at invocation time.
* Sent to `http://127.0.0.1:9090/api/login` via ephemeral POST body.
* Stored purely in V8 volatile memory for the duration of the Playwright typing action (<2 seconds), then dereferenced for immediate garbage collection.
* **Hard Rule**: Zero logging of passwords, tokens, or raw credentials to console, files, or telemetry.

### 3.3 Desktop Companion Loopback Security
* The Desktop Companion binds strictly to `127.0.0.1:9090`.
* CORS headers are restricted to `https://gsthub-*.vercel.app` and `http://localhost:3000`.
* Requests from external IP addresses are rejected with HTTP 403.

---

## 4. Database Schema Specification (Prisma DDL)

The dedicated GSThub Supabase database schema manages filing matrices, reconciliation runs, ledger snapshots, and MIS caches.

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 1. Practice-Wide Filing Status Matrix
model GSTFilingStatus {
  id              String   @id @default(cuid())
  clientId        String   // Matches ModusDesk Client.id
  clientCode      String   // e.g. "001A"
  clientName      String
  gstin           String   // 15-character GSTIN
  stateCode       String   // e.g. "27"
  period          String   // Format: "YYYY-MM" (e.g. "2026-07")
  financialYear   String   // Format: "YYYY-YYYY" (e.g. "2026-2027")
  isQrmp          Boolean  @default(false)
  
  // GSTR-1 / IFF Details
  gstr1Status     String   // "FILED" | "PENDING" | "OVERDUE"
  gstr1Arn        String?
  gstr1FilingDate DateTime?
  
  // GSTR-3B Details
  gstr3bStatus    String   // "FILED" | "PENDING" | "OVERDUE"
  gstr3bArn       String?
  gstr3bFilingDate DateTime?
  
  // GSTR-2B Details
  gstr2bGenerated Boolean  @default(false)
  
  lastSyncedAt    DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([clientId, gstin, period])
  @@index([clientId])
  @@index([period])
  @@index([gstr1Status, gstr3bStatus])
}

// 2. GSTR-2B vs Books (Tally) Reconciliation Records
model ITCReconciliationRun {
  id                  String   @id @default(cuid())
  clientId            String
  clientName          String
  gstin               String
  period              String   // e.g. "2026-07"
  financialYear       String   // e.g. "2026-2027"
  
  // High-Level Summary Statistics
  totalBooksInvoices  Int      @default(0)
  total2bInvoices     Int      @default(0)
  exactMatchCount     Int      @default(0)
  valueMismatchCount  Int      @default(0)
  missingIn2bCount    Int      @default(0)
  missingInBooksCount Int      @default(0)
  ineligibleCount     Int      @default(0)
  
  // Financial Totals
  booksTotalTaxable   Decimal  @default(0) @db.Decimal(15, 2)
  booksTotalTax       Decimal  @default(0) @db.Decimal(15, 2)
  gstr2bTotalTaxable  Decimal  @default(0) @db.Decimal(15, 2)
  gstr2bTotalTax      Decimal  @default(0) @db.Decimal(15, 2)
  eligibleClaimableItc Decimal @default(0) @db.Decimal(15, 2)
  
  // Detailed Compressed Payloads (JSONB for 500MB DB Optimization)
  summaryJson         Json     // Category totals, rate-wise summary
  itemsJson           Json     // Compressed array of categorized invoice line-items
  
  runAt               DateTime @default(now())
  runByStaffId        String
  runByStaffName      String

  @@index([clientId, period])
  @@index([gstin, financialYear])
}

// 3. Electronic Cash & Credit Ledger Snapshots
model GSTLedgerSnapshot {
  id               String   @id @default(cuid())
  clientId         String
  clientName       String
  gstin            String
  
  // Electronic Credit Ledger
  igstCredit       Decimal  @default(0) @db.Decimal(15, 2)
  cgstCredit       Decimal  @default(0) @db.Decimal(15, 2)
  sgstCredit       Decimal  @default(0) @db.Decimal(15, 2)
  cessCredit       Decimal  @default(0) @db.Decimal(15, 2)
  totalCredit      Decimal  @default(0) @db.Decimal(15, 2)
  
  // Electronic Cash Ledger
  cashTax          Decimal  @default(0) @db.Decimal(15, 2)
  cashInterest     Decimal  @default(0) @db.Decimal(15, 2)
  cashPenalty      Decimal  @default(0) @db.Decimal(15, 2)
  cashFee          Decimal  @default(0) @db.Decimal(15, 2)
  cashOthers       Decimal  @default(0) @db.Decimal(15, 2)
  totalCash        Decimal  @default(0) @db.Decimal(15, 2)
  
  // Liability Ledger
  liabilityBalance Decimal  @default(0) @db.Decimal(15, 2)
  
  breakdownJson    Json     // Detailed major/minor head ledger table
  snapshotDate     DateTime @default(now())

  @@index([clientId, gstin])
}

// 4. CA MIS Reports & Analytical Comparisons
model MISComparisonCache {
  id              String   @id @default(cuid())
  clientId        String
  clientName      String
  gstin           String
  financialYear   String   // e.g. "2026-2027"
  reportType      String   // "GSTR1_VS_3B" | "GSTR2B_VS_3B" | "ANNUAL_SUMMARY"
  comparisonData  Json     // Matrix of month-by-month differences and flags
  hasDiscrepancy  Boolean  @default(false)
  generatedAt     DateTime @default(now())

  @@unique([clientId, gstin, financialYear, reportType])
  @@index([clientId, financialYear])
}

// 5. Automation Job & Sync Logs
model SyncJobLog {
  id           String   @id @default(cuid())
  jobType      String   // "MATRIX_SYNC" | "RETURN_DOWNLOAD" | "LEDGER_SYNC"
  totalClients Int      @default(0)
  successCount Int      @default(0)
  failedCount  Int      @default(0)
  errorsJson   Json?
  startedAt    DateTime @default(now())
  completedAt  DateTime?
}
```

---

## 5. API Contracts & Interface Definitions

### 5.1 Desktop Companion Endpoints (`http://127.0.0.1:9090`)

#### `POST /api/login`
Launches headed browser and fills credentials on GST login page.
* **Request**:
  ```json
  {
    "portalUrl": "https://services.gst.gov.in/services/login",
    "username": "27ABCDE1234F1Z5",
    "password": "DecryptedPassword123"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Chromium launched. Credentials injected. Focus set to CAPTCHA."
  }
  ```

#### `POST /api/download-returns`
Executes headless batch extraction of selected returns for visual preview in GSThub.
* **Request**:
  ```json
  {
    "username": "27ABCDE1234F1Z5",
    "password": "DecryptedPassword123",
    "periods": ["2026-06", "2026-07"],
    "returnTypes": ["GSTR1", "GSTR3B", "GSTR2B_JSON"]
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "returns": [
      {
        "period": "2026-07",
        "returnType": "GSTR1",
        "status": "FILED",
        "arn": "AA2707260012345",
        "filingDate": "2026-08-11T14:30:00Z",
        "payloadJson": { /* Parsed Table 4, 5, 6, 7 summaries */ }
      }
    ]
  }
  ```

#### `GET /api/health`
Health check and local companion version verification.
* **Response (200 OK)**:
  ```json
  {
    "status": "HEALTHY",
    "version": "1.0.0",
    "browserChannel": "msedge",
    "uptimeSeconds": 1420
  }
  ```

---

### 5.2 GSThub Backend Endpoints (`https://gsthub.domain/api/*`)

#### `GET /api/matrix?period=2026-07`
Retrieves filing matrix for authorized clients.
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Response (200 OK)**:
  ```json
  {
    "period": "2026-07",
    "totalCount": 10,
    "filedGstr1": 8,
    "filedGstr3b": 6,
    "rows": [
      {
        "clientId": "cm...01",
        "clientCode": "001A",
        "clientName": "Acme Corp Ltd.",
        "gstin": "27ABCDE1234F1Z5",
        "gstr1Status": "FILED",
        "gstr1Arn": "AA2707260012345",
        "gstr1Date": "2026-08-11",
        "gstr3bStatus": "PENDING",
        "gstr3bArn": null,
        "gstr3bDate": null,
        "gstr2bGenerated": true,
        "lastSyncedAt": "2026-08-26T10:00:00Z"
      }
    ]
  }
  ```

#### `POST /api/reconciliation/run`
Executes in-memory reconciliation between uploaded Tally Excel and 2B JSON.
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: multipart/form-data`
* **Form Fields**: `clientId`, `gstin`, `period`, `financialYear`, `tallyFile` (Excel), `gstr2bFile` (JSON/Excel).
* **Response (200 OK)**:
  ```json
  {
    "runId": "reco_cm...01",
    "summary": {
      "totalBooks": 142,
      "total2B": 138,
      "exactMatches": 120,
      "valueMismatches": 5,
      "missingIn2B": 17,
      "missingInBooks": 13,
      "ineligibleItc": 2,
      "totalClaimable": 458200.00
    },
    "items": [ /* Formatted line items */ ]
  }
  ```

---

## 6. Playwright Automation Engine & GST Portal Selectors

### 6.1 Selector Dictionary (`portal-selectors.ts`)

```typescript
export const GST_PORTAL = {
  LOGIN_URL: 'https://services.gst.gov.in/services/login',
  DASHBOARD_URL: 'https://return.gst.gov.in/returns/auth/dashboard',
  SELECTORS: {
    USERNAME_INPUT: '#username',
    PASSWORD_INPUT: '#user_pass',
    CAPTCHA_INPUT: '#captcha',
    LOGIN_SUBMIT_BTN: 'button[type="submit"].btn-primary',
    OTP_INPUT: '#otp',
    OTP_SUBMIT_BTN: '#submit-otp',
    
    // Returns Dashboard Selectors
    RETURN_PERIOD_SELECT: '#fin_month',
    FINANCIAL_YEAR_SELECT: '#fin_year',
    SEARCH_RETURNS_BTN: '#search-btn',
    
    // Status Cards
    GSTR1_STATUS_BADGE: '#gstr1-status-badge',
    GSTR3B_STATUS_BADGE: '#gstr3b-status-badge',
    GSTR2B_DOWNLOAD_BTN: 'button[data-return="GSTR2B"]'
  }
};
```

### 6.2 1-Click Login Automation Flow (`mirror-worker/gst-login.ts`)

```typescript
import { chromium } from 'playwright-core';
import { GST_PORTAL } from './portal-selectors';

export async function launchGSTLoginSession(username: string, password: string) {
  // Launch installed system Edge/Chrome in headed mode
  const browser = await chromium.launch({
    headless: false,
    channel: 'msedge', // Fallback: 'chrome'
    args: ['--start-maximized']
  });

  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  await page.goto(GST_PORTAL.LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Fast auto-fill
  await page.fill(GST_PORTAL.SELECTORS.USERNAME_INPUT, username);
  await page.fill(GST_PORTAL.SELECTORS.PASSWORD_INPUT, password);

  // Set keyboard focus on CAPTCHA field
  await page.focus(GST_PORTAL.SELECTORS.CAPTCHA_INPUT);

  // Handoff to user (keep browser open)
  return { success: true };
}
```

---

## 7. Algorithmic Specifications

### 7.1 Invoice Normalization & Fuzzy Matching Algorithm

To overcome invoice formatting differences between Tally entries and vendor GSTR-2B filings:

```
Step 1: Normalization Pipeline
  Input String: "INV/2026-27/0042"
  1. Convert to Uppercase: "INV/2026-27/0042"
  2. Strip All Non-Alphanumeric Chars: "INV2026270042"
  3. Strip Leading Zeroes: "INV20262742"
  Normalized Key = SupplierGSTIN + "_" + NormalizedInvoiceNo

Step 2: Matching Pass Hierarchy
  Pass 1 (Exact Match):
    Normalized Key Match AND Total Tax within ₹1.00 tolerance (Round-off)
    -> Categorize as EXACT_MATCH

  Pass 2 (Value / Rate Mismatch):
    Normalized Key Match AND Tax Difference > ₹1.00
    -> Categorize as VALUE_MISMATCH

  Pass 3 (Date Offset Match):
    SupplierGSTIN Match AND Total Tax Match AND Date within ±30 days
    -> Categorize as PROBABLE_MATCH (Flagged for 1-click staff review)

  Pass 4 (Unmatched Buckets):
    In Tally but not in 2B -> MISSING_IN_2B
    In 2B but not in Tally -> MISSING_IN_BOOKS

Step 5 (Statutory Flagging):
    If Invoice Date < FY_START - 240 days AND Period > November -> Flag INELIGIBLE (Sec 16(4))
```

---

### 7.2 CA MIS Analytics & Comparison Engine

#### GSTR-1 vs GSTR-3B Liability Discrepancy Algorithm
$$\text{Tax Liability Diff} = \text{GSTR-1 (Outward Tax)} - \text{GSTR-3B Table 3.1 (Tax Declared)}$$
* If $\text{Diff} > 0$: Flag **RED** (Tax under-reported in 3B, interest risk under Sec 50).
* If $\text{Diff} < 0$: Flag **AMBER** (Tax over-paid in 3B, verify adjustment).

#### GSTR-2B vs GSTR-3B ITC Discrepancy Algorithm (Rule 88D)
$$\text{ITC Diff} = \text{GSTR-3B Table 4(A) (ITC Claimed)} - \text{GSTR-2B (Eligible ITC Auto-Drafted)}$$
* If $\text{ITC Diff} > 0$: Flag **RED (Rule 88D Notice Alert)**. Display exact excess percentage and tax amount to prevent demand DRC-01C notices.

---

## 8. Desktop Companion Packaging & Windows Distribution

### 8.1 Distribution Package Structure (`ModusDesk_Companion_Setup.zip`)

```
ModusDesk_Companion/
├── start-companion.bat      # Windows batch startup script
├── stop-companion.bat       # Process killer script
├── package.json             # Runtime manifest
├── node_modules/            # Embedded lightweight runtime
└── dist/
    ├── server.js            # Express loopback server (localhost:9090)
    ├── gst-login.js         # Headed Playwright worker
    └── portal-worker.js     # Headless data extraction worker
```

### 8.2 Windows Batch Script (`start-companion.bat`)
```bat
@echo off
title ModusDesk GSThub Companion
echo Starting ModusDesk Desktop Companion on port 9090...
start /B node dist/server.js
echo Companion is active in background! You can now use 1-Click Login and Portal Automations.
pause
```

---

## 9. Technical Risk Assessment & Mitigation

| Technical Risk | Likelihood | Impact | Architectural Mitigation |
|---|---|---|---|
| **GST Portal Selector Changes** | Medium | High | Centralized `portal-selectors.ts` config file; version-pinned Playwright; instant Vercel redeploy. |
| **Supabase Free Tier 500MB Exhaustion** | Low | Medium | Store row-level line items in compressed `JSONB`; relational tables hold only indexed summary headers. |
| **Windows Port 9090 Conflict** | Low | Low | Companion checks port availability on startup; falls back to port `9091` with automatic handshake negotiation. |
| **Slow Internet / Portal 504 Timeout** | High | Low | Exponential backoff (retry after 3s, 6s); non-blocking async job queue. |

---

## 10. Phased Engineering Milestones

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DEVELOPMENT PHASES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ Milestone 1: Desktop Companion Daemon (`localhost:9090`) + 1-Click Login    │
│   ▼                                                                         │
│ Milestone 2: Dedicated Supabase Setup + Practice Matrix & Delta Sync        │
│   ▼                                                                         │
│ Milestone 3: Bulk Returns Extraction Engine + Interactive Browser Preview   │
│   ▼                                                                         │
│ Milestone 4: GSTR-2B vs Tally Purchase Reco Engine (Excel Ingestion)        │
│   ▼                                                                         │
│ Milestone 5: Ledger Dashboard, TDS Reco & Full CA MIS Comparison Suite      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Engineering Sign-Off

This document defines the complete technical blueprint for **`ModusDesk_GSThub`**.
Upon confirmation, we will proceed immediately with **Milestone 1: Desktop Companion Daemon and 1-Click Login (`GST-LOGIN`)** implementation.
