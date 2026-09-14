import { createHash } from 'node:crypto';
import { Session } from '../database/models/Session';
import { env } from '../config/env';
import { randomToken } from '../utils/id';
import type { Role } from '../constants/roles';

/**
 * Sessions enable revocation and audit. The raw session token is returned to
 * the caller (and embedded in the access JWT); only its SHA-256 hash is
 * stored, matching how a session secret should be held server-side.
 */
export class SessionService {
  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async create(opts: {
    internalUserId: string;
    role: Role;
    userAgent?: string;
    ip?: string;
  }): Promise<{ sessionToken: string; rawSessionId: string; expiresAt: Date }> {
    const sessionToken = randomToken(32);
    const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
    const doc = await Session.create({
      sessionTokenHash: this.hash(sessionToken),
      internalUserId: opts.internalUserId,
      role: opts.role,
      userAgent: opts.userAgent,
      ip: opts.ip,
      expiresAt,
    });
    return { sessionToken, rawSessionId: String(doc._id), expiresAt };
  }

  /**
   * Validate a raw session token. Returns the session doc when valid and not
   * revoked/expired, otherwise null.
   */
  async validate(rawToken: string): Promise<{
    internalUserId: string;
    role: Role;
    sessionId: string;
  } | null> {
    const session = await Session.findOne({ sessionTokenHash: this.hash(rawToken) });
    if (!session) return null;
    if (session.revokedAt) return null;
    if (!session.expiresAt || session.expiresAt.getTime() < Date.now()) {
      await Session.updateOne({ _id: session._id }, { revokedAt: new Date(), revokedReason: 'EXPIRED' });
      return null;
    }
    // guard: token value must be string (schema-typed) — cast safely
    const id = String((session as unknown as { _id: unknown })._id);
    return {
      internalUserId: session.internalUserId,
      role: session.role as Role,
      sessionId: id,
    };
  }

  async revoke(rawToken: string, reason: 'LOGOUT' | 'ADMIN_REVOKE' | 'SECURITY' = 'LOGOUT'): Promise<void> {
    await Session.updateOne(
      { sessionTokenHash: this.hash(rawToken) },
      { revokedAt: new Date(), revokedReason: reason },
    );
  }

  async revokeAllForUser(internalUserId: string, reason: 'LOGOUT' | 'ADMIN_REVOKE' | 'SECURITY' = 'LOGOUT'): Promise<void> {
    await Session.updateMany(
      { internalUserId, revokedAt: { $exists: false } },
      { revokedAt: new Date(), revokedReason: reason },
    );
  }
}

export const sessionService = new SessionService();
