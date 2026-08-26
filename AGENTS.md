# ModusDesk_GSThub — Agent Operating Guidelines

> **DIRECTIVE FOR ALL AI AGENTS & DEVELOPERS**:
> ModusDesk_GSThub is a stateless utility application for GST portal automation.
> It is consumed by ModusDesk Core (Gupta Aayush & Co., Chartered Accountants).
> All agents MUST read `CONTEXT.md` before any work.

---

## 1. Context File Protocol (MANDATORY)

1. **Before ANY work**: Read `CONTEXT.md` in its entirety.
2. **After ANY decision or design change**: Update `CONTEXT.md` and log the change in the Changelog (§11).
3. **CONTEXT.md is the single source of truth** for all architecture, features, and integration decisions.
4. Cross-reference with ModusDesk Core's `AGENTS.md` at `c:\Users\gaayu\OneDrive\Desktop\Demo1\GACO Practice Management\AGENTS.md` when making changes that touch ModusDesk.

---

## 2. Development & Release Protocol

### Pre-v1.0.0 (Current Phase: Design & Development)
During active development before v1.0.0 is finalized:
- **No formal release gates required** — focus on rapid iteration.
- **Developer confirmation** before any deployment: AI agent must present a summary of changes and get explicit user approval before pushing to production.
- **Semantic versioning not enforced** until v1.0.0 is finalized.
- **Feature branches recommended** but not mandatory during early development.

### Post-v1.0.0 (After First Stable Release)
Once v1.0.0 is released:
- **Semantic Versioning** (`MAJOR.MINOR.PATCH`) becomes mandatory.
- **Developer confirmation gate** remains: Agent must present changes and get user approval before production push.
- **Git tagging** required for every production release.

---

## 3. ModusDesk Core Changes Protocol

> [!IMPORTANT]
> GSThub features will frequently require schema/API changes in ModusDesk Core.
> These changes ALWAYS follow ModusDesk's full **6-Gate Release SOP**.

When a GSThub feature needs a ModusDesk change:
1. Document the required ModusDesk change in the feature's Sub-PRD.
2. Switch context to ModusDesk workspace.
3. Implement the ModusDesk change following its 6-Gate SOP (staging → tests → user approval → production).
4. Return to GSThub workspace and implement the utility code.

**ModusDesk Core workspace**: `c:\Users\gaayu\OneDrive\Desktop\Demo1\GACO Practice Management\`
**ModusDesk Core AGENTS.md**: `c:\Users\gaayu\OneDrive\Desktop\Demo1\GACO Practice Management\AGENTS.md`

---

## 4. Security Rules

1. **Zero Credential Storage**: GSThub NEVER persists credentials. They are received transiently from ModusDesk and held only in memory during the active automation session.
2. **No Logging of Secrets**: Never log, console.log, or write decrypted passwords, usernames, or PINs to any file, database, or error tracker.
3. **No Plaintext Keys in Git**: API keys, tokens, or secrets must NEVER be committed to the repository.
4. **CAPTCHA Images**: CAPTCHA screenshots are transient (displayed to staff, then discarded). Never store or transmit CAPTCHA images beyond the immediate login flow.

---

## 5. Branching & Repository

- **Repository**: Separate from ModusDesk (own GitHub repo, own Vercel project).
- **Main branch**: Production code. No untested or experimental code directly on `main`.
- **Development**: Use `feature/<name>` branches for new features during active development.

---

## 6. Documentation Standards

- Each feature gets its own **Sub-PRD** in `docs/` (e.g., `PRD_F1_Automated_Login.md`).
- Sub-PRDs must cover: User flow, technical design, UI wireframes, ModusDesk changes needed, and testing plan.
- All Sub-PRDs will be merged into a master PRD once all features are designed.
