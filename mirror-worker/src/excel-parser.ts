import * as XLSX from 'xlsx';

export interface IngestedInvoice {
  supplierGstin: string;
  supplierName?: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  rate: number;
  isRcm: boolean;
  periodStr?: string;
  periodQuarter?: string;
  periodFy?: string;
  noteType?: 'C' | 'D' | 'INV';
}

/**
 * Parses GSTR-4A Period string (from Column A of official GST Portal Excel).
 * Format examples:
 * - "Jul-Sep 26" -> { quarter: 'Q2', fy: '2026-27', label: 'Jul-Sep 26' }
 * - "Apr-Jun 26" -> { quarter: 'Q1', fy: '2026-27', label: 'Apr-Jun 26' }
 * - "Oct-Dec 26" -> { quarter: 'Q3', fy: '2026-27', label: 'Oct-Dec 26' }
 * - "Jan-Mar 27" -> { quarter: 'Q4', fy: '2026-27', label: 'Jan-Mar 27' }
 */
export function parseGSTR4APeriodStr(periodStr: string | undefined): { quarter: string; fy?: string; label: string } | null {
  if (!periodStr) return null;
  const s = String(periodStr).trim();
  if (!s) return null;

  const lower = s.toLowerCase();
  
  let quarter: string | null = null;
  if (/apr|jun/i.test(lower)) quarter = 'Q1';
  else if (/jul|sep/i.test(lower)) quarter = 'Q2';
  else if (/oct|dec/i.test(lower)) quarter = 'Q3';
  else if (/jan|mar/i.test(lower)) quarter = 'Q4';

  const yearMatch = s.match(/(20\d{2}|\b\d{2}\b)/);
  let fy: string | undefined = undefined;

  if (quarter && yearMatch) {
    const rawYear = parseInt(yearMatch[1], 10);
    const startYear = rawYear < 100 ? 2000 + rawYear : rawYear;
    if (quarter === 'Q4') {
      const prevYear = startYear - 1;
      const endYearShort = String(startYear).slice(-2);
      fy = `${prevYear}-${endYearShort}`;
    } else {
      const nextYearShort = String(startYear + 1).slice(-2);
      fy = `${startYear}-${nextYearShort}`;
    }
  }

  if (!quarter) {
    const mmYyyy = s.match(/^(\d{2})[-/]?(\d{4})$/);
    if (mmYyyy) {
      const mm = parseInt(mmYyyy[1], 10);
      const yyyy = parseInt(mmYyyy[2], 10);
      if (mm >= 4 && mm <= 6) {
        quarter = 'Q1';
        fy = `${yyyy}-${String(yyyy + 1).slice(-2)}`;
      } else if (mm >= 7 && mm <= 9) {
        quarter = 'Q2';
        fy = `${yyyy}-${String(yyyy + 1).slice(-2)}`;
      } else if (mm >= 10 && mm <= 12) {
        quarter = 'Q3';
        fy = `${yyyy}-${String(yyyy + 1).slice(-2)}`;
      } else if (mm >= 1 && mm <= 3) {
        quarter = 'Q4';
        fy = `${yyyy - 1}-${String(yyyy).slice(-2)}`;
      }
    }
  }

  if (!quarter) return null;
  return { quarter, fy, label: s };
}

