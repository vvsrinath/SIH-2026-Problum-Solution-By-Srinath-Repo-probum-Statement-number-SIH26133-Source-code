import type { Response } from 'express';

/**
 * Consistent envelope:
 *   Success: { success: true, data }
 *   Failure: { success: false, error: { code, message }, requestId }
 */
export function sendSuccess<T>(res: Response, data: T, status = 200, meta?: Record<string, unknown>) {
  const body: Record<string, unknown> = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  requestId?: string,
  details?: unknown,
) {
  const body: Record<string, unknown> = {
    success: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
  if (requestId) body.requestId = requestId;
  return res.status(status).json(body);
}
