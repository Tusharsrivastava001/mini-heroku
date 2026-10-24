import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { deploymentService } from '../services/deployment.service.js';
import { sseLogStreamer } from '../services/sse.service.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const triggerDeploySchema = z.object({
  branch: z.string().optional(),
  commitHash: z.string().optional(),
  commitMessage: z.string().optional(),
});

// Trigger new deployment for a project
router.post('/projects/:projectId/deploy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = triggerDeploySchema.parse(req.body);
    const deployment = await deploymentService.triggerDeployment(
      req.params.projectId,
      req.user!.userId,
      validated
    );
    res.status(202).json({ deployment });
  } catch (error) {
    next(error);
  }
});

// List deployment history for a project
router.get('/projects/:projectId/deployments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const deployments = await deploymentService.listProjectDeployments(
      req.params.projectId,
      req.user!.userId,
      limit
    );
    res.json({ deployments });
  } catch (error) {
    next(error);
  }
});

// Get single deployment
router.get('/deployments/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deployment = await deploymentService.getDeployment(req.params.id, req.user!.userId);
    res.json({ deployment });
  } catch (error) {
    next(error);
  }
});

// Rollback to this deployment
router.post('/deployments/:id/rollback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rollback = await deploymentService.triggerRollback(req.params.id, req.user!.userId);
    res.status(202).json({ deployment: rollback });
  } catch (error) {
    next(error);
  }
});

// Get historical logs for deployment
router.get('/deployments/:id/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await deploymentService.getDeploymentLogs(req.params.id, req.user!.userId);
    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

// Real-time SSE stream of logs
router.get('/deployments/:id/logs/stream', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deploymentService.getDeployment(req.params.id, req.user!.userId); // verify authorization
    await sseLogStreamer.subscribeDeployment(req.params.id, res);
  } catch (error) {
    next(error);
  }
});

export const deploymentRoutes = router;
