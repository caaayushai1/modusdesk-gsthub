export interface MatrixRow {
  id: string;
  clientId: string;
  clientCode: string;
  clientName: string;
  gstin: string;
  stateCode: string;
  period: string;
  financialYear: string;
  isQrmp: boolean;
  gstr1Status: 'FILED' | 'PENDING' | 'OVERDUE';
  gstr1Arn: string | null;
  gstr1FilingDate: string | null;
  gstr3bStatus: 'FILED' | 'PENDING' | 'OVERDUE';
  gstr3bArn: string | null;
  gstr3bFilingDate: string | null;
  gstr2bGenerated: boolean;
  lastSyncedAt: string;
}

export interface MatrixMetrics {
  totalGstins: number;
  gstr1FiledCount: number;
  gstr1Percentage: number;
  gstr3bFiledCount: number;
  gstr3bPercentage: number;
  fullyFiledCount: number;
  pendingCount: number;
  overdueCount: number;
}

export interface MatrixApiResponse {
  period: string;
  financialYear: string;
  availablePeriods: string[];
  metrics: MatrixMetrics;
  rows: MatrixRow[];
}
