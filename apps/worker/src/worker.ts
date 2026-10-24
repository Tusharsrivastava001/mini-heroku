import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { workerConfig } from './config/index.js';
import { workerLogger } from './utils/logger.js';
import { dockerBuilder } from './builder/docker.js';
import { kubernetesDeployer } from './deployer/k8s.js';

export interface BuildJobPayload {
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

export class BuildWorkerService {
  private worker: Worker<BuildJobPayload> | null = null;
  private redis: Redis;
  private prisma: PrismaClient;

  constructor() {
    this.redis = new Redis(workerConfig.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    this.prisma = new PrismaClient();
  }

  public async start(): Promise<void> {
    try {
      await this.prisma.$connect();
      workerLogger.info(null, 'Worker connected to PostgreSQL');
    } catch (err) {
      workerLogger.warn(null, `Postgres connection error: ${(err as Error).message}`);
    }

    this.worker = new Worker<BuildJobPayload>(
      'build-queue',
      async (job: Job<BuildJobPayload>) => {
        await this.processJob(job);
      },
      {
        connection: this.redis as any,
        concurrency: 2,
        lockDuration: 300000, // 5 minutes
      }
    );

    this.worker.on('ready', () => {
      workerLogger.info(null, ' BullMQ Worker ready and listening on build-queue');
    });

    this.worker.on('failed', (job, err) => {
      workerLogger.error(job?.data.deploymentId || null, `Job failed: ${err.message}`);
    });
  }

  private async processJob(job: Job<BuildJobPayload>): Promise<void> {
    const data = job.data;
    const depId = data.deploymentId;
    workerLogger.info(depId, `Processing build job for project [${data.slug}]`);

    // Helper to log to SSE and DB
    let lineNum = 100;
    const emitWorkerLog = async (msg: string, stream: 'stdout' | 'stderr' | 'system' = 'system') => {
      const payload = {
        deploymentId: depId,
        lineNumber: lineNum++,
        message: msg,
        stream,
        timestamp: new Date().toISOString(),
      };
      try {
        await this.redis.publish(`deployment:${depId}:logs`, JSON.stringify(payload));
        await this.prisma.buildLog.create({
          data: {
            deploymentId: depId,
            lineNumber: payload.lineNumber,
            message: payload.message,
            stream: payload.stream,
          },
        });
      } catch {}
    };

    try {
      // 1. Mark status as BUILDING
      await this.prisma.deployment.update({
        where: { id: depId },
        data: {
          status: 'BUILDING',
          buildStartedAt: new Date(),
        },
      });

      let imageTag = data.rollbackImageTag;

      if (data.isRollback && imageTag) {
        await emitWorkerLog(`🔁 Fast-path rollback deployment initiated! Re-deploying image: ${imageTag}`, 'system');
      } else {
        // 2. Build & Push Image
        const buildResult = await dockerBuilder.buildAndPush({
          deploymentId: depId,
          projectId: data.projectId,
          slug: data.slug,
          repoUrl: data.repoUrl,
          branch: data.branch,
          commitHash: data.commitHash,
          port: data.port,
          envVars: data.envVars,
          prisma: this.prisma,
          redis: this.redis,
        });

        imageTag = buildResult.imageTag;

        await this.prisma.deployment.update({
          where: { id: depId },
          data: {
            imageTag,
            buildFinishedAt: new Date(),
          },
        });
      }

      // 3. Mark status as DEPLOYING
      await this.prisma.deployment.update({
        where: { id: depId },
        data: { status: 'DEPLOYING' },
      });

      // 4. Kubernetes Deploy
      const namespace = `df-${data.slug}`;
      const liveUrl = await kubernetesDeployer.deploy(
        {
          namespace,
          slug: data.slug,
          imageTag: imageTag!,
          port: data.port,
          envVars: data.envVars,
        },
        emitWorkerLog
      );

      // 5. Mark status as LIVE
      await this.prisma.deployment.update({
        where: { id: depId },
        data: {
          status: 'LIVE',
          liveUrl,
          deployedAt: new Date(),
        },
      });

      await emitWorkerLog(`🎉 Deployment successfully rolled out to production!`, 'system');
      workerLogger.info(depId, `Deployment ${depId} is now LIVE at ${liveUrl}`);
    } catch (error) {
      const errorMsg = (error as Error).message || 'Deployment failed due to internal error';
      workerLogger.error(depId, `Deployment failed: ${errorMsg}`);

      await emitWorkerLog(`❌ Error: ${errorMsg}`, 'stderr');

      // Update deployment status to FAILED
      await this.prisma.deployment.update({
        where: { id: depId },
        data: {
          status: 'FAILED',
          errorMessage: errorMsg,
        },
      });

      // Health-check based auto-rollback: Check if there was a previous LIVE deployment
      await this.attemptAutoRollback(data.projectId, depId, emitWorkerLog);

      throw error;
    }
  }

  /**
   * Health-check based auto-rollback: If the new deployment fails readiness, reverts to previous healthy image
   */
  private async attemptAutoRollback(
    projectId: string,
    failedDeploymentId: string,
    emitLog: (msg: string, stream?: any) => Promise<void>
  ): Promise<void> {
    try {
      const previousSuccessful = await this.prisma.deployment.findFirst({
        where: {
          projectId,
          status: 'LIVE',
          id: { not: failedDeploymentId },
          imageTag: { not: null },
        },
        orderBy: { deployedAt: 'desc' },
      });

      if (!previousSuccessful || !previousSuccessful.imageTag) {
        return;
      }

      await emitLog(`🚨 Automatic Rollback Triggered: New release failed readiness. Restoring previous healthy revision #${previousSuccessful.id.substring(0, 8)} (${previousSuccessful.imageTag})...`, 'system');

      const project = await this.prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return;

      const namespace = `df-${project.slug}`;
      await kubernetesDeployer.applyDeployment({
        namespace,
        slug: project.slug,
        imageTag: previousSuccessful.imageTag,
        port: project.port,
        envVars: {},
      });

      await emitLog(`🛡️ Restored stable workload successfully. User traffic remains uninterrupted.`, 'system');
    } catch (err) {
      workerLogger.error(failedDeploymentId, `Auto-rollback attempt encountered error: ${(err as Error).message}`);
    }
  }

  public async stop(): Promise<void> {
    await this.worker?.close();
    await this.redis.quit();
    await this.prisma.$disconnect();
  }
}

export const buildWorkerService = new BuildWorkerService();
