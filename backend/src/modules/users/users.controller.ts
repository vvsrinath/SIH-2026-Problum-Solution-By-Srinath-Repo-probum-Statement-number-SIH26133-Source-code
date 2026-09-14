import type { Request, Response } from 'express';
import { getSelfView, updateSelf } from './users.service';
import { requirePermission } from '../../middleware/authorization';
import { PERMISSION, ROLE } from '../../constants/roles';
import { sendSuccess } from '../../utils/response';
import { AuthError, ForbiddenError } from '../../utils/errors';

/** users/me is always the caller themselves; server decides permissions. */
export async function getMe(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const view = await getSelfView(req.auth.internalUserId);
  return sendSuccess(res, view);
}

export async function patchMe(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const view = await updateSelf(req.auth.internalUserId, req.body, req);
  return sendSuccess(res, view);
}

/**
 * Server-side permission gate for updating one's own profile. The matrix uses
 * role-appropriate "self" permissions so we map them per role.
 */
export function requireSelfUpdatePermission(req: Request, _res: Response, next: import('express').NextFunction) {
  const role = req.auth?.role;
  if (!role) return next(new AuthError());
  if (role === ROLE.PATIENT) {
    return requirePermission(PERMISSION.PROFILE_UPDATE_SELF)(req, _res, next);
  }
  if (role === ROLE.DOCTOR) {
    return requirePermission(PERMISSION.DOCTOR_PROFILE_READ_SELF)(req, _res, next);
  }
  if (role === ROLE.HEALTH_WORKER || role === ROLE.ADMIN) {
    return next(); // health workers/admins may update limited self fields
  }
  return next(new ForbiddenError());
}
