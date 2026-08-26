# ModusDesk_GSThub — Master Product Requirements Document (PRD)

> **Document Status**: Final Specification — Ready for Implementation  
> **Product Name**: `ModusDesk_GSThub`  
> **Target Audience**: Gupta Aayush & Co. (Chartered Accountants) — Partners, Qualified CAs, and Article Assistants  
> **Version**: 1.0.0  
> **Repository**: `ModusDesk_GSThub` (Isolated repository and deployment pipeline)  

---

## 1. Executive Summary & Problem Space

In Indian Chartered Accountancy practice, the monthly statutory GST compliance cycle (1st to 20th of every month) is heavily bogged down by repetitive manual tasks:

1. **Login Overhead**: Staff repeatedly copy-paste usernames and passwords for 50+ clients across dozens of GSTINs, interrupting workflow and risking credential leaks.
2. **Filing Status Blindspots**: Managing Partners lack a live, single-screen dashboard showing which clients have filed GSTR-1 / GSTR-3B vs which are pending or overdue.
3. **GSTR-2B vs Purchase Reconciliation Bottleneck**: Article assistants spend 10–20 hours per client manually matching Tally purchase registers against portal GSTR-2B files, struggling with formatting discrepancies, tax rate mismatches, and Section 16(4) time-barred ITC.
4. **Pre-3B Ledger Calculations**: Calculating tax payments requires manually logging into every client's portal to check Electronic Cash and Credit Ledgers.
5. **Year-End MIS & Audit Fatigue**: Preparing GSTR-9 annual summaries and GSTR-1 vs 3B / 2B vs 3B comparisons requires tedious cross-period data consolidation.

**ModusDesk_GSThub** solves these operational bottlenecks with an integrated **3-Tier Architecture**:
* **Hosted Web Application (Vercel)**: Instant updates, zero installation for UI, and high-performance dashboards.
* **Dedicated Free-Tier Database (Supabase)**: Isolates heavy GST filing matrices, reconciliation snapshots, and MIS reports without bloating ModusDesk's production database.
* **Universal Desktop Companion (Local PC Daemon on `localhost:9090`)**: A lightweight Windows companion that launches visible browser sessions on the staff's monitor and automates portal interactions.

---

## 2. 3-Tier System Architecture & Topology

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

### Core Architecture Rules
1. **ModusDesk Core remains unburdened**: No Playwright scripts, heavy reconciliation algorithms, or bulk GST data are stored or executed inside ModusDesk.
2. **Dedicated Free-Tier Database**: GSThub uses its own dedicated Supabase database for storing matrix snapshots, reconciliation runs, and MIS caches. Cost: **₹0** (free tier).
3. **Zero Credential Persistence in GSThub**: Credentials exist decrypted only in volatile memory for <2 seconds during the active automation handoff.
4. **Preview-First Principle**: All portal returns and statements are parsed and rendered interactively in the web UI. Files are never downloaded to local disk unless the user explicitly clicks "Export".

---

## 3. Authentication, Security & RBAC Protocol

### 3.1 Cryptographic JWT Handshake
GSThub does not have an independent login page. When a user navigates to GSThub from ModusDesk, an authenticated handshake occurs:

```
[ ModusDesk Core (Next.js) ]                             [ GSThub (Next.js + Supabase) ]
             │                                                         │
             │ 1. Staff clicks "GST Hub"                               │
             │ 2. ModusDesk generates short-lived JWT                  │
             │    (Signed with GSTHUB_SHARED_SECRET, Exp: 15m)         │
             │    Payload: { staffId, role, allowedClientIds: [...] }  │
             │────────────────────────────────────────────────────────►│
             │                                                         │ 3. GSThub verifies signature
             │                                                         │ 4. Extracts allowedClientIds
             │                                                         │ 5. Middleware queries DB:
             │                                                         │    WHERE clientId IN (allowedClientIds)
```

