# ModusDesk_GSThub — Master Product Requirements Document (PRD)

> **Document Status**: Draft — Ready for User Review  
> **Product Name**: `ModusDesk_GSThub`  
> **Target Users**: Chartered Accountants, Article Assistants, and Tax Staff at Gupta Aayush & Co.  
> **Version**: 1.0.0-draft  

---

## 1. Executive Summary & Problem Space

During the monthly statutory compliance window (1st to 20th of every month), Chartered Accountancy firms face massive operational friction:
1. **Login Friction**: Staff spends dozens of hours per month manually copying usernames and passwords for 50+ clients across multiple GSTIN registrations.
2. **Bulk Download Bottlenecks**: Downloading filed returns (GSTR-1, GSTR-3B), statements (GSTR-2B JSON/Excel), and filing acknowledgements across multiple tax periods is entirely manual.
3. **Filing Status Blindspots**: Partners lack a single real-time dashboard showing which clients have filed vs which are pending with approaching deadlines.
4. **GSTR-2B vs Tally Reconciliation Nightmare**: Matching Tally purchase registers against portal GSTR-2B statements takes 10–20 hours per client due to formatting differences (slashes, leading zeroes, date offsets), rate mismatches, and time-barred ITC under Section 16(4).
5. **Ledger Visibility**: Calculating pre-3B tax liabilities requires logging into each client's portal separately to check cash and ITC credit ledgers.

**ModusDesk_GSThub** solves these bottlenecks through a **zero-storage, high-automation companion engine** that interfaces directly between the GST Common Portal, local Tally instances, and ModusDesk Core.

---

## 2. Core Architectural Principles

```
┌─────────────────────────────────────────────────────────────┐
│                 ModusDesk Core (Main App)                   │
│  ─────────────────────────────────────────────────────────  │
│  • Master Client Directory & Multi-GSTIN Registrations      │
│  • Encrypted Statutory Credential Vault (AES-256-GCM)       │
│  • Staff RBAC & Session Security                            │
│  • Floating GST Quick Action Menu on Client Pages           │
│  • Permanent Data Storage (Supabase dwvxnnfdjcagsraomooq)   │
└──────────────┬───────────────────────────────▲──────────────┘
               │ (1) Invokes with              │ (4) Persists
               │ transient credentials         │ processed records
               ▼                               │
┌───────────────────────────────┐              │
│   ModusDesk_GSThub Web UI     ├──────────────┤
│  ───────────────────────────  │              │
│  • Practice-Wide Filing Grid  │              │
│  • 2B vs Tally Reco Studio    │              │
│  • Ledger Health Aggregator   │              │
│  • Bulk Downloader Interface  │              │
└──────────────┬────────────────┘              │
               │ (2) Automation                │ (3) Returns portal &
               │ commands                      │ Tally extracted data
               ▼                               │
┌──────────────────────────────────────────────┴──────────────┐
│       GSThub Desktop Companion (Local Machine Worker)       │
│  ─────────────────────────────────────────────────────────  │
│  • Lightweight single installer/ZIP running on staff PC     │
│  • Headed Playwright: launches visible Chrome for login     │
│  • Headless automation for bulk downloads & ledger pulls    │
│  • Connects directly to local Tally Prime (Port 9000)       │
└─────────────────────────────────────────────────────────────┘
```

1. **Stateless Zero-Storage Engine**: GSThub stores **zero** database records and **zero** credentials of its own. All persistent data (reconciliations, filing matrices, ledger snapshots) is written back to ModusDesk's database.
2. **Universal Desktop Companion (`localhost:9090`)**: Distributed as a single setup file / ZIP from ModusDesk. Runs on any staff machine (office or remote) to launch headed browsers and interface with local Tally.
3. **Zero-Leak Security**: Credentials exist decrypted only in volatile memory during the active automation session (<2 seconds). Never written to disk or logs.
4. **ModusDesk Deep Coupling**: Staff triggers single-client workflows directly from ModusDesk's new **Floating Quick Action Menu** or navigates to GSThub for practice-wide batch tasks.

---

## 3. Detailed Module Specifications

---

### Module 1 (F1): 1-Click Automated GST Login (`GST-LOGIN`)

#### 1.1 Objective
Allow staff to launch and log into a client's GST portal in under 3 seconds without ever copying, pasting, or exposing usernames and passwords.

