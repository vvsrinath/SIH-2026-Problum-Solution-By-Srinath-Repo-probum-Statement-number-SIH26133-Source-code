import type { Request, Response } from 'express';
import { User } from '../../database/models/User';
import { PatientProfile } from '../../database/models/PatientProfile';
import { DoctorProfile } from '../../database/models/DoctorProfile';
import { HealthWorkerProfile } from '../../database/models/HealthWorkerProfile';
import { sessionService } from '../../services/session.service';
import { signAccessToken } from '../../config/security';
import { env } from '../../config/env';
import { newUserId, newPatientId, newDoctorId, newHealthWorkerId } from '../../utils/id';
import { recordAudit } from '../../services/audit.service';
import { ACCESS_TOKEN_COOKIE } from '../../middleware/authentication';
import { ConflictError } from '../../utils/errors';
import type { ExternalIdentity, RoleDecision } from './auth.types';

const COOKIE_NAME = ACCESS_TOKEN_COOKIE;

export interface SessionResult {
  internalUserId: string;
  role: string;
  accessToken: string;
  sessionId: string;
}

/**
 * Find or create the internal user + role profile from a verified external
 * identity. Returns the internal user.
 */
async function resolveOrCreateUser(identity: ExternalIdentity, decision: RoleDecision, providerName: string) {
  let user = await User.findOne({ externalIdentityReference: identity.externalIdentityReference }).lean();
  if (!user) {
    // Deterministically map the external reference to stable internal ids.
    const internalUserId = newUserId();
    user = await User.create({
      internalUserId,
      externalIdentityProvider: providerName,
      externalIdentityReference: identity.externalIdentityReference,
      role: decision.role,
      status: 'ACTIVE',
    });
    await bootstrapProfile(user.internalUserId, decision.role, identity);
  }
  return user;
}

async function bootstrapProfile(internalUserId: string, role: string, identity: ExternalIdentity) {
  if (role === 'PATIENT') {
    await PatientProfile.create({
      patientId: newPatientId(),
      internalUserId,
      displayName: identity.claims.name,
    });
  } else if (role === 'DOCTOR') {
    await DoctorProfile.create({
      doctorId: newDoctorId(),
      internalUserId,
      displayName: identity.claims.name,
    });
  } else if (role === 'HEALTH_WORKER') {
    await HealthWorkerProfile.create({
      healthWorkerId: newHealthWorkerId(),
      internalUserId,
      displayName: identity.claims.name,
    });
  }
}

/**
 * Authenticate the caller (from any provider) and issue an application
 * session. Returns tokens; the controller sets the HttpOnly cookie.
 */
export async function authenticateUser(
  identity: ExternalIdentity,
  decision: RoleDecision,
  req: Request,
  providerName: string,
): Promise<SessionResult> {
  const user = await resolveOrCreateUser(identity, decision, providerName);
  if (user.status !== 'ACTIVE') {
    throw new ConflictError('This account is not active', 'ACCOUNT_DISABLED');
  }

  const actorUser = await User.findOne({ internalUserId: user.internalUserId }).lean();
  const { sessionToken, expiresAt } = await sessionService.create({
    internalUserId: user.internalUserId,
    role: (actorUser?.role ?? user.role) as never,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  // Keep the raw session token inside the access JWT for server-side checks.
  const accessToken = signAccessToken({
    sub: user.internalUserId,
    role: user.role as never,
    type: 'access',
    sessionId: sessionToken,
  });

  await recordAudit({
    actorUserId: user.internalUserId,
    actorRole: user.role,
    action: 'LOGIN',
    result: 'SUCCESS',
    requestId: req.requestId,
    ip: req.ip,
  });

  return {
    internalUserId: user.internalUserId,
    role: user.role,
    accessToken,
    sessionId: sessionToken,
  };
}

/** Set the HttpOnly session cookie with appropriate flags. */
export function setSessionCookie(res: Response, accessToken: string) {
  res.cookie(COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
}