### 3.2 Role-Based Access Control (RBAC) Matrix

| User Role | Client Dropdown in GSThub | Practice Matrix Visibility | Bulk Operations & Reco |
|---|---|---|---|
| **Managing Partner / Admin** | All 50+ Firm Clients | Full practice view (50+ clients) + "Filter by Staff" | Full access across all clients |
| **Article Assistant / Staff** | **Assigned Clients Only** (e.g. 10 clients) | **Assigned Clients Only** (their 10 clients) | Restricted to assigned clients |

---

## 4. Desktop Companion Specification (`localhost:9090`)

### 4.1 Packaging & Distribution
* **Format**: Self-contained ZIP (`ModusDesk_Companion_Setup.zip`) downloadable from ModusDesk UI.
* **Execution**: Double-click `start-companion.bat`. Runs silently in the background on port `9090`.
* **Zero Heavy Dependencies**: Uses the pre-installed system **Microsoft Edge** or **Google Chrome** via Playwright (`channel: 'msedge'`), keeping the download size tiny (<15 MB).

### 4.2 Security Boundary
* The companion binds exclusively to loopback interface `127.0.0.1:9090`.
* Rejects any external or cross-network requests.

---

## 5. Detailed Sub-Module Specifications

---

### Module 1 (`GST-LOGIN`): 1-Click Automated GST Login

#### 1.1 Objective
Open a real, visible browser window for the selected client with Username and Password pre-filled, placing cursor focus directly on the CAPTCHA box for instant user takeover.

#### 1.2 Step-by-Step Flow
1. Staff clicks **"⚡ GST Login"** on client's page in ModusDesk or GSThub.
2. If the client has multiple GSTINs (e.g. Maharashtra & Gujarat), a modal prompts: *"Select GSTIN to Login"*.
3. ModusDesk retrieves decrypted credentials and sends `POST http://localhost:9090/api/login`.
4. Desktop Companion launches a visible, maximized Edge/Chrome window.
5. Navigates to `https://services.gst.gov.in/services/login`.
6. Auto-fills `#username` and `#user_pass` in under 300ms.
7. Places keyboard focus on `#captcha`.
8. Staff types the 6-character CAPTCHA and presses Enter.
9. Staff uses the live session for notice inspection, manual filings, or general portal work.

---

### Module 2 (`GST-DOWNLOAD`): Bulk Return & Statement Downloader

#### 2.1 Objective
Mass-download returns and statements across multiple clients and multiple financial periods with queued CAPTCHA solving.

#### 2.2 Selectable Return Packages
Staff selects any combination of:
* **GSTR-1**: Filed Return Summary JSON & Form PDF.
* **GSTR-3B**: Filed Return Form PDF.
* **GSTR-2B**: Monthly ITC Statement (**JSON** for reconciliation + **Excel** for manual review).
* **Filing Acknowledgements**: Signed ARN receipts.
* **Annual Returns**: GSTR-9 / GSTR-9C Tables.

#### 2.3 Batch Execution & Auto-Resume
* Staff selects target clients and periods (e.g. `April 2026 to July 2026`).
* Companion processes clients sequentially. Prompts staff with an on-screen CAPTCHA popup once per client.
* **Auto-Resume Resiliency**: If a session expires on client #14, the queue pauses, prompts a new CAPTCHA for client #14, and resumes seamlessly without restarting the batch.

---

### Module 3 (`GST-MATRIX`): Live Practice-Wide Filing Status Matrix

#### 3.1 Objective
A single, real-time practice compliance grid tracking GSTR-1 and GSTR-3B filing statuses across all months for all clients.

#### 3.2 Matrix Grid Layout

