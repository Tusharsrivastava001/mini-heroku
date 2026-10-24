import { Response } from 'express';
import Redis from 'ioredis';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class SseLogStreamer {
  private subscriber: Redis | null = null;
  private activeStreams: Map<string, Set<Response>> = new Map();

  private getSubscriber(): Redis {
    if (!this.subscriber) {
      this.subscriber = new Redis(config.REDIS_URL, {
        lazyConnect: true,
      });

      this.subscriber.on('message', (channel, message) => {
        // Channel format: deployment:<deploymentId>:logs
        const parts = channel.split(':');
        if (parts.length >= 3) {
          const deploymentId = parts[1];
          this.broadcast(deploymentId, message);
        }
      });
    }
    return this.subscriber;
  }

  public async subscribeDeployment(deploymentId: string, res: Response) {
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering (Nginx/Traefik)
    res.flushHeaders?.();

    if (!this.activeStreams.has(deploymentId)) {
      this.activeStreams.set(deploymentId, new Set());
      try {
        const sub = this.getSubscriber();
        await sub.subscribe(`deployment:${deploymentId}:logs`);
      } catch (err) {
        logger.warn(`Could not subscribe to Redis pubsub channel for ${deploymentId}: ${(err as Error).message}`);
      }
    }

    this.activeStreams.get(deploymentId)!.add(res);

    // Initial greeting event
    res.write(`event: connected\ndata: ${JSON.stringify({ deploymentId, timestamp: new Date().toISOString() })}\n\n`);

    // Keepalive ping every 15s to prevent HTTP timeouts
    const pingInterval = setInterval(() => {
      res.write(': ping\n\n');
    }, 15000);

    // Cleanup on client disconnect
    res.on('close', async () => {
      clearInterval(pingInterval);
      const clients = this.activeStreams.get(deploymentId);
      if (clients) {
        clients.delete(res);
        if (clients.size === 0) {
          this.activeStreams.delete(deploymentId);
          try {
            await this.subscriber?.unsubscribe(`deployment:${deploymentId}:logs`);
          } catch {
            // ignore
          }
        }
      }
    });
  }

  public broadcast(deploymentId: string, payload: string) {
    const clients = this.activeStreams.get(deploymentId);
    if (!clients || clients.size === 0) return;

    for (const client of clients) {
      client.write(`event: log\ndata: ${payload}\n\n`);
    }
  }

  public broadcastEvent(deploymentId: string, eventName: string, data: any) {
    const clients = this.activeStreams.get(deploymentId);
    if (!clients || clients.size === 0) return;

    for (const client of clients) {
      client.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  }
}

export const sseLogStreamer = new SseLogStreamer();
