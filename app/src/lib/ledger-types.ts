export interface CreditLedgerBalance {
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  totalCredit: number;
}

export interface CashSubHead {
  tax: number;
  interest: number;
  penalty: number;
  fee: number;
  other: number;
  total: number;
}

export interface CashLedgerBalance {
  igst: CashSubHead;
  cgst: CashSubHead;
  sgst: CashSubHead;
  cess: CashSubHead;
  totalCash: number;
}

export interface TaxLiabilityInput {
  igstLiability: number;
  cgstLiability: number;
  sgstLiability: number;
  cessLiability: number;
}

export interface ITCOffsetResult {
  utilizedIgst: {
    againstIgst: number;
    againstCgst: number;
    againstSgst: number;
    total: number;
  };
  utilizedCgst: {
    againstCgst: number;
    againstIgst: number;
    total: number;
  };
  utilizedSgst: {
    againstSgst: number;
    againstIgst: number;
    total: number;
  };
  utilizedCess: number;
  remainingCredit: CreditLedgerBalance;
  netCashPayable: {
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    total: number;
  };
  totalTaxPayable: number;
  totalCreditUtilized: number;
}

/**
 * Implements Section 49 / Rule 88A of CGST Rules:
 * Order of utilization of Input Tax Credit (ITC):
 * 1. IGST credit MUST be completely exhausted before utilizing CGST/SGST credit.
 *    - IGST credit utilized first against IGST liability, then against CGST and SGST in any order/proportion.
 * 2. CGST credit utilized against CGST liability, then remaining against IGST liability (never against SGST).
 * 3. SGST credit utilized against SGST liability, then remaining against IGST liability (never against CGST).
 * 4. Any remaining liability must be paid in cash via Challan PMT-06.
 */
export function calculateRule88AOffset(
  liability: TaxLiabilityInput,
  credit: CreditLedgerBalance
): ITCOffsetResult {
  let remIgstLiability = Math.max(0, liability.igstLiability);
  let remCgstLiability = Math.max(0, liability.cgstLiability);
  let remSgstLiability = Math.max(0, liability.sgstLiability);
  let remCessLiability = Math.max(0, liability.cessLiability);

  let availIgstCredit = Math.max(0, credit.igst);
  let availCgstCredit = Math.max(0, credit.cgst);
  let availSgstCredit = Math.max(0, credit.sgst);
  let availCessCredit = Math.max(0, credit.cess);

  // ── Step 1: Exhaust IGST Credit ──────────────────────────────
  // 1a. IGST credit against IGST liability
  const igstAgainstIgst = Math.min(availIgstCredit, remIgstLiability);
  availIgstCredit -= igstAgainstIgst;
  remIgstLiability -= igstAgainstIgst;

  // 1b. Remaining IGST credit against CGST liability
  const igstAgainstCgst = Math.min(availIgstCredit, remCgstLiability);
  availIgstCredit -= igstAgainstCgst;
  remCgstLiability -= igstAgainstCgst;

  // 1c. Remaining IGST credit against SGST liability
  const igstAgainstSgst = Math.min(availIgstCredit, remSgstLiability);
  availIgstCredit -= igstAgainstSgst;
  remSgstLiability -= igstAgainstSgst;

  // ── Step 2: Utilize CGST Credit ──────────────────────────────
  // 2a. CGST credit against CGST liability
  const cgstAgainstCgst = Math.min(availCgstCredit, remCgstLiability);
  availCgstCredit -= cgstAgainstCgst;
  remCgstLiability -= cgstAgainstCgst;

  // 2b. Remaining CGST credit against IGST liability
  const cgstAgainstIgst = Math.min(availCgstCredit, remIgstLiability);
  availCgstCredit -= cgstAgainstIgst;
  remIgstLiability -= cgstAgainstIgst;

  // ── Step 3: Utilize SGST Credit ──────────────────────────────
  // 3a. SGST credit against SGST liability
  const sgstAgainstSgst = Math.min(availSgstCredit, remSgstLiability);
  availSgstCredit -= sgstAgainstSgst;
  remSgstLiability -= sgstAgainstSgst;

  // 3b. Remaining SGST credit against IGST liability
  const sgstAgainstIgst = Math.min(availSgstCredit, remIgstLiability);
  availSgstCredit -= sgstAgainstIgst;
  remIgstLiability -= sgstAgainstIgst;

  // ── Step 4: Utilize Cess Credit ──────────────────────────────
  const cessAgainstCess = Math.min(availCessCredit, remCessLiability);
  availCessCredit -= cessAgainstCess;
  remCessLiability -= cessAgainstCess;

  const totalCreditUtilized =
    igstAgainstIgst +
    igstAgainstCgst +
    igstAgainstSgst +
    cgstAgainstCgst +
    cgstAgainstIgst +
    sgstAgainstSgst +
    sgstAgainstIgst +
    cessAgainstCess;

  const netCashTotal =
    remIgstLiability + remCgstLiability + remSgstLiability + remCessLiability;

  return {
    utilizedIgst: {
      againstIgst: igstAgainstIgst,
      againstCgst: igstAgainstCgst,
      againstSgst: igstAgainstSgst,
      total: igstAgainstIgst + igstAgainstCgst + igstAgainstSgst,
    },
    utilizedCgst: {
      againstCgst: cgstAgainstCgst,
      againstIgst: cgstAgainstIgst,
      total: cgstAgainstCgst + cgstAgainstIgst,
    },
    utilizedSgst: {
      againstSgst: sgstAgainstSgst,
      againstIgst: sgstAgainstIgst,
      total: sgstAgainstSgst + sgstAgainstIgst,
    },
    utilizedCess: cessAgainstCess,
    remainingCredit: {
      igst: availIgstCredit,
      cgst: availCgstCredit,
      sgst: availSgstCredit,
      cess: availCessCredit,
      totalCredit: availIgstCredit + availCgstCredit + availSgstCredit + availCessCredit,
    },
    netCashPayable: {
      igst: remIgstLiability,
      cgst: remCgstLiability,
      sgst: remSgstLiability,
      cess: remCessLiability,
      total: netCashTotal,
    },
    totalTaxPayable:
      liability.igstLiability +
      liability.cgstLiability +
      liability.sgstLiability +
      liability.cessLiability,
    totalCreditUtilized,
  };
}
