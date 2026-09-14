import { describe, it, expect } from 'vitest';
import { ROLE, PERMISSION, roleAllows, type Permission } from '../src/constants/roles';
import { requirePermission } from '../src/middleware/authorization';

type Req = { auth?: { internalUserId: string; role: keyof typeof ROLE }; requestId?: string };
type Res = { locals: Record<string, unknown> };

function callRequirePermission(role: keyof typeof ROLE, permission: Permission): { nextErr?: unknown } {
  let nextErr: unknown;
  const req = { auth: { internalUserId: 'usr-1', role }, requestId: 'rid' } as Req as never;
  const res = { locals: {} } as Res as never;
  const next = (err?: unknown) => {
    nextErr = err;
  };
  requirePermission(permission)(req, res, next as never);
  return { nextErr };
}

describe('RBAC permission matrix', () => {
  it('patient may manage their own consent/privacy but not create referrals or audit', () => {
    expect(roleAllows(ROLE.PATIENT, PERMISSION.CONSENT_MANAGE_SELF)).toBe(true);
    expect(roleAllows(ROLE.PATIENT, PERMISSION.PRIVACY_MANAGE_SELF)).toBe(true);
    expect(roleAllows(ROLE.PATIENT, PERMISSION.REFERRAL_CREATE)).toBe(false);
    expect(roleAllows(ROLE.PATIENT, PERMISSION.ADMIN_AUDIT)).toBe(false);
  });

  it('doctor may create referrals/follow-ups but not manage patient consent', () => {
    expect(roleAllows(ROLE.DOCTOR, PERMISSION.REFERRAL_CREATE)).toBe(true);
    expect(roleAllows(ROLE.DOCTOR, PERMISSION.FOLLOWUP_CREATE)).toBe(true);
    expect(roleAllows(ROLE.DOCTOR, PERMISSION.CONSENT_MANAGE_SELF)).toBe(false);
  });

  it('admin may read audit but has no patient-data read permission', () => {
    expect(roleAllows(ROLE.ADMIN, PERMISSION.ADMIN_AUDIT)).toBe(true);
    expect(roleAllows(ROLE.ADMIN, PERMISSION.PROFILE_READ_SELF)).toBe(false);
    expect(roleAllows(ROLE.ADMIN, PERMISSION.PATIENT_READ_AUTHORIZED)).toBe(false);
  });

  it('requirePermission allows an authorized actor and blocks an unauthorized one', () => {
    const allowed = callRequirePermission(ROLE.DOCTOR, PERMISSION.REFERRAL_CREATE);
    expect(allowed.nextErr).toBeUndefined();

    const denied = callRequirePermission(ROLE.PATIENT, PERMISSION.REFERRAL_CREATE);
    expect(denied.nextErr).toBeDefined();
    expect((denied.nextErr as { statusCode?: number }).statusCode).toBe(403);
  });
});
