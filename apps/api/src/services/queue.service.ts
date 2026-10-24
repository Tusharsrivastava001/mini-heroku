import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export interface BuildJobData {
  deploymentId: string;
  projectId: string;
  repoUrl: string;
  branch: string;
  commitHash?: string;
  buildCommand?: string;
  runCommand?: string;
  port: number;
  slug: string;
  envVars: Record<string, string>;
  isRollback?: boolean;
  rollbackImageTag?: string;
}

let redisConnection: Redis | null = null;
let buildQueue: Queue<BuildJobData> | null = null;

export function getRedisConnection(): Redis {
  if (!redisConnection) {
    redisConnection = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy(times) {
        // Linear backoff with max 5s
        return Math.min(times * 200, 5000);
      },
    });

    redisConnection.on('error', (err) => {
      logger.warn(`Redis connection error: ${err.message}`);
    });
  }
  return redisConnection;
}

export function getBuildQueue(): Queue<BuildJobData> {
  if (!buildQueue) {
    const connection = getRedisConnection();
    buildQueue = new Queue<BuildJobData>('build-queue', {
      connection: connection as any,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }
  return buildQueue;
}

export async function enqueueBuild(data: BuildJobData): Promise<string> {
  try {
    const queue = getBuildQueue();
    const job = await queue.add(`build-${data.deploymentId}`, data, {
      jobId: data.deploymentId,
    });
    logger.info(` Enqueued build job ${job.id} for deployment ${data.deploymentId}`);
    return job.id ?? data.deploymentId;
  } catch (error) {
    logger.error(`Failed to enqueue build job: ${(error as Error).message}`);
    throw error;
  }
}
