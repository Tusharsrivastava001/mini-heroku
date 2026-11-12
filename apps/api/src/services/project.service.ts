import { prisma } from '../db/prisma.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export interface CreateProjectInput {
  name: string;
  slug?: string;
  description?: string;
  repoUrl: string;
  branch?: string;
  rootDirectory?: string;
  buildCommand?: string;
  runCommand?: string;
  port?: number;
  customDomain?: string;
  replicasMin?: number;
  replicasMax?: number;
  targetCpuPercent?: number;
  envVars?: Record<string, string>;
}

export class ProjectService {
  /**
   * Generates a safe DNS/K8s-compliant slug from project name
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 48);
  }

  /**
   * List all projects owned by a user
   */
  async listProjects(userId: string) {
    try {
      return await prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          deployments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              status: true,
              commitHash: true,
              commitMessage: true,
              liveUrl: true,
              createdAt: true,
              deployedAt: true,
            },
          },
          _count: {
            select: { deployments: true },
          },
        },
      });
    } catch (error) {
      logger.warn(`PostgreSQL query failed in listProjects: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Get single project by ID or slug
   */
  async getProject(projectIdOrSlug: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: {
        userId,
        OR: [{ id: projectIdOrSlug }, { slug: projectIdOrSlug }],
      },
      include: {
        deployments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        envVars: {
          select: {
            id: true,
            key: true,
            isSecret: true,
            createdAt: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  }

  /**
   * Create new project
   */
  async createProject(userId: string, input: CreateProjectInput) {
    let slug = input.slug ? this.generateSlug(input.slug) : this.generateSlug(input.name);
    if (!slug) {
      slug = `app-${Date.now().toString(36)}`;
    }

    // Ensure slug uniqueness
    const existing = await prisma.project.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const project = await prisma.project.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        repoUrl: input.repoUrl,
        branch: input.branch || 'main',
        rootDirectory: input.rootDirectory || '/',
        buildCommand: input.buildCommand,
        runCommand: input.runCommand,
        port: input.port || 3000,
        customDomain: input.customDomain,
        replicasMin: input.replicasMin ?? 1,
        replicasMax: input.replicasMax ?? 3,
        targetCpuPercent: input.targetCpuPercent ?? 80,
        userId,
      },
    });

    // Save initial environment variables if provided
    if (input.envVars && Object.keys(input.envVars).length > 0) {
      for (const [key, val] of Object.entries(input.envVars)) {
        await this.upsertEnvVar(project.id, key, val);
      }
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId,
        projectId: project.id,
        action: 'PROJECT_CREATED',
        details: { name: project.name, slug: project.slug },
      },
    });

    logger.info(`Created project ${project.name} (${project.slug}) for user ${userId}`);
    return project;
  }

  /**
   * Update project settings
   */
  async updateProject(projectId: string, userId: string, data: Partial<CreateProjectInput>) {
    await this.getProject(projectId, userId); // check ownership

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: data.name,
        description: data.description,
        branch: data.branch,
        rootDirectory: data.rootDirectory,
        buildCommand: data.buildCommand,
        runCommand: data.runCommand,
        port: data.port,
        customDomain: data.customDomain,
        replicasMin: data.replicasMin,
        replicasMax: data.replicasMax,
        targetCpuPercent: data.targetCpuPercent,
      },
    });

    return updated;
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string, userId: string) {
    const project = await this.getProject(projectId, userId);

    await prisma.auditLog.create({
      data: {
        userId,
        projectId,
        action: 'PROJECT_DELETED',
        details: { slug: project.slug },
      },
    });

    await prisma.project.delete({
      where: { id: projectId },
    });

    logger.info(`Deleted project ${project.slug}`);
    return { success: true, slug: project.slug };
  }

  /**
   * Save or update an environment variable with AES-256-GCM encryption
   */
  async upsertEnvVar(projectId: string, key: string, value: string, isSecret = true) {
    const encrypted = encrypt(value);
    return prisma.environmentVariable.upsert({
      where: {
        projectId_key: { projectId, key },
      },
      update: {
        encryptedValue: encrypted,
        isSecret,
      },
      create: {
        projectId,
        key,
        encryptedValue: encrypted,
        isSecret,
      },
    });
  }

  /**
   * Get decrypted environment variables (used by build worker)
   */
  async getDecryptedEnvVars(projectId: string): Promise<Record<string, string>> {
    const records = await prisma.environmentVariable.findMany({
      where: { projectId },
    });

    const result: Record<string, string> = {};
    for (const record of records) {
      try {
        result[record.key] = decrypt(record.encryptedValue);
      } catch (err) {
        logger.error(`Failed to decrypt env var ${record.key} for project ${projectId}`);
      }
    }
    return result;
  }

  /**
   * Delete an environment variable
   */
  async deleteEnvVar(projectId: string, key: string) {
    return prisma.environmentVariable.delete({
      where: {
        projectId_key: { projectId, key },
      },
    });
  }
}

export const projectService = new ProjectService();