| Client Name | GSTIN | Period | GSTR-1 Status | GSTR-1 Date / ARN | GSTR-3B Status | GSTR-3B Date / ARN | GSTR-2B Status | Actions |
|---|---|---|---|---|---|---|---|---|
| **Acme Corp Ltd.** | `27ABCDE1234F1Z5` | Jul 2026 | 🟢 FILED | 11/08/2026 (AA27...) | 🟢 FILED | 18/08/2026 (AB27...) | ✅ Generated | [ 👁 Preview ] |
| **TechFlow Solutions** | `29TECHF9876H1Z9` | Jul 2026 | 🟢 FILED | 10/08/2026 (AA29...) | 🔴 PENDING | — (Due in 2 days) | ✅ Generated | [ 🔄 Sync ] |
| **Singhania Freight** | `27SINGH1122K1Z1` | Jul 2026 | 🔴 PENDING | — (Overdue) | 🔴 PENDING | — (Due in 2 days) | ⚠️ Generated | [ 🔄 Sync ] |

#### 3.3 Smart Delta Sync Lifecycle
1. **Permanent Storage**: Once a return is marked `FILED` with an ARN, it is permanently stored in GSThub's Supabase DB and is **never queried from the portal again**.
2. **Delta Sync**: Clicking **[ 🔄 Sync July 2026 ]** queries the portal ONLY for `PENDING` / `OVERDUE` clients, completing syncs in 15–30 seconds.
3. **Single-Row Instant Sync**: Refresh an individual client with one click after filing their return.
4. **QRMP Scheme Support**: Automatically adapts columns for quarterly filers (M1/M2: IFF + PMT-06, M3: GSTR-1 + 3B).

---

### Module 4 (`GST-RECO-2B`): GSTR-2B vs Tally Purchase Reco Engine

#### 4.1 Objective
Match GSTR-2B portal statements against Tally purchase registers uploaded via Excel/CSV, categorizing invoices into 5 actionable buckets.

#### 4.2 Ingestion
* **GSTR-2B Source**: Upload portal JSON / Excel or fetch directly via Desktop Companion.
* **Books Source**: Drag-and-drop Tally Purchase Register Excel export.

