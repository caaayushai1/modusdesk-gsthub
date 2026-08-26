# Mandatory Playwright Verification Rule

## Requirement
Every change to UI components, layouts, forms, page routes, or user-facing behavior **MUST** be verified in a real browser session using Playwright tools (`playwright_navigate`, `playwright_screenshot`, `playwright_click`, `playwright_fill`, `playwright_get_visible_text`) before marking work complete.

## Verification Checklist
1. **Navigate & Render**: Navigate to the affected route using `playwright_navigate`.
2. **Interact**: Trigger interactive actions (e.g. clicking buttons, filling forms, submitting data) using `playwright_click` and `playwright_fill`.
3. **Capture Evidence**: Capture a visual screenshot using `playwright_screenshot` and verify DOM state with `playwright_get_visible_text`.
4. **Zero Errors**: Confirm no layout clipping, unexpected redirects, or console errors exist.
