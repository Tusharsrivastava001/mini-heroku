import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { workerConfig } from '../config/index.js';
import { workerLogger } from '../utils/logger.js';
import { detectProject } from './detector.js';

export interface BuildOptions {
  deploymentId: string;
  projectId: string;
  slug: string;
  repoUrl: string;
  branch: string;
  commitHash?: string;
  port: number;
  envVars: Record<string, string>;
  prisma: PrismaClient;
  redis: Redis;
}

export class DockerBuilder {
  /**
   * Clones repository, detects/generates Dockerfile, builds container image, streams logs, pushes to registry
   */
  async buildAndPush(opts: BuildOptions): Promise<{ imageTag: string; buildDurationMs: number }> {
    const startTime = Date.now();
    const shortId = opts.deploymentId.substring(0, 8);
    const targetDir = path.join(workerConfig.WORK_DIR, `${opts.slug}-${shortId}`);
    const imageTag = `${workerConfig.REGISTRY_URL}/${opts.slug}:${shortId}`;
    let lineNumber = 1;

    // Helper to emit and persist log line
    const emitLog = async (message: string, stream: 'stdout' | 'stderr' | 'system' = 'stdout') => {
      const timestamp = new Date();
      const payload = {
        deploymentId: opts.deploymentId,
        lineNumber: lineNumber++,
        message,
        stream,
        timestamp: timestamp.toISOString(),
      };

      // 1. Publish to Redis for SSE live stream
      try {
        await opts.redis.publish(`deployment:${opts.deploymentId}:logs`, JSON.stringify(payload));
      } catch (err) {
        // non-blocking
      }

      // 2. Persist to PostgreSQL BuildLog table
      try {
        await opts.prisma.buildLog.create({
          data: {
            deploymentId: opts.deploymentId,
            lineNumber: payload.lineNumber,
            message: payload.message,
            stream: payload.stream,
            timestamp,
          },
        });
      } catch (err) {
        // non-blocking
      }
    };

    try {
      await emitLog(`🚀 Initializing DeployForge build worker for [${opts.slug}]...`, 'system');
      await emitLog(`📌 Target image: ${imageTag}`, 'system');

      // 1. Clean and prepare working directory
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
      }
      fs.mkdirSync(targetDir, { recursive: true });

      // 2. Clone Git repository
      await emitLog(`📥 Cloning repository: ${opts.repoUrl} (branch: ${opts.branch})...`, 'system');
      await this.runCommand('git', ['clone', '--depth', '1', '-b', opts.branch, opts.repoUrl, targetDir], emitLog);

      // 3. Detect or synthesize Dockerfile
      await emitLog(`🔍 Analyzing repository structure...`, 'system');
      const detection = detectProject(targetDir, opts.port);

      if (detection.hasDockerfile) {
        await emitLog(`✅ Found existing Dockerfile at ${detection.dockerfilePath}`, 'system');
      } else if (detection.generatedDockerfile) {
        await emitLog(`✨ No Dockerfile found. Auto-synthesized ${detection.projectType.toUpperCase()} buildpack!`, 'system');
        fs.writeFileSync(path.join(targetDir, 'Dockerfile'), detection.generatedDockerfile, 'utf-8');
      } else {
        throw new Error('Unsupported repository structure. No Dockerfile found and auto-detection could not determine runtime.');
      }

      // 4. Docker Build
      await emitLog(`🔨 Compiling container image with Docker engine...`, 'system');
      await this.runCommand(
        'docker',
        ['build', '-t', imageTag, '-f', path.join(targetDir, 'Dockerfile'), targetDir],
        emitLog
      );

      // 5. Docker Push to Registry
      if (workerConfig.REGISTRY_URL && !workerConfig.REGISTRY_URL.includes('localtest.me')) {
        await emitLog(`📤 Pushing container image to registry ${workerConfig.REGISTRY_URL}...`, 'system');
        try {
          await this.runCommand('docker', ['push', imageTag], emitLog);
          await emitLog(`✅ Image successfully pushed to ${imageTag}`, 'system');
        } catch (pushErr) {
          await emitLog(`⚠️ Registry push warning: ${(pushErr as Error).message}. Proceeding with local image daemon cache.`, 'system');
        }
      }

      const buildDurationMs = Date.now() - startTime;
      await emitLog(`🎉 Build succeeded in ${(buildDurationMs / 1000).toFixed(1)}s!`, 'system');

      return { imageTag, buildDurationMs };
    } finally {
      // Cleanup temporary build files
      try {
        if (fs.existsSync(targetDir)) {
          fs.rmSync(targetDir, { recursive: true, force: true });
        }
      } catch (cleanupErr) {
        workerLogger.warn(opts.deploymentId, `Failed to clean workspace directory: ${(cleanupErr as Error).message}`);
      }
    }
  }

  /**
   * Helper to spawn process and stream stdout/stderr line-by-line
   */
  private runCommand(
    command: string,
    args: string[],
    emitLog: (msg: string, stream?: 'stdout' | 'stderr' | 'system') => Promise<void>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { shell: true });

      child.stdout.on('data', async (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            await emitLog(line.trimEnd(), 'stdout');
          }
        }
      });

      child.stderr.on('data', async (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            await emitLog(line.trimEnd(), 'stderr');
          }
        }
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command '${command} ${args.join(' ')}' exited with code ${code}`));
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
  }
}

export const dockerBuilder = new DockerBuilder();
