import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { getRedisConnection } from '../services/queue.service.js';

const router = Router();

function withTimeout<T>(promise: Promise<T>, timeoutMs = 1000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs)),
  ]);
}

router.get('/', async (req: Request, res: Response) => {
  const health: Record<string, any> = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      api: 'UP',
      database: 'UNKNOWN',
      redis: 'UNKNOWN',
    },
  };

  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, 800);
    health.services.database = 'UP';
  } catch {
    health.services.database = 'DOWN';
    health.status = 'degraded';
  }

  try {
    const redis = getRedisConnection();
    await withTimeout(redis.ping(), 800);
    health.services.redis = 'UP';
  } catch {
    health.services.redis = 'DOWN';
    health.status = 'degraded';
  }

  // Degraded or healthy is still an operational 200 response with health details
  res.status(200).json(health);
});

export const healthRoutes = router;
