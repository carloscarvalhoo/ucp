import 'server-only';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import './services-env';
const globalPrisma = globalThis as unknown as { ucpPrisma?: PrismaClient };
export const prisma =
  globalPrisma.ucpPrisma ??
  new PrismaClient({
    adapter: new PrismaMariaDb({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT || 3307),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      connectionLimit: 5,
    }),
  });
if (process.env.NODE_ENV !== 'production') globalPrisma.ucpPrisma = prisma;