#### 1.2 User Flow & Mechanics
1. **Trigger**: Staff clicks **"⚡ GST Login"** from ModusDesk's Floating Menu or Credentials Vault.
2. **Credential Fetch**: ModusDesk retrieves decrypted credentials from vault and sends a transient payload to Desktop Companion on `http://localhost:9090/api/login`.
3. **Browser Launch**: Desktop Companion launches a visible (headed) Chromium/Edge window maximized on the staff's monitor.
4. **Auto-Fill**: Navigates to `https://services.gst.gov.in/services/login`, fills Username and Password fields within 300ms.
5. **Cursor Focus**: Places cursor focus directly into the 6-character CAPTCHA input box.
6. **Handoff**: Staff types the CAPTCHA and presses Enter. Staff now has a live, interactive portal session to inspect notices, file returns, or perform manual work.

#### 1.3 Multi-GSTIN Support
If a client has multiple GST registrations (e.g., Maharashtra & Gujarat), a quick selector modal prompts the user before launching the selected GSTIN session.

---

### Module 2 (F2): Bulk Return & Statement Downloader (`GST-DOWNLOAD`)

#### 2.1 Objective
Automate the mass downloading of filed returns, tables, and statement files across multiple clients and multiple financial periods in a queued batch.

#### 2.2 Selectable Download Package
Staff can configure exactly which artifacts to download:
* **GSTR-1**: Filed Return PDF & Summary JSON.
* **GSTR-3B**: Filed Return PDF & Auto-Drafted Summary.
* **GSTR-2B**: Monthly ITC Statement (**JSON** for reconciliation + **Excel** for office review).
* **Filing Acknowledgements**: Signed ARN receipts.
* **Annual Returns**: GSTR-9 / GSTR-9C JSON & Tables.

#### 2.3 Batch Execution Flow
1. Staff selects target clients (or "All Active GST Clients") and tax periods (e.g. `April 2026 to July 2026`).
2. Staff clicks **"Start Batch Download"**.
3. Desktop Companion processes clients sequentially:
   - Launches headless session → prompts staff with a clean CAPTCHA popup on screen.
   - Staff types 6-character CAPTCHA once per client.
   - Companion navigates Returns Dashboard, triggers backend downloads, and saves organized files into staff's local `Downloads/ModusDesk_GST/[ClientCode]_[Period]/` directory.
   - Automatically advances to the next client in queue.

---

### Module 3 (F3): Live Practice-Wide Filing Status Matrix (`GST-MATRIX`)

#### 3.1 Objective
Provide partners and engagement leads with a single, real-time matrix of all clients' GST filing compliance across all months of the financial year.

#### 3.2 Matrix Grid Layout

| Client Name | GSTIN | Period | GSTR-1 Status | GSTR-1 Date / ARN | GSTR-3B Status | GSTR-3B Date / ARN | GSTR-2B Available |
|---|---|---|---|---|---|---|---|
| **Acme Corp Ltd.** | `27ABCDE1234F1Z5` | Jul 2026 | 🟢 FILED | 11/08/2026 (AA27...) | 🟢 FILED | 18/08/2026 (AB27...) | ✅ YES |
| **TechFlow Solutions** | `29TECHF9876H1Z9` | Jul 2026 | 🟢 FILED | 10/08/2026 (AA29...) | 🔴 PENDING | — (Due in 2 days) | ✅ YES |
| **Singhania Freight** | `27SINGH1122K1Z1` | Jul 2026 | 🔴 PENDING | — (Overdue) | 🔴 PENDING | — (Due in 2 days) | ⚠️ Generated |

#### 3.3 Capabilities
* **1-Click Sync**: Scrapes the Returns Dashboard for selected clients and updates the matrix in seconds.
* **Filter & Search**: Filter by Assigned Staff, Filing Status (`Filed`, `Pending`, `Overdue`), or State.
* **Export**: Export clean Excel compliance tracking sheets for partner review meetings.
* **Persistence**: Statuses are saved in ModusDesk (`GSTFilingStatus` table) so the matrix is always up-to-date even when offline.

---

### Module 4 (F4): GSTR-2B vs Tally Purchase ITC Reconciliation Engine (`GST-RECO-2B`)

#### 4.1 Objective
Eliminate manual Excel VLOOKUP matching by providing an intelligent, automated reconciliation engine between GSTR-2B and Tally Purchase Registers.

#### 4.2 Data Sources
1. **GSTR-2B**: Downloaded directly via Desktop Companion or uploaded as portal JSON/Excel.
2. **Tally Purchase Data**: Pulled automatically from local Tally Prime over XML port `9000` or uploaded as Tally Excel export.

