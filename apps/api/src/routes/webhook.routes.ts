import { Router, Request, Response, NextFunction } from 'express';
import { webhookService } from '../services/webhook.service.js';
import { logger } from '../utils/logger.js';

const router = Router();

// GitHub Webhook listener
router.post('/github', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const event = req.headers['x-github-event'] as string | undefined;

    if (event === 'ping') {
      res.status(200).json({ message: 'PONG! GitHub Webhook configured successfully.' });
      return;
    }

    if (event !== 'push') {
      res.status(200).json({ message: `Ignoring event ${event}` });
      return;
    }

    // Pass body (or rawBody if buffered)
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const result = await webhookService.handlePushEvent(rawBody, signature, req.body);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  } catch (error) {
    logger.error('Webhook error:', (error as Error).message);
    res.status(400).json({ error: (error as Error).message });
  }
});

export const webhookRoutes = router;
