import jwt from 'jsonwebtoken';
import { env } from './env';

export interface AccessPayload {
  sub: string; // internalUserId
  role: string;
  type: 'access';
  sessionId: string;
}

/**
 * Sign a short-lived access token. Tokens carry only the internal user id
 * and role; fine-grained authorization is always enforced server-side.
 */
export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
    issuer: 'swasthya-sathi-backend',
    audience: 'swasthya-sathi-pwa',
  });
}

export function verifyAccessToken(token: string): AccessPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'swasthya-sathi-backend',
      audience: 'swasthya-sathi-pwa',
    }) as jwt.JwtPayload;
    if (decoded.type !== 'access' || !decoded.sub || !decoded.role || !decoded.sessionId) return null;
    return { sub: decoded.sub, role: decoded.role, type: 'access', sessionId: decoded.sessionId };
  } catch {
    return null;
  }
}

/** Timing-safe constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i += 1) result |= left[i] ^ right[i];
  return result === 0;
}
