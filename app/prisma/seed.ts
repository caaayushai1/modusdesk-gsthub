import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CLIENTS = [
  { code: '001A', name: 'Acme Corporation Ltd.', gstin: '27AABCA1234F1Z5', state: '27', isQrmp: false },
  { code: '001B', name: 'Acme Gujarat Logistics', gstin: '24AABCA1234F1Z1', state: '24', isQrmp: false },
  { code: '002A', name: 'TechFlow Solutions LLP', gstin: '27AABCT9876H1Z9', state: '27', isQrmp: false },
  { code: '002B', name: 'TechFlow Bangalore Branch', gstin: '29AABCT9876H1Z3', state: '29', isQrmp: false },
  { code: '003A', name: 'Singhania Global Freight', gstin: '27AASCS1122K1Z1', state: '27', isQrmp: false },
  { code: '004A', name: 'Royal Tea Traders', gstin: '18AAECR5544N1Z8', state: '18', isQrmp: true },
  { code: '005A', name: 'Gupta Steel & Hardware', gstin: '07AABCG3344M1Z2', state: '07', isQrmp: false },
  { code: '006A', name: 'Apex Polymers India Pvt Ltd', gstin: '27AABCA9988P1Z4', state: '27', isQrmp: false },
  { code: '007A', name: 'Sunrise Diagnostics Center', gstin: '27AASCS7766R1Z0', state: '27', isQrmp: true },
  { code: '008A', name: 'BlueStar Hospitality Services', gstin: '24AABCB4455L1Z7', state: '24', isQrmp: false },
];

const PERIODS = [
  { period: '2026-04', fy: '2026-2027' },
  { period: '2026-05', fy: '2026-2027' },
  { period: '2026-06', fy: '2026-2027' },
  { period: '2026-07', fy: '2026-2027' },
];

async function main() {
  console.log('Seeding GST Filing Status Matrix data...');

  // Clean existing
  await prisma.gSTFilingStatus.deleteMany();

  for (const client of CLIENTS) {
    for (const p of PERIODS) {
      let gstr1Status = 'FILED';
      let gstr1Arn: string | null = `AA${client.state}${p.period.replace('-', '')}00123`;
      let gstr1Date: Date | null = new Date(`${p.period}-11T11:30:00Z`);

      let gstr3bStatus = 'FILED';
      let gstr3bArn: string | null = `AB${client.state}${p.period.replace('-', '')}00456`;
      let gstr3bDate: Date | null = new Date(`${p.period}-19T16:45:00Z`);

      let gstr2bGenerated = true;

      // Current active period (2026-07) has real pending / mixed statuses
      if (p.period === '2026-07') {
        if (client.code === '001A' || client.code === '001B') {
          // Fully filed
          gstr1Status = 'FILED';
          gstr3bStatus = 'FILED';
        } else if (client.code === '002A' || client.code === '006A') {
          // GSTR-1 filed, 3B pending
          gstr1Status = 'FILED';
          gstr3bStatus = 'PENDING';
          gstr3bArn = null;
          gstr3bDate = null;
        } else if (client.code === '003A' || client.code === '005A') {
          // Both pending / overdue
          gstr1Status = 'OVERDUE';
          gstr1Arn = null;
          gstr1Date = null;
          gstr3bStatus = 'PENDING';
          gstr3bArn = null;
          gstr3bDate = null;
        } else if (client.isQrmp) {
          // QRMP Quarterly filer (July is M1 -> IFF)
          gstr1Status = 'FILED'; // IFF filed
          gstr3bStatus = 'PENDING'; // Quarterly 3B
          gstr3bArn = null;
          gstr3bDate = null;
        } else {
          // Pending
          gstr1Status = 'FILED';
          gstr3bStatus = 'PENDING';
          gstr3bArn = null;
          gstr3bDate = null;
        }
      }

      await prisma.gSTFilingStatus.create({
        data: {
          clientId: `client_${client.code}`,
          clientCode: client.code,
          clientName: client.name,
          gstin: client.gstin,
          stateCode: client.state,
          period: p.period,
          financialYear: p.fy,
          isQrmp: client.isQrmp,
          gstr1Status,
          gstr1Arn,
          gstr1FilingDate: gstr1Date,
          gstr3bStatus,
          gstr3bArn,
          gstr3bFilingDate: gstr3bDate,
          gstr2bGenerated,
          lastSyncedAt: new Date(),
        },
      });
    }
  }

  const count = await prisma.gSTFilingStatus.count();
  console.log(`Seeding complete! Inserted ${count} filing status matrix records.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
