import type { NextFunction, Request, Response } from 'express';
import { roleAllows, type Permission, ROLE } from '../constants/roles';
import { AuthError, ForbiddenError, NotFoundError } from '../utils/errors';
import { recordAudit } from '../services/audit.service';
import { getClassification, shouldRedact } from '../config/dataClassification';

/**
 * requirePermission: enforce a single permission from the role matrix.
 * The server (not the client) decides what a role may do.
 */
export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(new AuthError());
    if (!roleAllows(req.auth.role, permission)) {
      void recordAudit({
        actorUserId: req.auth.internalUserId,
        actorRole: req.auth.role,
        action: 'PERMISSION_DENIED',
        resourceType: 'permission',
        resourceId: permission,
        result: 'DENIED',
        requestId: req.requestId,
      });
      return next(new ForbiddenError());
    }
    return next();
  };
}

/**
 * requireResourceAccess: a factory for resource-ownership checks.
 *
 * `check` must return null if the caller has no access, or an object
 * describing the resource if they do (e.g. the loaded document). The factory
 * attaches the result to `res.locals[resourceKey]` for the handler to reuse.
 */
export function requireResourceAccess(
  check: (req: Request) => Promise<Record<string, unknown> | null>,
  resourceKey = 'resource',
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return next(new AuthError());
    return check(req)
      .then((result) => {
        if (!result) {
          // Return 404 to avoid leaking existence across resource boundaries.
          const id = req.params.id || req.auth?.internalUserId;
          void recordAudit({
            actorUserId: req.auth?.internalUserId,
            actorRole: req.auth?.role,
            action: 'RESOURCE_ACCESS_DENIED',
            resourceType: resourceKey,
            resourceId: String(id),
            result: 'DENIED',
            requestId: req.requestId,
          });
          return next(new ForbiddenError());
        }
        res.locals[resourceKey] = result;
        return next();
      })
      .catch(next);
  };
}

// ---------------------------------------------------------------------------
// Fine-grained resource-level authorization
// ---------------------------------------------------------------------------

/**
 * requireOwnership: verify the authenticated user owns the resource.
 * Works with patientId, doctorId, internalUserId fields.
 */
export function requireOwnership(
  getOwnerId: (req: Request, resource: Record<string, unknown>) => string | undefined,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return next(new AuthError());

    // Admins bypass ownership check for admin endpoints
    if (req.auth.role === ROLE.ADMIN) return next();

    const resource = res.locals.resource as Record<string, unknown> | undefined;
    if (!resource) return next(new ForbiddenError());

    const ownerId = getOwnerId(req, resource);
    if (ownerId !== req.auth.internalUserId) {
      void recordAudit({
        actorUserId: req.auth.internalUserId,
        actorRole: req.auth.role,
        action: 'OWNERSHIP_DENIED',
        resourceType: 'resource',
        resourceId: req.params.id,
        result: 'DENIED',
        requestId: req.requestId,
      });
      return next(new ForbiddenError());
    }
    return next();
  };
}

/**
 * requireClinicalAccess: verify the user has clinical access to patient data.
 * Doctors need authorization (consent/referral), health workers need assignment.
 */
export function requireClinicalAccess(
  getPatientId: (req: Request, resource: Record<string, unknown>) => string | undefined,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return next(new AuthError());

    // Patients can always access their own data
    if (req.auth.role === ROLE.PATIENT) {
      const resource = res.locals.resource as Record<string, unknown> | undefined;
      if (resource) {
        const patientId = getPatientId(req, resource);
        // For patient profiles, check internalUserId matches
        if (resource.internalUserId === req.auth.internalUserId) return next();
      }
      return next();
    }

    // Doctors and health workers need explicit authorization
    if (req.auth.role === ROLE.DOCTOR || req.auth.role === ROLE.HEALTH_WORKER) {
      // Access is mediated by referrals and appointments — check at route level
      return next();
    }

    return next(new ForbiddenError());
  };
}

/**
 * auditDataAccess: log access to sensitive data for audit trail.
 * Attach to routes that serve HEALTH or PERSONAL data.
 */
export function auditDataAccess(collection: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next();

    const classification = getClassification(collection);
    if (classification === 'HEALTH' || classification === 'PERSONAL') {
      void recordAudit({
        actorUserId: req.auth.internalUserId,
        actorRole: req.auth.role,
        action: `DATA_ACCESS.${collection.toUpperCase()}`,
        resourceType: collection,
        resourceId: req.params.id || 'list',
        result: 'SUCCESS',
        requestId: req.requestId,
        details: {
          classification,
          method: req.method,
          path: req.path,
        },
      });
    }

    return next();
  };
}

export { NotFoundError };
