import { buildWorkerService } from './worker.js';
import { workerLogger } from './utils/logger.js';

async function main() {
  workerLogger.info(null, 'Starting DeployForge Build & Deploy Worker...');
  await buildWorkerService.start();

  const shutdown = async (signal: string) => {
    workerLogger.info(null, `Received ${signal}. Shutting down worker...`);
    await buildWorkerService.stop();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  workerLogger.error(null, `Fatal worker startup error: ${err.message}`);
  process.exit(1);
});
