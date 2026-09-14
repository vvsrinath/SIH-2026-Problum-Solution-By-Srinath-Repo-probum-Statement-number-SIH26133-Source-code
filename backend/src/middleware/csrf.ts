import type { NextFunction, Request, Response } from 'express';
import { randomToken } from '../utils/id';
import { sendError } from '../utils/response';

const CSRF_COOKIE = 'csrf';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Double-submit CSRF protection as defense-in-depth alongside SameSite=Lax.
 *
 * The server sets a `csrf` cookie containing a random, unguessable token. For
 * every state-changing request, the client must echo that same value in the
 * `X-CSRF-Token` header. A cross-site attacker cannot read the cookie to set
 * the header, so forged cross-site state changes are rejected.
 *
 * The token cookie is (re)issued on safe requests when absent so a fresh
 * session gets one before any login/registration POST occurs.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const existing = (req.cookies as Record<string, string> | undefined)?.[CSRF_COOKIE];

  if (SAFE_METHODS.includes(req.method)) {
    if (!existing) {
      const token = randomToken(24);
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }
    return next();
  }

  // State-changing request: verify the double-submit token.
  const headerToken = req.headers[CSRF_HEADER];
  if (!existing || !headerToken || existing !== headerToken) {
    return sendError(res, 403, 'CSRF_TOKEN_INVALID', 'CSRF token missing or invalid', req.requestId);
  }
  return next();
}
