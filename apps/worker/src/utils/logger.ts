export const workerLogger = {
  info: (deploymentId: string | null, message: string, ...args: any[]) => {
    const prefix = deploymentId ? `[DEPLOY:${deploymentId.substring(0, 8)}]` : '[WORKER]';
    console.log(`[INFO]  [${new Date().toISOString()}] ${prefix} ${message}`, ...args);
  },
  warn: (deploymentId: string | null, message: string, ...args: any[]) => {
    const prefix = deploymentId ? `[DEPLOY:${deploymentId.substring(0, 8)}]` : '[WORKER]';
    console.warn(`[WARN]  [${new Date().toISOString()}] ${prefix} ${message}`, ...args);
  },
  error: (deploymentId: string | null, message: string, ...args: any[]) => {
    const prefix = deploymentId ? `[DEPLOY:${deploymentId.substring(0, 8)}]` : '[WORKER]';
    console.error(`[ERROR] [${new Date().toISOString()}] ${prefix} ${message}`, ...args);
  },
};