export function parseGSTR4AExcelBuffer(buffer: Buffer | ArrayBuffer): IngestedInvoice[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const result: IngestedInvoice[] = [];

  const sheetNames = workbook.SheetNames;
  const targetSheets = sheetNames.filter(name => {
    const n = name.trim().toUpperCase();
    return (
      n === 'B2B' || 
      n === 'B2BA' || 
      n === 'CDNR' || 
      n === 'CDNRA' || 
      n.includes('B2B') || 
      n.includes('INWARD') || 
      n.includes('4A')
    );
  });

  const sheetsToProcess = targetSheets.length > 0 ? targetSheets : [sheetNames[0]];

  for (const sheetName of sheetsToProcess) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (rows.length < 2) continue;

    let startRow = -1;
    const combinedColHeaders: Record<number, string> = {};

    for (let r = 0; r < Math.min(rows.length, 12); r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;
      const rowText = row.map(c => String(c).trim().toLowerCase()).join(' ');

      const isHeaderLike = 
        rowText.includes('gstin') || 
        rowText.includes('gstr-4a period') || 
        rowText.includes('period') || 
        rowText.includes('invoice') || 
        rowText.includes('taxable value') || 
        rowText.includes('rate') || 
        rowText.includes('reverse charge');

      if (isHeaderLike) {
        row.forEach((cellVal: any, colIdx: number) => {
          const val = String(cellVal).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          if (val) {
            combinedColHeaders[colIdx] = (combinedColHeaders[colIdx] || '') + ' ' + val;
          }
        });
        startRow = r + 1;
      }
    }

    if (startRow < 0) startRow = 1;

    const findCol = (...keywords: string[]): number => {
      for (const kw of keywords) {
        const cleanKw = kw.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const [colIdxStr, headerText] of Object.entries(combinedColHeaders)) {
          const colIdx = parseInt(colIdxStr, 10);
          if (headerText.includes(cleanKw) || cleanKw.includes(headerText)) {
            return colIdx;
          }
        }
      }
      return -1;
    };

    let periodCol = findCol('gstr4aperiod', 'returnperiod', 'period');
    if (periodCol === -1) {
      periodCol = 0;
    }

    const ctinCol = findCol('gstinofsupplier', 'suppliergstin', 'gstin', 'ctin');
    const nameCol = findCol('tradename', 'legalname', 'suppliername', 'name');
    const invNumCol = findCol('invoicenumber', 'invoiceno', 'notenumber', 'noteno', 'invno', 'inum');
    const invDateCol = findCol('invoicedate', 'notedate', 'invdate', 'dt', 'idt', 'date');
    const invValCol = findCol('invoicevalue', 'notevalue', 'invval', 'val', 'value');
    const rcmCol = findCol('reversecharge', 'supplyattractreversecharge', 'rchrg', 'rcm');
    const rateCol = findCol('rate', 'ratepercent', 'rt');
    const txvalCol = findCol('taxablevalue', 'taxableamt', 'txval');
    const igstCol = findCol('integratedtax', 'igst', 'iamt');
    const cgstCol = findCol('centraltax', 'cgst', 'camt');
    const sgstCol = findCol('statetax', 'stateuttax', 'sgst', 'utgst', 'samt');
    const cessCol = findCol('cess', 'csamt');
    const noteTypeCol = findCol('notetype', 'documenttype', 'doctype');

    for (let r = startRow; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const rawGstin = ctinCol >= 0 ? String(row[ctinCol] || '').trim() : '';
      const rawInvNum = invNumCol >= 0 ? String(row[invNumCol] || '').trim() : '';
      const rawPeriod = periodCol >= 0 ? String(row[periodCol] || '').trim() : String(row[0] || '').trim();

      if (!rawGstin && !rawInvNum) continue;
      const fullRowText = row.map(c => String(c).toLowerCase()).join(' ');
      if (fullRowText.includes('total') || rawGstin.toLowerCase().includes('total') || rawInvNum.toLowerCase().includes('total')) {
        continue;
      }
      if (rawGstin.toLowerCase().includes('gstin') || rawInvNum.toLowerCase().includes('invoice number')) {
        continue;
      }

      const periodInfo = parseGSTR4APeriodStr(rawPeriod);

      const supplierGstin = rawGstin || 'UNKNOWN_GSTIN';
      const supplierName = nameCol >= 0 ? String(row[nameCol] || '').trim() : undefined;
      const invoiceNumber = rawInvNum || `INV-${r}`;
      
      let invoiceDate = invDateCol >= 0 ? String(row[invDateCol] || '').trim() : '';
      if (!invoiceDate) {
        invoiceDate = new Date().toISOString().split('T')[0];
      }

      const invoiceValue = invValCol >= 0 ? Number(String(row[invValCol]).replace(/,/g, '')) || 0 : 0;
      const taxableValue = txvalCol >= 0 ? Number(String(row[txvalCol]).replace(/,/g, '')) || 0 : (invoiceValue * 0.85);
      const igst = igstCol >= 0 ? Number(String(row[igstCol]).replace(/,/g, '')) || 0 : 0;
      const cgst = cgstCol >= 0 ? Number(String(row[cgstCol]).replace(/,/g, '')) || 0 : 0;
      const sgst = sgstCol >= 0 ? Number(String(row[sgstCol]).replace(/,/g, '')) || 0 : 0;
      const cess = cessCol >= 0 ? Number(String(row[cessCol]).replace(/,/g, '')) || 0 : 0;
      const rate = rateCol >= 0 ? Number(String(row[rateCol]).replace(/[^0-9.]/g, '')) || 0 : 0;

      const rawRcm = rcmCol >= 0 ? String(row[rcmCol] || '').trim().toUpperCase() : 'N';
      const isRcm = rawRcm === 'Y' || rawRcm === 'YES' || rawRcm === 'TRUE';

      const rawNoteType = noteTypeCol >= 0 ? String(row[noteTypeCol] || '').trim().toUpperCase() : '';
      const isCreditNote = rawNoteType === 'C' || (sheetName.toUpperCase().includes('CDNR') && rawNoteType !== 'D');
      const multiplier = isCreditNote ? -1 : 1;

      result.push({
        supplierGstin,
        supplierName: supplierName || undefined,
        invoiceNumber,
        invoiceDate,
        invoiceValue: (invoiceValue || (taxableValue + igst + cgst + sgst + cess)) * multiplier,
        taxableValue: Math.round(taxableValue * multiplier * 100) / 100,
        igst: Math.round(igst * multiplier * 100) / 100,
        cgst: Math.round(cgst * multiplier * 100) / 100,
        sgst: Math.round(sgst * multiplier * 100) / 100,
        cess: Math.round(cess * multiplier * 100) / 100,
        rate,
        isRcm,
        periodStr: periodInfo?.label || rawPeriod || undefined,
        periodQuarter: periodInfo?.quarter || undefined,
        periodFy: periodInfo?.fy || undefined,
        noteType: isCreditNote ? 'C' : 'INV',
      });
    }
  }

  return result;
}

