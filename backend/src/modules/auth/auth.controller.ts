import type { Request, Response } from 'express';
import { getAuthProvider, decideRole } from '../../integrations/authProvider';
import { authenticateUser, setSessionCookie, clearSessionCookie } from './auth.service';
import { sessionService } from '../../services/session.service';
import { User } from '../../database/models/User';
import { recordAudit } from '../../services/audit.service';
import { sendSuccess, sendError } from '../../utils/response';
import { NotFoundError, UnavailableError } from '../../utils/errors';

/**
 * Start login: build the provider authorization URL. For the mock provider in
 * development this is a mock:// callback that the frontend resolves directly.
 */
export function login(req: Request, res: Response) {
  const provider = getAuthProvider();
  const state = `role=PATIENT&nonce=${Math.random().toString(36).slice(2)}`;
  const authUrl = provider.buildAuthUrl(state, req.query.redirect as string | undefined);
  return sendSuccess(res, { authUrl, provider: provider.name, configured: provider.isConfigured() });
}

/** Handle the provider callback and issue an application session. */
export async function callback(req: Request, res: Response) {
  const provider = getAuthProvider();
  const { code, state } = req.query as { code?: string; state?: string; error?: string };

  if (req.query.error) {
    return sendError(res, 401, 'AUTH_DENIED', 'Authentication was denied by the provider');
  }

  let identity;
  try {
    identity = await provider.handleCallback({ code, state });
  } catch (err) {
    if (err instanceof UnavailableError && !provider.isConfigured()) {
      return sendError(res, 503, 'INTEGRATION_UNAVAILABLE', err.message);
    }
    throw err;
  }

  const decision = decideRole(identity);
  const session = await authenticateUser(identity, decision, req, provider.name);
  setSessionCookie(res, session.accessToken);

  return sendSuccess(
    res,
    {
      user: { internalUserId: session.internalUserId, role: session.role },
      sessionId: session.sessionId,
    },
    200,
  );
}

/**
 * Demo mock login for exercising workflows.
 *
 * Only active when the mock auth provider is configured (AUTH_PROVIDER=mock),
 * for the local demo and the hosted Vercel demo alike. It is never reachable
 * when a real provider (e.g. MeriPehchaan) is deployed.
 */
export async function mockLogin(req: Request, res: Response) {
  const provider = getAuthProvider();
  if (provider.name !== 'mock') {
    return sendError(res, 404, 'NOT_FOUND', 'Mock login requires the mock auth provider (AUTH_PROVIDER=mock)');
  }
  const role = (req.body as { role?: string }).role || 'PATIENT';
  const doctorVariant = (req.body as { doctorVariant?: 'PRIMARY' | 'SECONDARY' }).doctorVariant;
  const state = `role=${role}${doctorVariant ? `&variant=${doctorVariant}` : ''}`;
  const identity = await getMockIdentity(role, doctorVariant);
  const decision = decideRole(identity);
  const session = await authenticateUser(identity, decision, req, 'mock');
  setSessionCookie(res, session.accessToken);
  return sendSuccess(res, { user: { internalUserId: session.internalUserId, role: session.role } });
}

/** Logout: revoke the current server-side session and clear the cookie. */
export async function logout(req: Request, res: Response) {
  const rawToken = readRawToken(req);
  const userId = req.auth?.internalUserId;
  if (rawToken) {
    await sessionService.revoke(rawToken, 'LOGOUT');
  }
  clearSessionCookie(res);
  if (userId) {
    await recordAudit({ actorUserId: userId, action: 'LOGOUT', result: 'SUCCESS', requestId: req.requestId, ip: req.ip });
  }
  return res.status(204).send();
}

/** Current user (requires auth). */
export async function me(req: Request, res: Response) {
  const auth = req.auth;
  const user = await User.findOne({ internalUserId: auth?.internalUserId }).lean();
  if (!user) throw new NotFoundError('User not found');
  return sendSuccess(res, {
    internalUserId: user.internalUserId,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
  });
}

function readRawToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim();
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.['ssat'];
  return cookieToken ?? null;
}

async function getMockIdentity(role: string, doctorVariant?: 'PRIMARY' | 'SECONDARY') {
  const names: Record<string, string> = {
    PATIENT: 'Demo Patient',
    DOCTOR: doctorVariant === 'SECONDARY' ? 'Demo Doctor 2' : 'Demo Doctor',
    HEALTH_WORKER: 'Demo Health Worker',
    ADMIN: 'Demo Admin',
  };
  const r = (['PATIENT', 'DOCTOR', 'HEALTH_WORKER', 'ADMIN'].includes(role) ? role : 'PATIENT') as
    | 'PATIENT'
    | 'DOCTOR'
    | 'HEALTH_WORKER'
    | 'ADMIN';
  return {
    externalIdentityReference: doctorVariant === 'SECONDARY' ? 'mock-ref-doctor-secondary' : `mock-ref-${r.toLowerCase()}`,
    claims: { name: names[r], mobile: '9000000000' },
    _mockRole: r,
  } as never;
}
