import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { authRoutes } from './routes/auth.routes.js';
import { projectRoutes } from './routes/project.routes.js';
import { deploymentRoutes } from './routes/deployment.routes.js';
import { webhookRoutes } from './routes/webhook.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { metricsRoutes, httpRequestsTotal } from './routes/metrics.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { config } from './config/index.js';

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allow SSE and SPA dashboard calls
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS
  app.use(
    cors({
      origin: [config.DASHBOARD_PUBLIC_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-hub-signature-256'],
    })
  );

  // Preserve raw buffer for GitHub webhook verification
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  // Logging
  if (config.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Request counter metric
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      const route = req.route ? req.route.path : req.path;
      httpRequestsTotal.inc({
        method: req.method,
        route,
        status_code: res.statusCode.toString(),
      });
    });
    next();
  });

  // Base API Router
  app.use('/api/health', healthRoutes);
  app.use('/api/metrics', metricsRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api', deploymentRoutes);
  app.use('/api/webhooks', webhookRoutes);

  // Root welcome
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'DeployForge API',
      version: '1.0.0',
      status: 'operational',
      docs: '/api/health',
    });
  });

  // Central error handling
  app.use(errorHandler);

  return app;
}
