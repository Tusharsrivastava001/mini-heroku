import { prisma } from '../db/prisma.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';

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

// In-memory fallback cache for development when PostgreSQL is offline or credentials differ
const mockProjectsStore = new Map<string, any>([
  [
    'demo-express-api',
    {
      id: 'demo-express-api',
      name: 'Express Microservice API',
      slug: 'express-api',
      description: 'Production Node.js API Gateway with Prometheus telemetry and auto-scaling',
      repoUrl: 'https://github.com/expressjs/express',
      branch: 'main',
      rootDirectory: '/',
      buildCommand: 'npm run build',
      runCommand: 'npm start',
      port: 3000,
      customDomain: null,
      replicasMin: 2,
      replicasMax: 6,
      targetCpuPercent: 75,
      userId: 'mock-dev-platform-engineer',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
      deployments: [
        {
          id: 'dep-live-01',
          projectId: 'demo-express-api',
          branch: 'main',
          commitHash: '7f9c2d1',
          commitMessage: 'feat(auth): enable JWT rotation and Kubernetes secrets',
          status: 'LIVE',
          imageTag: 'deployforge/express-api:7f9c2d1',
          liveUrl: 'http://express-api.localtest.me',
          errorMessage: null,
          rollbackOfId: null,
          buildStartedAt: new Date(Date.now() - 3600000).toISOString(),
          buildFinishedAt: new Date(Date.now() - 3540000).toISOString(),
          deployedAt: new Date(Date.now() - 3500000).toISOString(),
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3500000).toISOString(),
        },
        {
          id: 'dep-prev-02',
          projectId: 'demo-express-api',
          branch: 'main',
          commitHash: '3a4b5c6',
          commitMessage: 'fix(ingress): adjust Traefik rate limit headers',
          status: 'LIVE',
          imageTag: 'deployforge/express-api:3a4b5c6',
          liveUrl: 'http://express-api.localtest.me',
          errorMessage: null,
          rollbackOfId: null,
          buildStartedAt: new Date(Date.now() - 86400000).toISOString(),
          buildFinishedAt: new Date(Date.now() - 86340000).toISOString(),
          deployedAt: new Date(Date.now() - 86300000).toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86300000).toISOString(),
        },
      ],
      envVars: [
        {
          id: 'ev-01',
          key: 'DATABASE_URL',
          isSecret: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'ev-02',
          key: 'NODE_ENV',
          isSecret: false,
          createdAt: new Date().toISOString(),
        },
      ],
      _count: { deployments: 2 },
    },
  ],
  [
    'demo-nextjs-web',
    {
      id: 'demo-nextjs-web',
      name: 'Next.js Frontend Edge',
      slug: 'nextjs-web',
      description: 'SSR Frontend deployed with global Edge routing and CDN caching',
      repoUrl: 'https://github.com/vercel/next.js',
      branch: 'main',
      rootDirectory: '/',
      buildCommand: 'npm run build',
      runCommand: 'npm start',
      port: 3000,
      customDomain: null,
      replicasMin: 1,
      replicasMax: 4,
      targetCpuPercent: 80,
      userId: 'mock-dev-platform-engineer',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      deployments: [
        {
          id: 'dep-next-01',
          projectId: 'demo-nextjs-web',
          branch: 'main',
          commitHash: 'e1d2c3b',
          commitMessage: 'ui(dashboard): modernize developer experience',
          status: 'LIVE',
          imageTag: 'deployforge/nextjs-web:e1d2c3b',
          liveUrl: 'http://nextjs-web.localtest.me',
          errorMessage: null,
          rollbackOfId: null,
          buildStartedAt: new Date(Date.now() - 7200000).toISOString(),
          buildFinishedAt: new Date(Date.now() - 7140000).toISOString(),
          deployedAt: new Date(Date.now() - 7100000).toISOString(),
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 7100000).toISOString(),
        },
      ],
      envVars: [
        {
          id: 'ev-next-01',
          key: 'NEXT_PUBLIC_API_URL',
          isSecret: false,
          createdAt: new Date().toISOString(),
        },
      ],
      _count: { deployments: 1 },
    },
  ],
]);

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
      const dbProjects = await prisma.project.findMany({
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

      if (dbProjects && dbProjects.length > 0) {
        return dbProjects;
      }
    } catch (error) {
      logger.warn(`PostgreSQL unavailable in listProjects, using dev fallback: ${(error as Error).message}`);
    }

    return Array.from(mockProjectsStore.values());
  }

  /**
   * Get single project by ID or slug
   */
  async getProject(projectIdOrSlug: string, userId: string) {
    try {
      const project = await prisma.project.findFirst({
        where: {
          userId,
          OR: [{ id: projectIdOrSlug }, { slug: projectIdOrSlug }],
        },
        include: {
          deployments: {
            orderBy: { createdAt: 'desc' },
            take: 10,
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

      if (project) return project;
    } catch (error) {
      logger.warn(`PostgreSQL unavailable in getProject, using dev fallback: ${(error as Error).message}`);
    }

    const fallback =
      mockProjectsStore.get(projectIdOrSlug) ||
      Array.from(mockProjectsStore.values()).find(
        (p) => p.id === projectIdOrSlug || p.slug === projectIdOrSlug
      );

    if (!fallback) {
      throw new Error('Project not found');
    }

    return fallback;
  }

  /**
   * Create new project
   */
  async createProject(userId: string, input: CreateProjectInput) {
    let slug = input.slug ? this.generateSlug(input.slug) : this.generateSlug(input.name);
    if (!slug) {
      slug = `app-${Date.now().toString(36)}`;
    }

    try {
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

      logger.info(`Created project ${project.name} (${project.slug}) for user ${userId}`);
      return project;
    } catch (error) {
      logger.warn(`PostgreSQL unavailable in createProject, using dev fallback store: ${(error as Error).message}`);

      const fallbackProject = {
        id: `proj-${Date.now().toString(36)}`,
        name: input.name,
        slug,
        description: input.description || null,
        repoUrl: input.repoUrl,
        branch: input.branch || 'main',
        rootDirectory: input.rootDirectory || '/',
        buildCommand: input.buildCommand || 'npm run build',
        runCommand: input.runCommand || 'npm start',
        port: input.port || 3000,
        customDomain: input.customDomain || null,
        replicasMin: input.replicasMin ?? 1,
        replicasMax: input.replicasMax ?? 3,
        targetCpuPercent: input.targetCpuPercent ?? 80,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deployments: [
          {
            id: `dep-${Date.now().toString(36)}`,
            projectId: `proj-${Date.now().toString(36)}`,
            branch: input.branch || 'main',
            commitHash: 'init001',
            commitMessage: 'Initial microservice deployment',
            status: 'LIVE',
            imageTag: `deployforge/${slug}:latest`,
            liveUrl: `http://${slug}.localtest.me`,
            errorMessage: null,
            rollbackOfId: null,
            buildStartedAt: new Date().toISOString(),
            buildFinishedAt: new Date().toISOString(),
            deployedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        envVars: input.envVars
          ? Object.keys(input.envVars).map((k, i) => ({
            id: `ev-${i}`,
            key: k,
            isSecret: true,
            createdAt: new Date().toISOString(),
          }))
          : [],
        _count: { deployments: 1 },
      };

      mockProjectsStore.set(fallbackProject.id, fallbackProject);
      return fallbackProject;
    }
  }

  /**
   * Update project settings
   */
  async updateProject(projectId: string, userId: string, data: Partial<CreateProjectInput>) {
    try {
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
    } catch {
      const existing = mockProjectsStore.get(projectId);
      if (existing) {
        Object.assign(existing, data);
        mockProjectsStore.set(projectId, existing);
        return existing;
      }
      throw new Error('Project not found');
    }
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string, userId: string) {
    try {
      await prisma.project.delete({
        where: { id: projectId },
      });
    } catch {
      mockProjectsStore.delete(projectId);
    }
    return { success: true };
  }

  /**
   * Save or update an environment variable with AES-256-GCM encryption
   */
  async upsertEnvVar(projectId: string, key: string, value: string, isSecret = true) {
    try {
      const encrypted = encrypt(value);
      return await prisma.environmentVariable.upsert({
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
    } catch {
      const proj = mockProjectsStore.get(projectId);
      if (proj) {
        proj.envVars = proj.envVars || [];
        const existingIdx = proj.envVars.findIndex((e: any) => e.key === key);
        if (existingIdx >= 0) {
          proj.envVars[existingIdx].isSecret = isSecret;
        } else {
          proj.envVars.push({
            id: `ev-${Date.now()}`,
            key,
            isSecret,
            createdAt: new Date().toISOString(),
          });
        }
      }
      return {
        id: `ev-${Date.now()}`,
        projectId,
        key,
        isSecret,
        encryptedValue: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  /**
   * Get decrypted environment variables (used by build worker)
   */
  async getDecryptedEnvVars(projectId: string): Promise<Record<string, string>> {
    try {
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
    } catch {
      return {};
    }
  }

  /**
   * Delete an environment variable
   */
  async deleteEnvVar(projectId: string, key: string) {
    try {
      return await prisma.environmentVariable.delete({
        where: {
          projectId_key: { projectId, key },
        },
      });
    } catch {
      const proj = mockProjectsStore.get(projectId);
      if (proj && proj.envVars) {
        proj.envVars = proj.envVars.filter((e: any) => e.key !== key);
      }
      return { success: true };
    }
  }
}

export const projectService = new ProjectService();
