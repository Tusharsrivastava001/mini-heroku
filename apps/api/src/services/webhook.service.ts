import { prisma } from '../db/prisma.js';
import { deploymentService } from './deployment.service.js';
import { verifyGitHubWebhookSignature } from '../utils/crypto.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export interface GitHubPushPayload {
  ref: string;
  after: string;
  head_commit?: {
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
  };
  repository: {
    name: string;
    full_name: string;
    html_url: string;
    clone_url: string;
    ssh_url: string;
  };
}

export class WebhookService {
  /**
   * Process incoming GitHub Webhook push event
   */
  async handlePushEvent(
    rawBody: Buffer | string,
    signatureHeader: string | undefined,
    payload: GitHubPushPayload
  ) {
    // 1. Verify HMAC-SHA256 signature if secret is configured
    if (config.GITHUB_WEBHOOK_SECRET && config.GITHUB_WEBHOOK_SECRET !== 'dummy_github_webhook_secret') {
      const isValid = verifyGitHubWebhookSignature(
        rawBody,
        signatureHeader,
        config.GITHUB_WEBHOOK_SECRET
      );

      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }
    }

    const branch = payload.ref.replace('refs/heads/', '');
    const repoUrl = payload.repository.clone_url || payload.repository.html_url;

    logger.info(`Received GitHub push event for repo ${payload.repository.full_name} on branch ${branch}`);

    // 2. Find matching projects matching repoUrl or full_name
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { repoUrl: { contains: payload.repository.full_name } },
          { repoUrl: repoUrl },
        ],
        branch,
      },
    });

    if (projects.length === 0) {
      logger.info(`No matching projects found for repo ${payload.repository.full_name} and branch ${branch}`);
      return { triggered: 0 };
    }

    const triggeredDeployments = [];

    for (const project of projects) {
      try {
        const deployment = await deploymentService.triggerDeployment(
          project.id,
          project.userId,
          {
            branch,
            commitHash: payload.after || payload.head_commit?.id,
            commitMessage: payload.head_commit?.message || `Webhook push to ${branch}`,
          }
        );
        triggeredDeployments.push(deployment.id);
      } catch (err) {
        logger.error(`Failed to trigger webhook deployment for project ${project.id}: ${(err as Error).message}`);
      }
    }

    return {
      triggered: triggeredDeployments.length,
      deployments: triggeredDeployments,
    };
  }
}

export const webhookService = new WebhookService();
