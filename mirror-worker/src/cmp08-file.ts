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
  step_populateCMP08Online,
} from './portal-steps';

export interface CMP08FileRequest {
  username: string;
  password: string;
  financialYear: string; // e.g. "2024-25"
  quarter: string;       // "Q1" | "Q2" | "Q3" | "Q4"
  gstin?: string;
  actualSales: number;
  rcmTaxableValue: number;
}

export interface CMP08FileResult {
  success: boolean;
  message: string;
  savedScreenshotBase64?: string | null;
  error?: string;
  traceDir?: string;
}

/**
 * Automates CMP-08 Self-Assessed Tax Form Draft Population (Composition Scheme)
 *
 * 🛑 CRITICAL POLICY:
 * This automation STOPS after clicking SAVE.
 * It NEVER clicks "PROCEED TO FILE" or attempts return submission.
 * Final verification, DSC/EVC OTP must be completed manually by human staff.
 */
export async function executeCMP08Filing(req: CMP08FileRequest): Promise<CMP08FileResult> {
  const artifacts = createRun(`cmp08_${req.quarter}_${req.financialYear.replace('-', '')}`);
  log(artifacts, `[CMP08] Starting CMP-08 preparation for ${req.username} | ${req.quarter} ${req.financialYear}`);
  log(artifacts, `[CMP08] Target figures: Turnover=₹${req.actualSales}, RCM Inward=₹${req.rcmTaxableValue}`);

  const { context, page, channel } = await createBrowserContext('cmp08');
  log(artifacts, `[CMP08] Browser launched: ${channel}`);

  await startTracing(context, artifacts);
  setupConsoleCapture(page, artifacts);
  setupNetworkCapture(page, artifacts);

  try {
    // 1. Fill credentials and bring window to front
    await step_fillLoginCredentials(page, req.username, req.password, artifacts);

    // 2. Wait for user login
    await step_waitForUserLogin(page, artifacts, 180000);

    // Lock page with Automation Shield
    await injectAutomationShield(page, `Preparing CMP-08 for ${req.quarter} FY ${req.financialYear}...`);

    // 3. Navigate to Returns Dashboard
    await step_navigateToReturnsDashboard(page, artifacts);

    // 4. Scheme check fail-safe
    await step_verifyCompositionScheme(page, artifacts);

    // 5. Select FY & Quarter
    await step_selectPeriod(page, req.financialYear, req.quarter, artifacts);

    // 6. Populate Table 3 and click SAVE only
    const { savedScreenshotBase64 } = await step_populateCMP08Online(
      page,
      req.actualSales,
      req.rcmTaxableValue,
      artifacts,
    );

    await saveTrace(context, artifacts);
    saveLog(artifacts);

    return {
      success: true,
      message: `Form CMP-08 Table 3 for ${req.quarter} FY ${req.financialYear} has been populated with Turnover ₹${req.actualSales} and RCM ₹${req.rcmTaxableValue} and saved on the GST Portal. Browser is ready on screen for human review and filing.`,
      savedScreenshotBase64,
      traceDir: artifacts.runDir,
    };
  } catch (err: unknown) {
    const isCompanion = err instanceof CompanionError;
    const code = isCompanion ? err.code : 'UNKNOWN';
    const message = err instanceof Error ? err.message : String(err);

    log(artifacts, `[CMP08] ERROR [${code}]: ${message}`);

    await captureFailureArtifacts(page, artifacts, 'cmp08_failure').catch(() => {});
    await saveTrace(context, artifacts).catch(() => {});
    saveLog(artifacts);

    return {
      success: false,
      message: `CMP-08 preparation error: ${message}`,
      error: code,
      traceDir: artifacts.runDir,
    };
  }
}
