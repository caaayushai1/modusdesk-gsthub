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
}

export function parseGSTR4AExcelBuffer(buffer: Buffer | ArrayBuffer): IngestedInvoice[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const result: IngestedInvoice[] = [];

  const sheetNames = workbook.SheetNames;
  const b2bSheetName = sheetNames.find(s => 
    /b2b/i.test(s) || /inward/i.test(s) || /4a/i.test(s)
  ) || sheetNames[0];

  if (!b2bSheetName) return result;

  const worksheet = workbook.Sheets[b2bSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (rows.length < 2) return result;

  let headerRowIdx = -1;
  const colMap: Record<string, number> = {};

  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r];
    const joined = row.map(c => String(c).toLowerCase()).join(' ');
    if (joined.includes('gstin') || (joined.includes('invoice') && joined.includes('taxable'))) {
      headerRowIdx = r;
      row.forEach((cellVal: any, colIdx: number) => {
        const val = String(cellVal).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (val) colMap[val] = colIdx;
      });
      break;
    }
  }

  const findCol = (...keywords: string[]): number => {
    for (const kw of keywords) {
      const cleanKw = kw.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const [key, idx] of Object.entries(colMap)) {
        if (key.includes(cleanKw) || cleanKw.includes(key)) {
          return idx;
        }
      }
    }
    return -1;
  };

  const ctinCol = findCol('gstinofsupplier', 'suppliergstin', 'gstin', 'ctin');
  const nameCol = findCol('tradename', 'legalname', 'suppliername', 'name');
  const invNumCol = findCol('invoicenumber', 'invoiceno', 'invno', 'inum');
  const invDateCol = findCol('invoicedate', 'date', 'invdate', 'dt', 'idt');
  const invValCol = findCol('invoicevalue', 'invval', 'value', 'val');
  const rcmCol = findCol('reversecharge', 'rchrg', 'rcm');
  const rateCol = findCol('rate', 'ratepercent', 'rt');
  const txvalCol = findCol('taxablevalue', 'taxableamt', 'txval');
  const igstCol = findCol('integratedtax', 'igst', 'iamt');
  const cgstCol = findCol('centraltax', 'cgst', 'camt');
  const sgstCol = findCol('statetax', 'stateuttax', 'sgst', 'utgst', 'samt');
  const cessCol = findCol('cess', 'csamt');

  const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 1;

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rawGstin = ctinCol >= 0 ? String(row[ctinCol] || '').trim() : '';
    const rawInvNum = invNumCol >= 0 ? String(row[invNumCol] || '').trim() : '';
    
    if (!rawGstin && !rawInvNum) continue;
    if (rawGstin.toLowerCase().includes('total') || rawInvNum.toLowerCase().includes('total')) continue;

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

    result.push({
      supplierGstin,
      supplierName: supplierName || undefined,
      invoiceNumber,
      invoiceDate,
      invoiceValue: invoiceValue || (taxableValue + igst + cgst + sgst + cess),
      taxableValue: Math.round(taxableValue * 100) / 100,
      igst: Math.round(igst * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      cess: Math.round(cess * 100) / 100,
      rate,
      isRcm,
    });
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
