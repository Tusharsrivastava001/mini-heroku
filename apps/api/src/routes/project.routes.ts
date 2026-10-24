import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { projectService } from '../services/project.service.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const createProjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(64),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and dashes').optional(),
  description: z.string().max(255).optional(),
  repoUrl: z.string().url('Must be a valid Git URL or GitHub URL'),
  branch: z.string().default('main'),
  rootDirectory: z.string().default('/'),
  buildCommand: z.string().optional(),
  runCommand: z.string().optional(),
  port: z.coerce.number().int().min(1).max(65535).default(3000),
  customDomain: z.string().optional(),
  replicasMin: z.coerce.number().int().min(1).max(10).default(1),
  replicasMax: z.coerce.number().int().min(1).max(20).default(3),
  targetCpuPercent: z.coerce.number().int().min(10).max(100).default(80),
  envVars: z.record(z.string()).optional(),
});

const updateProjectSchema = createProjectSchema.partial();

const envVarUpsertSchema = z.object({
  key: z.string().regex(/^[A-Z0-9_]+$/, 'Environment variable key must be uppercase alphanumeric and underscores'),
  value: z.string(),
  isSecret: z.boolean().default(true),
});

// List all user projects
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await projectService.listProjects(req.user!.userId);
    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

// Create a project
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createProjectSchema.parse(req.body);
    const project = await projectService.createProject(req.user!.userId, validated);
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

// Get a single project
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.getProject(req.params.id, req.user!.userId);
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// Update project settings
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = updateProjectSchema.parse(req.body);
    const updated = await projectService.updateProject(req.params.id, req.user!.userId, validated);
    res.json({ project: updated });
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await projectService.deleteProject(req.params.id, req.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Set an environment variable
router.put('/:id/env', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = envVarUpsertSchema.parse(req.body);
    await projectService.getProject(req.params.id, req.user!.userId); // verify ownership
    const envVar = await projectService.upsertEnvVar(
      req.params.id,
      validated.key,
      validated.value,
      validated.isSecret
    );
    res.json({
      envVar: {
        id: envVar.id,
        key: envVar.key,
        isSecret: envVar.isSecret,
        createdAt: envVar.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete an environment variable
router.delete('/:id/env/:key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await projectService.getProject(req.params.id, req.user!.userId);
    await projectService.deleteEnvVar(req.params.id, req.params.key);
    res.json({ message: 'Environment variable deleted' });
  } catch (error) {
    next(error);
  }
});

export const projectRoutes = router;
