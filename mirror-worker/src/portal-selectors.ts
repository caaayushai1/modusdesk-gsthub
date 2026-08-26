/**
 * GST Portal Selector Dictionary
 * Centralized configuration for all GST Common Portal DOM elements.
 * If the portal updates its UI, only this file needs updating.
 */
export const GST_PORTAL = {
  LOGIN_URL: 'https://services.gst.gov.in/services/login',
  DASHBOARD_URL: 'https://return.gst.gov.in/returns/auth/dashboard',

  SELECTORS: {
    // Login Page
    USERNAME_INPUT: '#username',
    PASSWORD_INPUT: '#user_pass',
    CAPTCHA_INPUT: '#captcha',
    LOGIN_BUTTON: 'button[type="submit"]',

    // OTP Verification (triggered on new IP/device)
    OTP_INPUT: '#otp',
    OTP_SUBMIT_BUTTON: '#submit-otp',

    // Returns Dashboard
    RETURN_PERIOD_SELECT: '#ret_period',
    FINANCIAL_YEAR_SELECT: '#fin_year',
    SEARCH_RETURNS_BUTTON: '#lotsearch',
  },

  TIMEOUTS: {
    PAGE_LOAD: 30000,
    ELEMENT_WAIT: 10000,
    FILL_DELAY: 100,
  },
} as const;
