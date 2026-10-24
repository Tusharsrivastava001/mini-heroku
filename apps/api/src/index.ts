import { createApp } from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './db/prisma.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  const app = createApp();

  await connectDatabase();

  const server = app.listen(config.PORT, () => {
    logger.info(` DeployForge API running on port ${config.PORT} [${config.NODE_ENV}]`);
    logger.info(` Public URL: ${config.API_PUBLIC_URL}`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error:', err);
  process.exit(1);
});