#### 4.3 Intelligent Matching Algorithm & 5 Classification Buckets

```
                           [ GSTR-2B vs Tally Ingestion ]
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
         [ Normalized Keys ]                             [ Fuzzy Matching ]
   (GSTIN + Clean Invoice No + Date)             (Strip slashes, zero padding, date ±30d)
                 │                                               │
 ┌───────────────┼───────────────────────────────┬───────────────┴───────────────┐
 ▼               ▼                               ▼                               ▼
【 1. Exact Match 】 【 2. Value Mismatch 】      【 3. Missing in 2B 】          【 4. Missing in Tally 】
Value & Tax 100% Taxable / Tax diff             In Tally, not in 2B             In 2B, not in Tally
Eligible for ITC (e.g. rate or round-off)        Supplier default                Forgotten book entry
```

* **Bucket 5: Ineligible & Flagged ITC**:
  - Time-barred under Section 16(4) (invoices uploaded past statutory cut-off).
  - Place of Supply (POS) mismatch.
  - Supplier filing status showing GSTR-1 Not Filed (`GSTR3B_FILING_STATUS = NO`).

#### 4.4 Vendor Defaulter Communication
* Generate automated 1-click **WhatsApp / Email Vendor Follow-up Letters** listing missing invoices, invoice numbers, dates, and uncredited tax amounts to send directly to non-compliant suppliers.
* **Persistence**: Reconciliation runs and audit logs are stored in ModusDesk (`ITCReconciliationRun` and `ITCReconciliationItem`).

---

### Module 5 (F5): Multi-Client Cash & Credit Ledger Health Dashboard (`GST-LEDGER`)

#### 5.1 Objective
Provide a unified financial snapshot of all client tax ledgers prior to monthly GSTR-3B tax calculations.

#### 5.2 Metrics Captured
* **Electronic Credit Ledger**: Available balance in `IGST`, `CGST`, `SGST`, `Cess`.
* **Electronic Cash Ledger**: Available cash balance in Major (`Tax`, `Interest`, `Penalty`, `Fees`, `Others`) and Minor heads.
* **Liability Ledger**: Pending un-offset liabilities or reverse charge (RCM) dues.
* **Liability Offset Calculator**: Simulates whether existing ITC is sufficient to discharge output tax or if client needs to generate a PMT-06 challan.

---

### Module 6 (F6): TDS & TCS on GST Reconciliation (`GST-TDS`)

#### 6.1 Objective
Track and verify deductions made by government departments and e-commerce operators under Section 51 (TDS) and Section 52 (TCS).
* Auto-fetches GSTR-7 (TDS) and GSTR-8 (TCS) credit records available on portal.
* Reconciles deductor GSTIN and gross contract values against sales ledger.
* Confirms auto-credited funds in Electronic Cash Ledger.

---

## 4. User Experience & Navigation

### 4.1 ModusDesk Floating Quick Action Menu
On every Client Detail Page in ModusDesk (`/clients/[id]`), a floating action pill rests in the bottom-right corner:

```
┌───────────────────────────────────────────────────────────┐
│  ModusDesk — Client Profile: Acme Corp Ltd. (001A)       │
│                                                           │
│  [Entity Info]  [Registrations]  [Vault]  [Works]         │
│                                                           │
│                                           ┌─────────────┐ │
│                                           │ ⚡ GST Quick │ │
│                                           │   Actions   │ │
│                                           ├─────────────┤ │
│                                           │ 🔑 Quick    │ │
│                                           │    Login    │ │
│                                           │ 📥 Download │ │
│                                           │    Returns  │ │
│                                           │ 📊 2B Reco  │ │
│                                           │ 🚀 Open in  │ │
│                                           │    GSThub   │ │
│                                           └─────────────┘ │
└───────────────────────────────────────────────────────────┘
```

* Clicking **"🔑 Quick Login"** immediately commands the Desktop Companion to launch the headed browser.
* Clicking **"📥 Download Returns"** or **"📊 2B Reco"** opens GSThub focused on this specific client.
* Clicking **"🚀 Open in GSThub"** launches the full standalone GSThub workspace.

### 4.2 GSThub Standalone Interface
GSThub features two main views:
1. **Client Focus Mode**: Deep dive for an individual client (2B Reco Studio, Ledger Balances, Multi-Period Downloads).
2. **Practice Batch Mode**: Multi-client dashboard for partners and managers (Live Filing Status Matrix, Bulk Download Queue, Ledger Aggregator).

