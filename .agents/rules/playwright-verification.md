# Mandatory Playwright Verification Rule

## Requirement
Every change to UI components, layouts, forms, page routes, or user-facing behavior **MUST** be verified in a real browser session using Playwright tools (`playwright_navigate`, `playwright_screenshot`, `playwright_click`, `playwright_fill`, `playwright_get_visible_text`) before marking work complete.

## Verification Checklist
1. **Navigate & Render**: Navigate to the affected route using `playwright_navigate`.
2. **Interact**: Trigger interactive actions (e.g. clicking buttons, filling forms, submitting data) using `playwright_click` and `playwright_fill`.
3. **Capture Evidence**: Capture a visual screenshot using `playwright_screenshot` and verify DOM state with `playwright_get_visible_text`.
4. **Zero Errors**: Confirm no layout clipping, unexpected redirects, or console errors exist.

---

## Mandatory Interactive Portal Discovery Protocol (GST, Income Tax, TRACES, MCA)
Every time we design, build, or modify any workflow involving interaction with external government portals (GST Portal, IT Portal, TRACES, MCA, EPFO/ESIC):

1. **Interactive Headed Discovery First**:
   - Before writing or finalizing selector logic, an interactive live session with Playwright MUST be executed in headed mode.
   - The user/developer logs in directly on screen (manual ID, password, CAPTCHA, and 2FA/OTP).
   - The AI inspects the live DOM (`playwright_evaluate`, `playwright_get_visible_html`) to extract the exact real-world element tags, names, models, dynamic event bindings (e.g. `data-ng-click`, `data-ng-model`), and unexpected modal overlays/announcements.

2. **Zero-Disk In-Memory Processing**:
   - For any portal export (GSTR-4A, GSTR-2B, ledger Excel/JSON), downloads MUST be intercepted as memory streams/buffers.
   - Files MUST NEVER be left scattered in the user's `Downloads` folder. Any temporary artifact directory must be purged immediately upon parsing completion.

3. **No-Assumption Fail-Safes**:
   - Do NOT rely on pre-existing database flags for scheme or taxpayer type (e.g. Regular vs. Composition).
   - The automation MUST inspect the live portal Returns Dashboard layout upon landing. If the wrong scheme is detected (e.g., GSTR-1/3B instead of CMP-08), it must abort cleanly and notify the user with a specific, helpful message without throwing unhandled exceptions.

4. **Multi-Layer Interruption Dismissal**:
   - All known portal advisory/statutory popups (`Aadhaar Authentication`, `Geocoding Address`, `Advisories`, `Session Reminders`) must have pre-registered dismissal handlers.
   - An unknown blocking popup must bring the browser window to the foreground (`AppActivate`) and alert the user rather than looping or hanging silently.

5. **Strict Pre-Submission Human Verification**:
   - Automations that prepare or upload returns (CMP-08, GSTR-4, etc.) must STOP strictly at the SAVE / Draft state.
   - Final statutory submission (EVC / DSC / Proceed to File) must ALWAYS remain a manual human action.
