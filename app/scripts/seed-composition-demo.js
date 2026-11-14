const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding realistic Composition Scheme clients & invoices...');

  const clients = [
    {
      clientId: 'client_subhasish',
      clientCode: '048A',
      clientName: 'Subhasish Nath Traders',
      gstin: '18ADKPN2167Q2ZR',
      financialYear: '2026-27',
      q1: {
        openingStock: 85000,
        totalPurchases: 245000,
        rcmTaxableValue: 15000,
        rcmTaxPayable: 750,
        gpMargin: 12.0,
        actualSales: 310000,
      },
      q2: {
        openingStock: 57200, // carried forward from Q1 closing
        totalPurchases: 295000,
        rcmTaxableValue: 18000,
        rcmTaxPayable: 900,
        gpMargin: 12.0,
        actualSales: 380000,
      }
    },
    {
      clientId: 'client_singhania',
      clientCode: '601A',
      clientName: 'Singhania Freight Movers Ltd',
      gstin: '27AAACS1234F1Z5',
      financialYear: '2026-27',
      q1: {
        openingStock: 120000,
        totalPurchases: 450000,
        rcmTaxableValue: 25000,
        rcmTaxPayable: 1250,
        gpMargin: 10.0,
        actualSales: 520000,
      },
      q2: {
        openingStock: 92000, // carried forward
        totalPurchases: 510000,
        rcmTaxableValue: 30000,
        rcmTaxPayable: 1500,
        gpMargin: 10.0,
        actualSales: 580000,
      }
    },
    {
      clientId: 'client_agarwal',
      clientCode: '012B',
      clientName: 'Agarwal Confectionery & Bakery',
      gstin: '18AAACA1234B1Z9',
      financialYear: '2026-27',
      q1: {
        openingStock: 45000,
        totalPurchases: 180000,
        rcmTaxableValue: 8000,
        rcmTaxPayable: 400,
        gpMargin: 15.0,
        actualSales: 240000,
      },
      q2: {
        openingStock: 21000,
        totalPurchases: 220000,
        rcmTaxableValue: 10000,
        rcmTaxPayable: 500,
        gpMargin: 15.0,
        actualSales: 260000,
      }
    }
  ];

  for (const c of clients) {
    for (const q of ['Q1', 'Q2']) {
      const qData = q === 'Q1' ? c.q1 : c.q2;
      const sales = qData.actualSales;
      const gpRatio = qData.gpMargin / 100;
      // Formula: Closing Stock = Opening + Purchases + (GP Margin * Sales) - Sales
      const closingStock = Math.round((qData.openingStock + qData.totalPurchases + (gpRatio * sales) - sales) * 100) / 100;
      const taxOnSales = Math.round(sales * 0.01 * 100) / 100;
      const totalCmp08Tax = Math.round((taxOnSales + qData.rcmTaxPayable) * 100) / 100;

      const ledger = await prisma.compositionSchemeLedger.upsert({
        where: {
          clientId_gstin_financialYear_quarter: {
            clientId: c.clientId,
            gstin: c.gstin,
            financialYear: c.financialYear,
            quarter: q,
          }
        },
        create: {
          clientId: c.clientId,
          clientCode: c.clientCode,
          clientName: c.clientName,
          gstin: c.gstin,
          financialYear: c.financialYear,
          quarter: q,
          openingStock: qData.openingStock,
          totalPurchases: qData.totalPurchases,
          rcmTaxableValue: qData.rcmTaxableValue,
          rcmTaxPayable: qData.rcmTaxPayable,
          gpMargin: qData.gpMargin,
          salesMode: 'ACTUAL',
          actualSales: sales,
          taxRateOnSales: 1.0,
          taxPayableOnSales: taxOnSales,
          totalCmp08Tax,
          closingStock,
          status: 'VERIFIED',
        },
        update: {
          openingStock: qData.openingStock,
          totalPurchases: qData.totalPurchases,
          rcmTaxableValue: qData.rcmTaxableValue,
          rcmTaxPayable: qData.rcmTaxPayable,
          gpMargin: qData.gpMargin,
          actualSales: sales,
          taxPayableOnSales: taxOnSales,
          totalCmp08Tax,
          closingStock,
        }
      });

      // Add realistic invoices for Q2
      if (q === 'Q2') {
        // Clear old invoices
        await prisma.compositionInwardInvoice.deleteMany({
          where: { ledgerId: ledger.id }
        });

        // 1. Regular Invoice 1
        await prisma.compositionInwardInvoice.create({
          data: {
            ledger: { connect: { id: ledger.id } },
            clientId: c.clientId,
            gstin: c.gstin,
            financialYear: c.financialYear,
            quarter: q,
            supplierGstin: '18AAAFM9876C1Z2',
            supplierName: 'Guwahati Wholesale FMCG Ltd',
            invoiceNumber: 'INV/2026/0942',
            invoiceDate: '14-08-2026',
            taxableValue: 145000,
            igst: 0,
            cgst: 13050,
            sgst: 13050,
            cess: 0,
            invoiceValue: 171100,
            isRcm: false,
            rate: 18.0
          }
        });

        // 2. Regular Invoice 2
        await prisma.compositionInwardInvoice.create({
          data: {
            ledger: { connect: { id: ledger.id } },
            clientId: c.clientId,
            gstin: c.gstin,
            financialYear: c.financialYear,
            quarter: q,
            supplierGstin: '18BBBPT4321D1Z9',
            supplierName: 'Kamrup Packaging Solutions',
            invoiceNumber: 'KP-8821',
            invoiceDate: '27-08-2026',
            taxableValue: 105000,
            igst: 0,
            cgst: 9450,
            sgst: 9450,
            cess: 0,
            invoiceValue: 123900,
            isRcm: false,
            rate: 18.0
          }
        });

        // 3. RCM Invoice (Goods Transport Agency GTA Sec 9(3))
        await prisma.compositionInwardInvoice.create({
          data: {
            ledger: { connect: { id: ledger.id } },
            clientId: c.clientId,
            gstin: c.gstin,
            financialYear: c.financialYear,
            quarter: q,
            supplierGstin: '18GTA1234567Z1',
            supplierName: 'Assam Bengal Roadways (GTA)',
            invoiceNumber: 'CN/26/4102',
            invoiceDate: '05-09-2026',
            taxableValue: qData.rcmTaxableValue,
            igst: 0,
            cgst: Math.round(qData.rcmTaxPayable / 2),
            sgst: Math.round(qData.rcmTaxPayable / 2),
            cess: 0,
            invoiceValue: qData.rcmTaxableValue,
            isRcm: true,
            rate: 5.0
          }
        });
      }
    }
  }

  console.log('✅ Successfully seeded Composition Scheme clients, ledgers, and GSTR-2A invoices!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
