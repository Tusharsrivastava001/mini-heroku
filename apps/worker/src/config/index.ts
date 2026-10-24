import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const workerConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  DATABASE_URL: z.string().default('postgresql://deployforge:deployforge_secret@localhost:5432/deployforge?schema=public'),

  BASE_DOMAIN: z.string().default('localtest.me'),
  REGISTRY_URL: z.string().default('localhost:5001'),
  REGISTRY_USERNAME: z.string().optional().default(''),
  REGISTRY_PASSWORD: z.string().optional().default(''),
  REGISTRY_INSECURE: z.string().default('true'),

  WORK_DIR: z.string().default(path.resolve(process.cwd(), '.tmp/builds')),
  KUBECONFIG_PATH: z.string().optional(),
  K8S_DEFAULT_INGRESS_CLASS: z.string().default('traefik'),
  K8S_CLUSTER_ISSUER: z.string().default('letsencrypt-prod'),

  BUILD_TIMEOUT_SECONDS: z.coerce.number().default(600), // 10 minutes
  DEPLOY_TIMEOUT_SECONDS: z.coerce.number().default(180), // 3 minutes
});

const parsed = workerConfigSchema.safeParse(process.cwd() ? process.env : {});

if (!parsed.success) {
  console.error('❌ Invalid worker environment configuration:', parsed.error.format());
  process.exit(1);
}

export const workerConfig = parsed.data;
export type WorkerConfig = z.infer<typeof workerConfigSchema>;
