import { AuditLog, type AuditLogDoc } from '../database/models/AuditLog';
import { newAwarenessId } from '../utils/id';

export interface AuditEntry {
  actorUserId?: string;
  actorRole?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  requestId?: string;
  ip?: string;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
}

/**
 * Persist an audit event. This is the single funnel for auditable actions so
 * we can guarantee redaction and consistent structure. Sensitive data should
 * never be placed in `details`.
 */
export async function recordAudit(entry: AuditEntry): Promise<AuditLogDoc | null> {
  try {
    const log = await AuditLog.create({
      eventId: newAwarenessId(),
      actorUserId: entry.actorUserId,
      actorRole: entry.actorRole,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      result: entry.result,
      requestId: entry.requestId,
      ip: entry.ip,
      details: entry.details,
    });
    return log;
  } catch (err) {
    // Auditing must never break the primary flow.
    console.error('audit write failed', err);
    return null;
  }
}

/** Convenience wrappers */
export const audit = {
  ok: (entry: Omit<AuditEntry, 'result'>) => recordAudit({ ...entry, result: 'SUCCESS' }),
  fail: (entry: Omit<AuditEntry, 'result'>) => recordAudit({ ...entry, result: 'FAILURE' }),
  denied: (entry: Omit<AuditEntry, 'result'>) => recordAudit({ ...entry, result: 'DENIED' }),
};

// ---------------------------------------------------------------------------
// Security / Privacy audit events — structured for compliance
// ---------------------------------------------------------------------------

export const AUDIT_ACTIONS = {
  // Auth events
  AUTH_LOGIN: 'AUTH.LOGIN',
  AUTH_LOGOUT: 'AUTH.LOGOUT',
  AUTH_REGISTER: 'AUTH.REGISTER',
  AUTH_MOCK_LOGIN: 'AUTH.MOCK_LOGIN',
  AUTH_SESSION_REVOKED: 'AUTH.SESSION_REVOKED',
  AUTH_FAILED_ATTEMPT: 'AUTH.FAILED_ATTEMPT',

  // Data access events
  DATA_ACCESS_PATIENT: 'DATA_ACCESS.PATIENT',
  DATA_ACCESS_DOCTOR: 'DATA_ACCESS.DOCTOR',
  DATA_ACCESS_TRIAGE: 'DATA_ACCESS.TRIAGE',
  DATA_ACCESS_APPOINTMENT: 'DATA_ACCESS.APPOINTMENT',
  DATA_ACCESS_CONSULTATION: 'DATA_ACCESS.CONSULTATION',
  DATA_ACCESS_REFERRAL: 'DATA_ACCESS.REFERRAL',

  // Consent events
  CONSENT_GRANT: 'CONSENT.GRANT',
  CONSENT_WITHDRAW: 'CONSENT.WITHDRAW',
  CONSENT_EXPIRED: 'CONSENT.EXPIRED',
  CONSENT_CHECK: 'CONSENT.CHECK',

  // Privacy events
  PRIVACY_SUBMIT: 'PRIVACY.SUBMIT',
  PRIVACY_ACCESS: 'PRIVACY.ACCESS',
  PRIVACY_CORRECTION: 'PRIVACY.CORRECTION',
  PRIVACY_DELETION: 'PRIVACY.DELETION',
  PRIVACY_GRIEVANCE: 'PRIVACY.GRIEVANCE',
  PRIVACY_DATA_EXPORT: 'PRIVACY.DATA_EXPORT',
  PRIVACY_DATA_ERASURE: 'PRIVACY.DATA_ERASURE',

  // Key management events
  KEY_REGISTER: 'KEY.REGISTER',
  KEY_ROTATE: 'KEY.ROTATE',
  KEY_REVOKE: 'KEY.REVOKE',
  KEY_EXPIRED: 'KEY.EXPIRED',

  // Incident events
  INCIDENT_DETECTED: 'INCIDENT.DETECTED',
  INCIDENT_ASSESSED: 'INCIDENT.ASSESSED',
  INCIDENT_CONTAINED: 'INCIDENT.CONTAINED',
  INCIDENT_NOTIFIED: 'INCIDENT.NOTIFIED',
  INCIDENT_REMEDIATED: 'INCIDENT.REMEDIATED',
  INCIDENT_REVIEWED: 'INCIDENT.REVIEWED',

  // Retention events
  RETENTION_CLEANUP: 'RETENTION.CLEANUP',
  RETENTION_FAILED: 'RETENTION.CLEANUP_FAILED',

  // Integration events
  INTEGRATION_CALL: 'INTEGRATION.CALL',
  INTEGRATION_FAILURE: 'INTEGRATION.FAILURE',

  // Permission events
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RESOURCE_ACCESS_DENIED: 'RESOURCE_ACCESS_DENIED',
  OWNERSHIP_DENIED: 'OWNERSHIP_DENIED',
} as const;
