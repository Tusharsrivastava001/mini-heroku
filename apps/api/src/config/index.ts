import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or local app dir
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  BASE_DOMAIN: z.string().default('localtest.me'),
  API_PUBLIC_URL: z.string().default('http://localhost:4000'),
  DASHBOARD_PUBLIC_URL: z.string().default('http://localhost:3000'),

  JWT_SECRET: z.string().default('deployforge_dev_jwt_secret_change_in_production_min32chars'),
  SESSION_EXPIRES_IN: z.string().default('7d'),
  ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),

  DATABASE_URL: z.string().default('postgresql://deployforge:deployforge_secret@localhost:5432/deployforge?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  GITHUB_CLIENT_ID: z.string().optional().default('dummy_github_client_id'),
  GITHUB_CLIENT_SECRET: z.string().optional().default('dummy_github_client_secret'),
  GITHUB_WEBHOOK_SECRET: z.string().optional().default('dummy_github_webhook_secret'),

  REGISTRY_URL: z.string().default('localhost:5001'),
  REGISTRY_USERNAME: z.string().optional().default(''),
  REGISTRY_PASSWORD: z.string().optional().default(''),
  REGISTRY_INSECURE: z.string().default('true'),

  K8S_DEFAULT_INGRESS_CLASS: z.string().default('traefik'),
  K8S_CLUSTER_ISSUER: z.string().default('letsencrypt-prod'),
  LOKI_URL: z.string().default('http://localhost:3100'),
  PROMETHEUS_URL: z.string().default('http://localhost:9090'),
});

const parsed = configSchema.safeParse(process.cwd() ? process.env : {});

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
export type Config = z.infer<typeof configSchema>;
