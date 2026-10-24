import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

declare global {
  // Allow global prisma caching in development
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export async function connectDatabase(): Promise<boolean> {
  try {
    await prisma.$connect();
    logger.info(' Connected to PostgreSQL database');
    return true;
  } catch (error) {
    logger.warn(' PostgreSQL connection failed or skipped (in-memory/mock fallback available for tests):', (error as Error).message);
    return false;
  }
}
