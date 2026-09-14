import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import logger from '../config/logger';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';

/**
 * Centralised error handler. Sanitizes output so clients never see stack
 * traces, internal paths, DB errors or secrets. Recognized AppError/Zod
 * errors become structured responses; everything else becomes a generic 500.
 */
export function notFoundHandler(req: Request, res: Response) {
  return sendError(res, 404, 'NOT_FOUND', `Route not found: ${req.method} ${req.path}`, req.requestId);
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.requestId;

  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return sendError(res, 422, 'VALIDATION_ERROR', 'Invalid request payload', requestId, details);
  }

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, requestId, err.details);
  }

  if (err && typeof err === 'object' && 'type' in err && (err as { type: string }).type === 'entity.too.large') {
    return sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body too large', requestId);
  }

  // Sanitized generic handler
  logger.error({ err, requestId, method: req.method, path: req.path }, 'Unhandled error');
  if (env.NODE_ENV !== 'production') {
    const message = err instanceof Error ? err.message : String(err);
    return sendError(res, 500, 'INTERNAL_ERROR', message, requestId);
  }
  return sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred', requestId);
}
