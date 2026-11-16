/**
 * GST Portal Selector Registry — Composition Taxpayer Module
 *
 * Version: 2024-11-LIVE-VERIFIED
 * Verified on live GST Portal against real Composition Taxpayer accounts.
 *
 * Rules:
 *  - Prefer exact live attributes discovered via Playwright discovery.
 *  - Stable element names/attributes (name="fin", name="quarter", name="qurtrbegin")
 *  - Strict zero-disk processing for file exports.
 *  - Zero auto-file policy for return uploads (stops strictly at SAVE / preview).
 */

export const PORTAL_VERSION = '2024-11-LIVE-VERIFIED';

// ── URLs & Endpoints ───────────────────────────────────────────────────────
export const URLS = {
  LOGIN:              'https://services.gst.gov.in/services/login',
  WELCOME_PAGE:       'https://services.gst.gov.in/services/auth/fowelcome',
  TAXPAYER_DASHBOARD: 'https://services.gst.gov.in/services/auth/quicklinks',
  RETURNS_DASHBOARD:  'https://return.gst.gov.in/returns/auth/dashboard',
  OFFLINE_DOWNLOAD:   'https://return.gst.gov.in/returns/auth/gstr/offlinedownload',
} as const;

// ── URL Pattern Matchers (for detectState) ─────────────────────────────────
export const URL_PATTERNS = {
  LOGIN:              /services\.gst\.gov\.in\/services\/login/,
  OTP_PAGE:           /otp[-_]?verif|\/otp\b/i,
  ERROR_NOT_FOUND:    /error\/notfound|\/notfound/i,
  WELCOME_PAGE:       /services\.gst\.gov\.in\/services\/auth\/fowelcome/,
  TAXPAYER_DASHBOARD: /services\.gst\.gov\.in\/services\/auth/,
  RETURNS_DASHBOARD:  /return\.gst\.gov\.in\/returns\/auth\/dashboard/,
  OFFLINE_DOWNLOAD:   /return\.gst\.gov\.in\/returns\/auth\/gstr\/offlinedownload/,
  CMP08_ONLINE:       /return\.gst\.gov\.in.*cmp08/i,
  GSTR4_ANNUAL:       /return\.gst\.gov\.in.*gstr4/i,
} as const;

// ── Login Page (services.gst.gov.in/services/login) ────────────────────────
export const LOGIN = {
  username:  '#username',
  password:  '#user_pass',
  captcha:   '#captcha',
  submitBtn: 'button[type="submit"]',
} as const;

// ── Interruption / Overlay Dismissal ──────────────────────────────────────
export const INTERRUPTIONS = {
  /** Known close buttons on advisory, e-KYC, and welcome modals */
  closeButtons: [
    'a:has-text("REMIND ME LATER")',
    'button:has-text("REMIND ME LATER")',
    'button:has-text("Close")',
    'button:has-text("CLOSE")',
    'button:has-text("OK")',
    'button:has-text("Ok")',
    'button.close',
    '[class*="modal"] .btn-close',
    'button[aria-label="Close"]',
  ],

  /** Spinners / loaders to wait out */
  spinners: [
    '.ngx-spinner',
    '[class*="spinner"]',
    '[class*="loader"]',
    '.loading-overlay',
    '.fa-spin',
  ],
} as const;

// ── Front Office Welcome Page (fowelcome) ──────────────────────────────────
export const WELCOME_PAGE = {
  /** The direct button on fowelcome leading to the Returns Dashboard */
  returnDashboardBtn: 'button:has-text("RETURN DASHBOARD")',
  continueToDashboardBtn: 'button:has-text("CONTINUE TO DASHBOARD")',
} as const;

// ── Returns Dashboard (return.gst.gov.in/returns/auth/dashboard) ───────────
export const RETURNS_DASHBOARD = {
  /** Live verified dropdown names on GST Portal */
  fySelect:      'select[name="fin"]',
  quarterSelect: 'select[name="quarter"]',
  monthSelect:   'select[name="mon"]',
  searchBtn:     'button[type="submit"]:has-text("SEARCH")',

  /** Scheme indicators for fail-safe validation */
  compositionIndicators: [
    'GST CMP-08',
    'CMP08',
    'GSTR-4A',
    'GSTR4A',
    'opting composition levy',
  ],
  regularIndicators: [
    'GSTR-1',
    'GSTR1',
    'GSTR-2B',
    'GSTR-3B',
    'GSTR3B',
    'Monthly Return',
  ],

  /** Form GST CMP-08 Tile */
  cmp08PrepareOnlineBtn: 'button:has-text("PREPARE ONLINE")',

  /** Form GSTR-4A Tile */
  gstr4aViewBtn:     'button:has-text("VIEW")',
  gstr4aDownloadBtn: 'button:has-text("DOWNLOAD")',
} as const;

// ── GSTR-4A Offline Download Page (offlinedownload) ───────────────────────
export const GSTR4A_DOWNLOAD_PAGE = {
  fromQuarterSelect: 'select[name="qurtrbegin"]',
  toQuarterSelect:   'select[name="qurtrend"]',
  generateExcelBtn:  'button:has-text("Generate Excel File to Download")',

  quarterOptions: {
    Q1: 'Apr-Jun',
    Q2: 'Jul-Sep',
    Q3: 'Oct-Dec',
    Q4: 'Jan-Mar',
  } as Record<string, string>,
} as const;

// ── CMP-08 Return Population ───────────────────────────────────────────────
export const CMP08_FORM = {
  /** Row 3(a): Outward taxable supplies (turnover) */
  outwardSuppliesInput: 'input[name*="outward"], input[name*="txval"], input[id*="outward"]',
  /** Row 3(b): Inward supplies attracting reverse charge */
  rcmSuppliesInput:     'input[name*="rcm"], input[id*="rcm"]',
  saveBtn:              'button:has-text("SAVE")',

  /** STRICT BAN: "PROCEED TO FILE" is not automated */
} as const;

// ── GSTR-4 Annual Return ───────────────────────────────────────────────────
export const GSTR4_ANNUAL = {
  annualReturnNavLink: 'a:has-text("Annual Return")',
  gstr4Tile:           'div:has-text("GSTR-4")',
  prepareOnlineBtn:    'button:has-text("PREPARE ONLINE")',
  prepareOfflineBtn:   'button:has-text("PREPARE OFFLINE")',
  uploadJsonInput:     'input[type="file"]',
} as const;

// ── Masking CSS (Zero Credential Leakage in Screenshots) ───────────────────
export const MASK_CSS = `
  input[type="password"],
  #captcha,
  #user_pass,
  input[name="user_pass"],
  input[id*="pass"],
  input[placeholder*="assword"],
  #otp {
    color: transparent !important;
    text-shadow: 0 0 8px rgba(0, 0, 0, 0.7) !important;
    -webkit-text-security: disc !important;
  }
` as const;