export function parseGSTR4AJsonData(rawJson: any): IngestedInvoice[] {
  const result: IngestedInvoice[] = [];
  if (!rawJson) return result;

  const b2bList = rawJson.b2b || (Array.isArray(rawJson) ? rawJson : []);
  if (Array.isArray(b2bList)) {
    for (const supplier of b2bList) {
      const supplierGstin = supplier.ctin || supplier.supplierGstin || 'UNKNOWN_GSTIN';
      const supplierName = supplier.cname || supplier.tradeName || supplier.supplierName || null;
      const invList = supplier.inv || supplier.invoices || (supplier.inum ? [supplier] : []);

      for (const inv of invList) {
        const invoiceNumber = inv.inum || inv.invoiceNumber || 'INV-UNKNOWN';
        const invoiceDate = inv.idt || inv.invoiceDate || new Date().toISOString().split('T')[0];
        const invoiceValue = Number(inv.val) || Number(inv.invoiceValue) || 0;
        const isRcm = String(inv.rchrg || inv.isRcm).toUpperCase() === 'Y' || inv.isRcm === true;

        let taxableValue = 0;
        let igst = 0;
        let cgst = 0;
        let sgst = 0;
        let cess = 0;
        let rate = 0;

        if (Array.isArray(inv.itms)) {
          for (const item of inv.itms) {
            const det = item.itm_det || item;
            taxableValue += Number(det.txval) || 0;
            igst += Number(det.iamt) || 0;
            cgst += Number(det.camt) || 0;
            sgst += Number(det.samt) || 0;
            cess += Number(det.csamt) || 0;
            if (det.rt) rate = Number(det.rt);
          }
        } else {
          taxableValue = Number(inv.taxableValue) || (invoiceValue * 0.85);
          igst = Number(inv.igst) || 0;
          cgst = Number(inv.cgst) || 0;
          sgst = Number(inv.sgst) || 0;
          cess = Number(inv.cess) || 0;
          rate = Number(inv.rate) || 18;
        }

        result.push({
          supplierGstin,
          supplierName,
          invoiceNumber,
          invoiceDate,
          invoiceValue: invoiceValue || (taxableValue + igst + cgst + sgst + cess),
          taxableValue,
          igst,
          cgst,
          sgst,
          cess,
          rate,
          isRcm,
        });
      }
    }
  }

  return result;
}

export function aggregateInvoices(invoices: IngestedInvoice[]) {
  let totalPurchases = 0;
  let rcmTaxableValue = 0;
  let rcmTaxPayable = 0;

  for (const inv of invoices) {
    const totalTax = (Number(inv.igst) || 0) + (Number(inv.cgst) || 0) + (Number(inv.sgst) || 0) + (Number(inv.cess) || 0);
    const taxable = Number(inv.taxableValue) || 0;

    if (inv.isRcm) {
      rcmTaxableValue += taxable;
      rcmTaxPayable += totalTax;
    } else {
      totalPurchases += (taxable + totalTax);
    }
  }

  return {
    totalPurchases: Math.round(totalPurchases * 100) / 100,
    rcmTaxableValue: Math.round(rcmTaxableValue * 100) / 100,
    rcmTaxPayable: Math.round(rcmTaxPayable * 100) / 100,
    invoiceCount: invoices.length,
    rcmCount: invoices.filter(i => i.isRcm).length,
  };
}
