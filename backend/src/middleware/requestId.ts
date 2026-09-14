import type { NextFunction, Request, Response } from 'express';
import { randomBytes } from 'node:crypto';

/**
 * Assign a request id used for tracing and audit correlation. Accept an
 * inbound id if the client supplies one (idempotency/tracing), else create one.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const inbound = req.headers['x-request-id'];
  const id = typeof inbound === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(inbound) ? inbound : `req_${randomBytes(8).toString('hex')}`;
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
