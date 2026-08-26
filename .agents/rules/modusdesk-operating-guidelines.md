# ModusDesk — Agent Operating Guidelines & Mandatory Release SOP

> **CRITICAL DIRECTIVE FOR ALL AI AGENTS & DEVELOPERS**:
> This project manages real accounting and tax records for Gupta Aayush & Co. (Chartered Accountants). All AI agents operating on this codebase MUST strictly adhere to the rules and release gates defined below for EVERY task, regardless of size.

---

## 1. Master System Specification
- The single source of truth for features and architecture is `ModusDesk-v2-Specification.md`.
- Historical v1 documents are archived in `docs/archive/` for reference only.
- Client hierarchy rules: `ClientGroup` → `Client` → `ClientRegistration`. Letter suffixes (A, B, C...) on client codes are NEVER reused.

---

## 2. Mandatory 6-Gate Release & Deployment SOP
Reference: `docs/RELEASE_AND_DEPLOYMENT_SOP.md`

Under NO circumstances shall any code, script, or migration be deployed or merged into `main` without passing all sequential gates:

### Gate 0: Local Compilation & Typecheck
- Run: `npm run build` (or `npm run test:preflight`)
- 0 TypeScript errors, 0 Next.js compilation errors, 0 Prisma generation warnings.

### Gate 1: Isolated Sandbox Staging
- All schema alterations and testing MUST be executed against Staging Supabase first.
- Production database connection strings are STRICTLY FORBIDDEN during development iterations.

### Gate 2: Automated Regression & Security Test Suites
- Run: `npm run test:security` and `npm run test:e2e`
- Pass Criteria: 100% Pass Rate (0 failures allowed). Tests verify RBAC, BOLA prevention, fee confidentiality, and AES-256-GCM encryption.

### Gate 3: Visual & UI Verification
- Verify modified UI components using Playwright / browser validation.

### Gate 4: MANDATORY USER REVIEW & EXPLICIT APPROVAL (🛑 HARD STOP)
- The agent MUST STOP and present:
  1. Summary of changes made.
  2. Test execution evidence.
  3. Migration SQL diff (if database changes exist).
- NO production deployment shall proceed until the User explicitly confirms approval.

### Gate 5: Production Database Migration
- Non-destructive, additive migrations only with live backup snapshot verification.

### Gate 6: Production Push & Smoke Test
- Deploy to `main` and execute live smoke tests on `https://app-steel-mu-76.vercel.app`.

---

## 3. Cryptographic Security & Zero-Leak Rules
- `FIELD_ENCRYPTION_KEY` (AES-256-GCM) is required. Never log or leak decrypted PANs, phone numbers, or passwords.
- No plaintext keys or secrets shall ever be committed to Git.
- Never modify or bypass permission checks in `app/src/lib/permissions.ts`.

---

## 4. Mandatory Semantic Versioning & Git Tagging Protocol
All AI agents MUST follow strict Semantic Versioning (`MAJOR.MINOR.PATCH`) for every release without exception:

### 4.1 Version Numbering Rules
- **Baseline**: `v1.0.0` is the locked production baseline.
- **PATCH Release (`v1.0.x`)**: Bug fixes, minor UI/CSS tweaks, typo corrections (zero new features, zero database changes).
- **MINOR Release (`v1.x.0`)**: New features, new reports, additive database changes, new automation endpoints (backward-compatible).
- **MAJOR Release (`vx.0.0`)**: Breaking architectural redesigns or system rewrites.

### 4.2 Branching & Tagging Protocol
- **`main` Branch**: Production code ONLY. Never push experimental or untested code directly to `main`.
- **Development**: Always build on `feature/<name>` or `staging` branches and test against Staging Supabase DB (`hywqjahgrnmfhpuqtckk`).
- **Release Tagging**: Every production merge into `main` (after Gate 4 user approval) MUST create an annotated Git tag (e.g. `git tag -a "v1.1.0" -m "..."`) and push tags to both GitHub repositories:
  1. `https://github.com/caaayushai1/modusdesk.git` (Vercel deployment repo)
  2. `https://github.com/caaayushai1/modusdesk-practice-management.git` (Monorepo)

### 4.3 Database Schema Migration Safety (Zero Data Loss)
- Non-destructive additive changes only (new tables or nullable/default columns).
- Dropping columns containing live accounting/tax client data is STRICTLY PROHIBITED.
