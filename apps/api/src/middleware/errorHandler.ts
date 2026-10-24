import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      issues: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Handle Prisma unique constraint violations (P2002)
  if (err.code === 'P2002') {
    res.status(409).json({
      error: 'A resource with these details already exists.',
      fields: err.meta?.target,
    });
    return;
  }

  logger.error(`[Unhandled Error] ${req.method} ${req.url}:`, err);

  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message || 'An unexpected error occurred';

  res.status(status).json({ error: message });
}
