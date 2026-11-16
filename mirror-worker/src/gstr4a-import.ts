import path from 'path';
import os from 'os';
import fs from 'fs';
import {
  parseGSTR4AExcelBuffer,
  aggregateInvoices,
  type IngestedInvoice,
} from './excel-parser';
import {
  createRun,
  startTracing,
  saveTrace,
  saveLog,
  setupConsoleCapture,
  setupNetworkCapture,
  captureFailureArtifacts,
  log,
} from './portal-tracing';
import {
  CompanionError,
  createBrowserContext,
  step_fillLoginCredentials,
  step_waitForUserLogin,
  injectAutomationShield,
  removeAutomationShield,
  step_navigateToReturnsDashboard,
  step_verifyCompositionScheme,
  step_selectPeriod,
  step_downloadGSTR4AInMemory,
} from './portal-steps';

export interface GSTR4AImportRequest {
  username: string;
  password: string;
  financialYear: string; // e.g. "2024-25"
  quarter: string;       // "Q1" | "Q2" | "Q3" | "Q4"
  gstin?: string;
}

export interface GSTR4AImportResult {
  success: boolean;
  message: string;
  invoices?: IngestedInvoice[];
  summary?: {
    totalPurchases: number;
    rcmTaxableValue: number;
    rcmTaxPayable: number;
    invoiceCount: number;
    rcmCount: number;
  };
  error?: string;
  traceDir?: string;
}

/**
 * GSTR-4A Inward Supplies Live-Verified Import (Composition Scheme)
 *
 * Flow:
 *  1. Opens visible browser window & pre-fills credentials (brings to foreground)
 *  2. User solves CAPTCHA / 2FA manually
 *  3. Dismisses any welcome/advisory/e-KYC popups (e.g. Remind Me Later)
 *  4. Navigates to Returns Dashboard via direct button or services menu
 *  5. Executes Fail-Safe Scheme check (aborts if Regular scheme detected)
 *  6. Selects FY and Quarter, clicks SEARCH
 *  7. Navigates to Offline Download, selects quarters, catches binary stream in memory
 *  8. Parses invoices directly in RAM (Zero disk storage, zero clutter in Downloads)
 *  9. Returns parsed invoice objects to ModusDesk GSThub
 */
export async function executeGSTR4AImport(req: GSTR4AImportRequest): Promise<GSTR4AImportResult> {
  const artifacts = createRun(`gstr4a_${req.quarter}_${req.financialYear.replace('-', '')}`);
  log(artifacts, `[GSTR4A] Starting Live-Verified import for ${req.username} | ${req.quarter} ${req.financialYear}`);

  const { context, page, channel } = await createBrowserContext('gstr4a');
  log(artifacts, `[GSTR4A] Browser launched: ${channel}`);

  await startTracing(context, artifacts);
  setupConsoleCapture(page, artifacts);
  setupNetworkCapture(page, artifacts);

  const flagPath = path.join(os.tmpdir(), `modusdesk_captcha_${Date.now()}.flag`);

  try {
    // 1. Fill login credentials and bring window to front + launch TopMost alert
    await step_fillLoginCredentials(page, req.username, req.password, artifacts, flagPath);

    // 2. Wait for user to complete CAPTCHA & login
    await step_waitForUserLogin(page, artifacts, 180000, flagPath);

    // Lock page with Automation Shield to prevent user scroll/mis-clicks
    await injectAutomationShield(page, `Fetching GSTR-4A for ${req.quarter} FY ${req.financialYear}...`);

    // 3. Navigate to Returns Dashboard
    await step_navigateToReturnsDashboard(page, artifacts);

    // 4. Scheme verification fail-safe
    await step_verifyCompositionScheme(page, artifacts);

    // 5. Select FY and Quarter
    await step_selectPeriod(page, req.financialYear, req.quarter, artifacts);

    // 6. Download Excel file directly in-memory (Zero disk storage)
    const excelBuffer = await step_downloadGSTR4AInMemory(page, req.quarter, artifacts);

    // 7. Parse Excel workbook directly in RAM
    const invoices = parseGSTR4AExcelBuffer(excelBuffer);
    log(artifacts, `[GSTR4A] Successfully parsed ${invoices.length} invoices from memory stream.`);

    const summary = aggregateInvoices(invoices);
    log(artifacts, `[GSTR4A] Invoices: ${summary.invoiceCount}, RCM: ${summary.rcmCount}, Total Purchases: ₹${summary.totalPurchases}`);

    await saveTrace(context, artifacts);
    await context.close().catch(() => {});
    saveLog(artifacts);

    return {
      success: true,
      message: invoices.length > 0
        ? `Successfully imported ${invoices.length} inward invoices for ${req.quarter} FY ${req.financialYear}!`
        : `Connected to GST Portal for ${req.quarter} FY ${req.financialYear}. No inward supplies were reported by suppliers for this period.`,
      invoices,
      summary,
      traceDir: artifacts.runDir,
    };
  } catch (err: unknown) {
    const isCompanion = err instanceof CompanionError;
    const code = isCompanion ? err.code : 'UNKNOWN';
    const message = err instanceof Error ? err.message : String(err);

    log(artifacts, `[GSTR4A] ERROR [${code}]: ${message}`);

    await captureFailureArtifacts(page, artifacts, 'gstr4a_failure').catch(() => {});
    await saveTrace(context, artifacts).catch(() => {});
    await context.close().catch(() => {});
    saveLog(artifacts);

    return {
      success: false,
      message: `GSTR-4A import error: ${message}`,
      error: code,
      traceDir: artifacts.runDir,
    };
  } finally {
    try {
      if (fs.existsSync(flagPath)) fs.unlinkSync(flagPath);
    } catch {}
  }
}
