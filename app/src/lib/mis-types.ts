export interface GSTR1Vs3BMonthRow {
  month: string;
  period: string;
  gstr1Taxable: number;
  gstr1Tax: number;
  gstr3bTaxable: number;
  gstr3bTax: number;
  taxDifference: number; // GSTR1 - 3B
  drc01bAlert: boolean;  // Rule 88C Notice Risk if GSTR1 > GSTR3B
}

export interface GSTR2BVs3BMonthRow {
  month: string;
  period: string;
  gstr2bItc: number;
  gstr3bItcClaimed: number;
  excessClaim: number;   // 3B - 2B
  drc01cAlert: boolean;  // Rule 88D Notice Risk if Claimed > Available
}

export interface GSTR9OutwardRow {
  natureOfSupply: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  totalTax: number;
}

export interface GSTR9TaxPaidRow {
  taxHead: string;
  taxPayable: number;
  paidViaCash: number;
  paidViaItc: number;
}

export interface MISReportData {
  clientId: string;
  clientName: string;
  gstin: string;
  financialYear: string;
  gstr1Vs3b: GSTR1Vs3BMonthRow[];
  gstr2bVs3b: GSTR2BVs3BMonthRow[];
  gstr9Outward: GSTR9OutwardRow[];
  gstr9TaxPaid: GSTR9TaxPaidRow[];
  totals: {
    fyGstr1Tax: number;
    fyGstr3bTax: number;
    fyLiabilityGap: number;
    fyGstr2bItc: number;
    fyGstr3bItc: number;
    fyExcessItcClaimed: number;
  };
}
