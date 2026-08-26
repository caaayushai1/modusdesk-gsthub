# ModusDesk_GSThub — Immutable Agent Operating Guidelines & Development Rules

> ⚖️ **SUPREME OPERATIONAL DIRECTIVE FOR ALL AI AGENTS & DEVELOPERS**:
> ModusDesk_GSThub is a standalone statutory automation utility that integrates with ModusDesk Core.
> All AI agents working on this codebase MUST strictly adhere to the rules below without exception.

---

## 1. The 5 Immutable Development Laws

### Law 1: Strict ModusDesk Change Protocol (Zero Unapproved Edits)
Under NO circumstances shall any file inside the ModusDesk codebase (`c:\Users\gaayu\OneDrive\Desktop\Demo1\GACO Practice Management\`) be modified without explicit, prior user approval.
* Before proposing any change to ModusDesk, the agent MUST present a **Formal ModusDesk Change Package**:
  1. **Exact Files & Lines to Change**.
  2. **Detailed Process & Rationale**.
  3. **Release Gates to Follow** (ModusDesk's mandatory 6-Gate Release SOP).
  4. **Versioning Impact** (Current version: `v1.1.0` → Proposed version: `v1.2.0`).
  5. **Integration Points & Security Review**.
* **Zero code edits** shall occur in ModusDesk until the user explicitly responds with approval.

### Law 2: Milestone Progress Reports & Prior Approvals
* The agent MUST provide a structured **Progress Report** after every major milestone or significant component build.
* Prior explicit user approval is required before moving from one milestone to the next.

### Law 3: Zero Disruption to ModusDesk & Context Bridge Protocol
* GSThub must NEVER disrupt, break, or alter existing ModusDesk features, databases, or workflows.
* **Context Bridge Rule**: If a GSThub agent ever requires additional context, APIs, or schema models from ModusDesk, the agent MUST NOT guess or hallucinate. Instead, it must generate a **Ready-to-Paste Prompt** for the user to run in the ModusDesk agent to produce the exact verified contract or bridge.

### Law 4: Zero Assumptions & Zero Hallucinations Policy
* Speculation and unverified assumptions are strictly prohibited.
* If any detail regarding GST portal behavior, Tally data formats, or business logic is ambiguous, the agent MUST ask for confirmation before executing.
* All mathematical calculations and data processing logic MUST be validated via automated tests (TDD).

### Law 5: Strict Security, Anti-Tamper & Zero-Leak Standards
* **Zero Client-Side Trust**: Role and client permissions MUST NEVER be trusted from client-side state or browser DOM.
  - Inspecting DevTools / editing frontend JavaScript from `STAFF` to `ADMIN` MUST be 100% blocked and rejected by the server.
  - All authorization is enforced **server-side** via cryptographically signed JWTs (`HS256`).
* **Zero Hardcoded Secrets**: No plaintext passwords, API keys, encryption keys, or service role secrets shall ever exist in source code or Git.
* **Zero-Leak In-Memory Credential Lifecycle**: Decrypted credentials exist in volatile memory only for the exact duration of the automation trigger (<2 seconds) and are immediately dereferenced.

---

## 2. ModusDesk Cross-Change Protocol (6-Gate Compliance)

When a GSThub feature requires an integration point in ModusDesk (e.g. adding the Floating Quick Action Menu or issuing JWTs):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 MODUSDESK CORE CHANGE APPROVAL PROCESS                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Formulate exact change & present to User with SemVer impact              │
│ 2. Wait for User Explicit Approval                                          │
│ 3. Switch context to ModusDesk workspace                                    │
│ 4. Execute Gate 0 (Build & Typecheck: 0 errors)                             │
│ 5. Execute Gate 1 (Staging DB Sandbox verification)                         │
│ 6. Execute Gate 2 (100% Security & E2E Test Suite pass)                     │
│ 7. Execute Gate 4 (🛑 Hard Stop User Approval)                              │
│ 8. Execute Gate 5 (Non-destructive Production Migration)                    │
│ 9. Execute Gate 6 (Dual Git tag push & Live Smoke Test)                     │
│ 10. Return to GSThub workspace                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Server-Side Security & Anti-Tamper Architecture

```
[ Browser Client (User) ]
       │
       │ Tampered Request: "I am ADMIN, show me all clients"
       ▼
[ GSThub Next.js API Middleware (Server) ]
       │
       ├─► 1. Extract Bearer JWT from HttpOnly Cookie / Header
       ├─► 2. Verify Cryptographic Signature with GSTHUB_JWT_SECRET
       │      ❌ Signature Invalid / Tampered -> 401 UNAUTHORIZED (Immediate Termination)
       │
       ├─► 3. Extract Verified Claims: { staffId: "001", role: "STAFF", allowedClientIds: [...] }
       │      (Ignores any client-supplied role parameters completely)
       │
       └─► 4. Database Query:
              WHERE clientId IN (verifiedClaims.allowedClientIds)
```

---

## 4. Context Maintenance & Changelog Protocol

1. **`CONTEXT.md` is the single source of truth**.
2. Any architectural change, feature addition, or decision MUST be updated in `CONTEXT.md` immediately with a timestamped entry in the Changelog.
3. Every agent session begins by reading `CONTEXT.md`.