#### 4.3 The 5 Classification Buckets
1. ✅ **Exact Match**: GSTIN, Invoice Number, and Tax Amounts match 100% (Eligible ITC).
2. ⚠️ **Value / Tax Mismatch**: Invoice found, but Taxable Value or Tax Heads differ (e.g. rate mismatch, round-off).
3. ❌ **Missing in GSTR-2B**: Entered in Tally, but missing in 2B (Supplier hasn't uploaded invoice).
4. 🔍 **Missing in Books (Tally)**: Available in 2B, but forgotten in Tally purchase accounting.
5. 🚫 **Ineligible / Flagged ITC**: Section 16(4) time-barred cut-off exceeded or Place of Supply (POS) mismatch.

#### 4.4 Vendor Defaulter Communication
* Generate 1-click **WhatsApp / Email Vendor Follow-up Letters** listing missing invoices, dates, and uncredited tax amounts to send directly to non-compliant suppliers.

---

### Module 5 (`GST-LEDGER`): Cash & Credit Ledger Health Dashboard

#### 5.1 Objective
Multi-client financial snapshot of tax ledgers prior to monthly GSTR-3B tax payment.

#### 5.2 Captured Ledgers
* **Electronic Credit Ledger**: Available balance in `IGST`, `CGST`, `SGST`, `Cess`.
* **Electronic Cash Ledger**: Available cash balance in Major (`Tax`, `Interest`, `Penalty`, `Fees`, `Others`) and Minor heads.
* **Liability Ledger**: Outstanding interest, late fees, or RCM dues.
* **Liability Offset Calculator**: Pre-computes whether available ITC covers output tax or if a PMT-06 challan is required.

---

### Module 6 (`GST-TDS`): TDS & TCS on GST Reconciliation

#### 6.1 Objective
Track and verify deductions under Section 51 (TDS by Govt/PSUs) and Section 52 (TCS by E-Commerce Operators).
* Auto-fetches GSTR-7 (TDS) and GSTR-8 (TCS) credit records available on portal.
* Reconciles deductor GSTIN and gross contract value against sales records.
* Confirms auto-credited funds in Electronic Cash Ledger.

---

### Module 7 (`GST-MIS-REPORTS`): Comprehensive CA MIS & Comparison Suite

#### 7.1 Objective
Provide automated cross-return analytical reports essential for CA practice reviews, audit working papers, and tax notices defense.

#### 7.2 Core Reports
1. **GSTR-1 vs GSTR-3B Tax Comparison**:
   - Compares Outward Taxable Value & Tax Liability declared in GSTR-1 against Tax Paid in Table 3.1 of GSTR-3B month-by-month.
   - Highlights liability gaps and unpaid tax liabilities with red alert badges.
2. **GSTR-2B vs GSTR-3B ITC Comparison**:
   - Compares auto-drafted ITC in GSTR-2B against actual ITC claimed in Table 4(A) of GSTR-3B.
   - Protects clients from **Rule 88D** system-generated demand notices for excess ITC claims.
3. **Full Financial Year Return Summary (GSTR-9 Preparation Schedule)**:
   - Aggregates all 12 months of GSTR-1 and GSTR-3B into a single unified yearly schedule (Turnover, Tax Heads, RCM, ITC Claimed) for instant annual return preparation.
4. **Challan & PMT-06 Cash Register**:
   - Consolidated register of all tax paid in cash across periods with CIN, BRN, payment mode, and date.

---

## 6. User Interface & Navigation Specification

### 6.1 ModusDesk Floating Quick Action Menu
On every Client Detail Page (`/clients/[id]`), a floating context menu rests in the bottom-right corner:
* **⚡ Quick Login**: Launches headed browser session with credentials filled.
* **📥 Download Returns**: Opens GSThub pre-filtered to this client in the Returns Downloader module.
* **📊 2B Reco**: Opens GSThub pre-filtered to this client in the 2B Reconciliation Studio.
* **🚀 Open in GSThub**: Launches GSThub with all client modules active.

### 6.2 ModusDesk Main Sidebar
* A dedicated **"GST Hub"** link in the main navigation sidebar opens GSThub in **Practice Overview Mode** (Practice Matrix, MIS Reports, Batch Queue).

### 6.3 GSThub Standalone UI Layout
* **Top Navigation**:
  - 🌐 **Practice Matrix**
  - 📊 **MIS & Comparison Reports**
  - 📥 **Batch Downloader**
  - 🏢 **Client Workspace** (with client search dropdown)
* **Header Status Bar**:
  - Active User Profile (`Rohan Sharma - Staff` / `Pooja - Partner`)
  - Desktop Companion Connection Indicator (🟢 *Companion Connected: localhost:9090* / 🔴 *Companion Offline*).

---

## 7. Database Schema Specification (Dedicated GSThub Supabase)

```prisma
// GSThub Dedicated Supabase Schema

model GSTFilingStatus {
  id              String   @id @default(cuid())
  clientId        String   // References ModusDesk clientId
  clientName      String
  gstin           String
  period          String   // e.g. "2026-07"
  isQrmp          Boolean  @default(false)
  gstr1Status     String   // "FILED" | "PENDING" | "OVERDUE"
  gstr1Arn        String?
  gstr1Date       DateTime?
  gstr3bStatus    String   // "FILED" | "PENDING" | "OVERDUE"
  gstr3bArn       String?
  gstr3bDate      DateTime?
  gstr2bGenerated Boolean  @default(false)
  lastSyncedAt    DateTime @default(now())

  @@unique([clientId, gstin, period])
  @@index([clientId])
  @@index([period])
}

model ITCReconciliationRun {
  id               String   @id @default(cuid())
  clientId         String
  gstin            String
  period           String   // e.g. "2026-07"
  fy               String   // e.g. "2026-2027"
  exactMatchCount  Int      @default(0)
  mismatchCount    Int      @default(0)
  missingIn2bCount Int      @default(0)
  missingInBooksCount Int   @default(0)
  ineligibleCount  Int      @default(0)
  totalClaimableItc Decimal @default(0)
  summaryJson      Json     // Detailed summary statistics
  itemsJson        Json     // Compressed line-item reconciliation results
  runAt            DateTime @default(now())
  runByStaffId     String

  @@index([clientId, period])
}

model GSTLedgerSnapshot {
  id              String   @id @default(cuid())
  clientId        String
  gstin           String
  igstCredit      Decimal  @default(0)
  cgstCredit      Decimal  @default(0)
  sgstCredit      Decimal  @default(0)
  cessCredit      Decimal  @default(0)
  cashBalance     Decimal  @default(0)
  liabilityBalance Decimal @default(0)
  snapshotJson    Json     // Detailed major/minor head breakdowns
  snapshotDate    DateTime @default(now())

  @@index([clientId, gstin])
}

model MISComparisonCache {
  id              String   @id @default(cuid())
  clientId        String
  gstin           String
  fy              String   // e.g. "2026-2027"
  reportType      String   // "GSTR1_VS_3B" | "GSTR2B_VS_3B" | "ANNUAL_SUMMARY"
  reportDataJson  Json
  generatedAt     DateTime @default(now())

  @@unique([clientId, gstin, fy, reportType])
}
```

---

## 8. API Contracts

### 8.1 Desktop Companion Loopback API (`http://localhost:9090`)

#### `POST /api/login`
```typescript
// Request
{
  "portalUrl": "https://services.gst.gov.in/services/login",
  "username": "27ABCDE1234F1Z5",
  "password": "DecryptedPassword123"
}
// Response
{ "success": true, "message": "Browser launched on monitor. Cursor focused on CAPTCHA." }
```

#### `POST /api/download-returns`
```typescript
// Request
{
  "username": "27ABCDE1234F1Z5",
  "password": "DecryptedPassword123",
  "periods": ["2026-06", "2026-07"],
  "returnTypes": ["GSTR1", "GSTR3B", "GSTR2B_JSON"]
}
// Response
{ "success": true, "data": { /* Parsed returns payload for in-browser preview */ } }
```

---

## 9. Error Handling & Resiliency

| Scenario | System Behavior |
|---|---|
| **Desktop Companion Offline** | Web UI shows amber alert: *"Desktop Companion offline on localhost:9090. Download setup or launch start-companion.bat."* |
| **GST Portal Downtime (502 / 504)** | Retries twice with exponential backoff; displays clear badge: ⚠️ *Portal Temporarily Unavailable*. |
| **Session Expired in Batch** | Pauses batch queue, displays clean CAPTCHA modal for current client, resumes immediately upon submission. |
| **Wrong Password on Portal** | Visible browser window displays portal error message directly to the staff member. |

---

## 10. Phased Delivery Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DELIVERY MILESTONES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ Milestone 1: Core Foundation & Automated Login (F1 + Companion Setup)       │
│   ▼                                                                         │
│ Milestone 2: Practice Filing Status Matrix (F3) + Smart Delta Sync          │
│   ▼                                                                         │
│ Milestone 3: Bulk Return & Statement Downloader (F2) + Visual Preview       │
│   ▼                                                                         │
│ Milestone 4: GSTR-2B vs Tally Purchase Reco Engine (F4) + Vendor Defaulters │
│   ▼                                                                         │
│ Milestone 5: Ledger Dashboard (F5), TDS Reco (F6) & CA MIS Suite (F7)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Review & Sign-Off

This document serves as the complete, unambiguous Master Specification for **`ModusDesk_GSThub`**.
Upon your review and sign-off, we will proceed directly with **Milestone 1: Desktop Companion & Automated Login Engine (`GST-LOGIN`)**!
