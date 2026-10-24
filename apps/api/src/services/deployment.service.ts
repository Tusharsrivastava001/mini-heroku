import { prisma } from '../db/prisma.js';
import { enqueueBuild } from './queue.service.js';
import { projectService } from './project.service.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export interface TriggerDeployOptions {
  commitHash?: string;
  commitMessage?: string;
  branch?: string;
}

export class DeploymentService {
  /**
   * Trigger a new build & deployment for a project
   */
  async triggerDeployment(projectId: string, userId: string, options?: TriggerDeployOptions) {
    const project = await projectService.getProject(projectId, userId);
    const branch = options?.branch || project.branch || 'main';

    const deployment = await prisma.deployment.create({
      data: {
        projectId: project.id,
        branch,
        commitHash: options?.commitHash,
        commitMessage: options?.commitMessage || 'Manual deployment triggered from dashboard',
        status: 'QUEUED',
      },
    });

    // Decrypt env vars for build process
    const envVars = await projectService.getDecryptedEnvVars(project.id);

    // Enqueue build job into BullMQ
    await enqueueBuild({
      deploymentId: deployment.id,
      projectId: project.id,
      repoUrl: project.repoUrl,
      branch,
      commitHash: options?.commitHash,
      buildCommand: project.buildCommand || undefined,
      runCommand: project.runCommand || undefined,
      port: project.port,
      slug: project.slug,
      envVars,
    });

    await prisma.auditLog.create({
      data: {
        userId,
        projectId: project.id,
        action: 'DEPLOY_TRIGGERED',
        details: { deploymentId: deployment.id, branch },
      },
    });

    logger.info(`Deployment ${deployment.id} queued for project ${project.slug}`);
    return deployment;
  }

  /**
   * Trigger an instant rollback to a previous successful deployment
   */
  async triggerRollback(targetDeploymentId: string, userId: string) {
    const target = await prisma.deployment.findUnique({
      where: { id: targetDeploymentId },
      include: { project: true },
    });

    if (!target) {
      throw new Error('Target deployment for rollback does not exist');
    }

    if (target.project.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (!target.imageTag) {
      throw new Error('Cannot rollback to a deployment without a valid built image');
    }

    // Create a new deployment referencing the target
    const rollbackDeployment = await prisma.deployment.create({
      data: {
        projectId: target.projectId,
        branch: target.branch,
        commitHash: target.commitHash,
        commitMessage: `Rollback to deployment #${target.id.substring(0, 8)} (${target.commitMessage || 'previous revision'})`,
        status: 'QUEUED',
        imageTag: target.imageTag,
        rollbackOfId: target.id,
      },
    });

    const envVars = await projectService.getDecryptedEnvVars(target.projectId);

    // Enqueue job with isRollback flag
    await enqueueBuild({
      deploymentId: rollbackDeployment.id,
      projectId: target.projectId,
      repoUrl: target.project.repoUrl,
      branch: target.branch,
      port: target.project.port,
      slug: target.project.slug,
      envVars,
      isRollback: true,
      rollbackImageTag: target.imageTag,
    });

    await prisma.auditLog.create({
      data: {
        userId,
        projectId: target.projectId,
        action: 'ROLLBACK_TRIGGERED',
        details: {
          newDeploymentId: rollbackDeployment.id,
          targetDeploymentId: target.id,
          imageTag: target.imageTag,
        },
      },
    });

    logger.info(`Rollback deployment ${rollbackDeployment.id} queued for project ${target.project.slug}`);
    return rollbackDeployment;
  }

  /**
   * List deployment history for a project
   */
  async listProjectDeployments(projectId: string, userId: string, limit = 20) {
    await projectService.getProject(projectId, userId); // check ownership

    return prisma.deployment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        rollbackOf: {
          select: { id: true, commitHash: true, commitMessage: true },
        },
      },
    });
  }

  /**
   * Get single deployment status and info
   */
  async getDeployment(deploymentId: string, userId: string) {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        project: {
          select: { id: true, name: true, slug: true, userId: true },
        },
        rollbackOf: true,
      },
    });

    if (!deployment || deployment.project.userId !== userId) {
      throw new Error('Deployment not found');
    }

    return deployment;
  }

  /**
   * Fetch all logs for a deployment
   */
  async getDeploymentLogs(deploymentId: string, userId: string) {
    await this.getDeployment(deploymentId, userId); // verify authorization

    return prisma.buildLog.findMany({
      where: { deploymentId },
      orderBy: { lineNumber: 'asc' },
    });
  }
}

export const deploymentService = new DeploymentService();
