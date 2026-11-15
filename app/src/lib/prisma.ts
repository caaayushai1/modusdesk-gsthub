import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/dev.db';
  const prismaDir = path.join(process.cwd(), 'prisma');
  const sourceDb = path.join(prismaDir, 'dev.db');
  
  try {
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(sourceDb)) {
      fs.copyFileSync(sourceDb, tmpDbPath);
    }
  } catch {}
  process.env.DATABASE_URL = `file:${tmpDbPath}`;
} else if (!process.env.DATABASE_URL) {
  const localDb = path.join(process.cwd(), 'prisma', 'dev.db');
  process.env.DATABASE_URL = `file:${localDb}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
