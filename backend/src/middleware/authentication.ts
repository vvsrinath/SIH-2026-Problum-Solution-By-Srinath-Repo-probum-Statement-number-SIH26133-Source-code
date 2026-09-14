import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../config/security';
import { sessionService } from '../services/session.service';
import { AuthError, ForbiddenError } from '../utils/errors';
import type { Role } from '../constants/roles';

export const ACCESS_TOKEN_COOKIE = 'ssat';

/** Extract the bearer token from Authorization header or HttpOnly cookie. */
function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim();
  const cookie = (req.cookies as Record<string, string> | undefined)?.[ACCESS_TOKEN_COOKIE];
  if (cookie) return cookie;
  return null;
}

/**
 * requireAuth: verifies the access token, checks the referenced server-side
 * session is valid, and attaches `req.auth`. Rejects with 401 otherwise.
 * The token is never logged.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  // Verify JWT synchronously first for a fast path, then validate session.
  const token = extractToken(req);
  if (!token) return next(new AuthError());

  const payload = verifyAccessToken(token);
  if (!payload) return next(new AuthError('Invalid or expired access token'));

  return sessionService
    .validate(payload.sessionId)
    .then((session) => {
      if (!session) return next(new AuthError('Session is no longer valid'));
      req.auth = {
        internalUserId: session.internalUserId,
        role: session.role,
        sessionId: session.sessionId,
      };
      return next();
    })
    .catch(next);
}

/** requireRole: additionally restrict to the given roles. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(new AuthError());
    if (!roles.includes(req.auth.role)) return next(new ForbiddenError());
    return next();
  };
}
