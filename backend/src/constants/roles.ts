export const ROLE = {
  PATIENT: 'PATIENT',
  DOCTOR: 'DOCTOR',
  HEALTH_WORKER: 'HEALTH_WORKER',
  ADMIN: 'ADMIN',
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

/** All known permissions in the system (a flat namespace). */
export const PERMISSION = {
  // patient self
  PROFILE_READ_SELF: 'profile:read:self',
  PROFILE_UPDATE_SELF: 'profile:update:self',
  APPOINTMENT_CREATE: 'appointment:create',
  APPOINTMENT_READ_SELF: 'appointment:read:self',
  APPOINTMENT_CANCEL_SELF: 'appointment:cancel:self',
  TRIAGE_CREATE: 'triage:create',
  TRIAGE_READ_SELF: 'triage:read:self',
  CONSULTATION_JOIN: 'consultation:join',
  REFERRAL_READ_SELF: 'referral:read:self',
  FOLLOWUP_READ_SELF: 'followup:read:self',
  FOLLOWUP_COMPLETE_SELF: 'followup:complete:self',
  PRIVACY_MANAGE_SELF: 'privacy:manage:self',
  CONSENT_MANAGE_SELF: 'consent:manage:self',

  // doctor
  DOCTOR_PROFILE_READ_SELF: 'doctor:profile:read:self',
  AVAILABILITY_MANAGE_SELF: 'availability:manage:self',
  APPOINTMENTS_READ_ASSIGNED: 'appointments:read:assigned',
  CONSULTATION_JOIN_DOCTOR: 'consultation:join',
  PATIENT_READ_AUTHORIZED: 'patient:read:authorized',
  REFERRAL_CREATE: 'referral:create',
  FOLLOWUP_CREATE: 'followup:create',
  TRIAGE_READ_AUTHORIZED: 'triage:read:authorized',

  // health worker (assigned workflow)
  HW_APPOINTMENT_MANAGE: 'healthworker:appointment:manage',
  HW_PATIENT_READ_ASSIGNED: 'healthworker:patient:read:assigned',
  HW_FOLLOWUP_MANAGE: 'healthworker:followup:manage',

  // admin
  ADMIN_SYSTEM: 'admin:system',
  ADMIN_USERS: 'admin:users',
  ADMIN_AUDIT: 'admin:audit',
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_FACILITIES: 'admin:facilities',
} as const;

export type Permission = (typeof PERMISSION)[keyof typeof PERMISSION];

/**
 * Role -> allowed permissions matrix. The server is the sole authority.
 * ADMIN intentionally has NO rights over E2EE message plaintext (there is
 * no plaintext to grant access to), and no patient-data read permission
 * beyond what an explicit workflow justifies.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [ROLE.PATIENT]: [
    PERMISSION.PROFILE_READ_SELF,
    PERMISSION.PROFILE_UPDATE_SELF,
    PERMISSION.APPOINTMENT_CREATE,
    PERMISSION.APPOINTMENT_READ_SELF,
    PERMISSION.APPOINTMENT_CANCEL_SELF,
    PERMISSION.TRIAGE_CREATE,
    PERMISSION.TRIAGE_READ_SELF,
    PERMISSION.CONSULTATION_JOIN,
    PERMISSION.REFERRAL_READ_SELF,
    PERMISSION.FOLLOWUP_READ_SELF,
    PERMISSION.FOLLOWUP_COMPLETE_SELF,
    PERMISSION.PRIVACY_MANAGE_SELF,
    PERMISSION.CONSENT_MANAGE_SELF,
  ],
  [ROLE.DOCTOR]: [
    PERMISSION.DOCTOR_PROFILE_READ_SELF,
    PERMISSION.AVAILABILITY_MANAGE_SELF,
    PERMISSION.APPOINTMENTS_READ_ASSIGNED,
    PERMISSION.CONSULTATION_JOIN_DOCTOR,
    PERMISSION.PATIENT_READ_AUTHORIZED,
    PERMISSION.REFERRAL_CREATE,
    PERMISSION.REFERRAL_READ_SELF,
    PERMISSION.FOLLOWUP_CREATE,
    PERMISSION.FOLLOWUP_COMPLETE_SELF,
    PERMISSION.TRIAGE_READ_AUTHORIZED,
  ],
  [ROLE.HEALTH_WORKER]: [
    PERMISSION.HW_APPOINTMENT_MANAGE,
    PERMISSION.HW_PATIENT_READ_ASSIGNED,
    PERMISSION.HW_FOLLOWUP_MANAGE,
    PERMISSION.FOLLOWUP_COMPLETE_SELF,
  ],
  [ROLE.ADMIN]: [
    PERMISSION.ADMIN_SYSTEM,
    PERMISSION.ADMIN_USERS,
    PERMISSION.ADMIN_AUDIT,
    PERMISSION.ADMIN_SETTINGS,
    PERMISSION.ADMIN_FACILITIES,
  ],
};

export function roleAllows(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