---

## 5. Security, Cryptography & Privacy

1. **Zero Storage of Plaintext Passwords**: ModusDesk decrypts credentials in memory using AES-256-GCM only at the exact moment of an automation trigger.
2. **Volatile In-Memory Transmission**: Credentials transmitted to `http://localhost:9090` exist in memory for <2 seconds and are immediately garbage-collected after typing into form fields.
3. **Local Machine Sandbox**: The Desktop Companion communicates strictly on loopback (`localhost`), preventing external eavesdropping.
4. **Zero Cloud Scraping Risk**: All portal interactions happen from the staff's actual workstation IP, eliminating government cloud-IP blocks and OTP security alarms.

---

## 6. Required ModusDesk Core Schema Additions

To enable persistent data storage without creating a separate database, the following additive models will be introduced into ModusDesk's Prisma schema (governed by ModusDesk's 6-Gate SOP):

```prisma
// 1. Practice Filing Status Matrix
model GSTFilingStatus {
  id              String   @id @default(cuid())
  clientId        String
  registrationId  String?
  period          String   // e.g. "2026-07"
  gstr1Status     String   // "FILED" | "PENDING"
  gstr1Arn        String?
  gstr1FilingDate DateTime?
  gstr3bStatus    String   // "FILED" | "PENDING"
  gstr3bArn       String?
  gstr3bFilingDate DateTime?
  gstr2bGenerated Boolean  @default(false)
  updatedAt       DateTime @updatedAt
  client          Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  registration    ClientRegistration? @relation(fields: [registrationId], references: [id], onDelete: SetNull)

  @@unique([clientId, registrationId, period])
}

// 2. GSTR-2B vs Tally Reconciliation Records
model ITCReconciliationRun {
  id              String   @id @default(cuid())
  clientId        String
  registrationId  String?
  period          String   // e.g. "2026-07"
  exactMatchCount Int      @default(0)
  mismatchCount   Int      @default(0)
  missingIn2bCount Int     @default(0)
  missingInBooksCount Int  @default(0)
  ineligibleCount Int      @default(0)
  totalItcClaimable Decimal @default(0)
  runAt           DateTime @default(now())
  runById         String?
  client          Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  items           ITCReconciliationItem[]
}

model ITCReconciliationItem {
  id              String   @id @default(cuid())
  runId           String
  supplierGstin   String
  supplierName    String?
  invoiceNumber   String
  invoiceDate     DateTime
  taxableValue    Decimal
  igst            Decimal  @default(0)
  cgst            Decimal  @default(0)
  sgst            Decimal  @default(0)
  statusBucket    String   // "EXACT_MATCH" | "VALUE_MISMATCH" | "MISSING_IN_2B" | "MISSING_IN_BOOKS" | "INELIGIBLE"
  remarks         String?
  run             ITCReconciliationRun @relation(fields: [runId], references: [id], onDelete: Cascade)
}

// 3. Electronic Cash & Credit Ledger Snapshots
model GSTLedgerSnapshot {
  id              String   @id @default(cuid())
  clientId        String
  registrationId  String?
  igstCredit      Decimal  @default(0)
  cgstCredit      Decimal  @default(0)
  sgstCredit      Decimal  @default(0)
  cessCredit      Decimal  @default(0)
  cashBalance     Decimal  @default(0)
  liabilityBalance Decimal @default(0)
  snapshotDate    DateTime @default(now())
  client          Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
}
```

---

## 7. Implementation Roadmap & Milestones

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PHASED ROADMAP                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Phase 1: Core Foundation & Automated Login (F1 + Desktop Companion Setup)   │
│   ▼                                                                         │
│ Phase 2: Live Filing Status Matrix (F3) + ModusDesk DB Persistence          │
│   ▼                                                                         │
│ Phase 3: Bulk Return & Statement Downloader (F2)                            │
│   ▼                                                                         │
│ Phase 4: GSTR-2B vs Tally Purchase Reco Engine (F4) + Tally LAN Connector   │
│   ▼                                                                         │
│ Phase 5: Cash/Credit Ledger Dashboard (F5) & TDS Reconciliation (F6)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Review & Next Steps

1. **User Review**: Review this Master PRD for scope alignment, feature priorities, and architecture decisions.
2. **Approval**: Once approved, we will break this down into atomic Sub-PRDs (starting with `Sub-PRD F1: Automated Login & Desktop Companion Engine`) and proceed with implementation!
