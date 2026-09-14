/**
 * Data Retention Policy — Swasthya Sathi (SIH26133)
 *
 * Enforces data retention per data classification and DPDP Act 2023.
 * Runs as a scheduled job to delete expired data and log retention actions.
 *
 * Retention periods (from env or defaults):
 *   - Audit logs:      10 years (3650 days) — regulatory requirement
 *   - Triage data:      2 years (730 days)
 *   - GPS coordinates:  0 days — never persisted
 *   - Health records:   7 years (2555 days) — medical records standard
 *   - Personal data:    7 years (2555 days) — DPDP requirement
 *   - Sessions:         7 days
 *   - Notifications:    90 days
 */

import mongoose from 'mongoose';
import { env } from '../config/env';
import { recordAudit } from './audit.service';
import logger from '../config/logger';

export interface RetentionRule {
  collection: string;
  retentionDays: number;
  dateField: string;
  description: string;
}

/**
 * All retention rules. Date field is the field used to determine age.
 */
export const RETENTION_RULES: RetentionRule[] = [
  {
    collection: 'auditlogs',
    retentionDays: env.RETENTION_AUDIT_DAYS,
    dateField: 'createdAt',
    description: 'Audit logs — regulatory requirement (10 years)',
  },
  {
    collection: 'triageassessments',
    retentionDays: env.RETENTION_TRIAGE_DAYS,
    dateField: 'createdAt',
    description: 'Triage assessments — clinical data retention',
  },
  {
    collection: 'sessions',
    retentionDays: env.SESSION_TTL_DAYS,
    dateField: 'createdAt',
    description: 'Server sessions — security hygiene',
  },
  {
    collection: 'notifications',
    retentionDays: 90,
    dateField: 'createdAt',
    description: 'Notifications — operational retention',
  },
  {
    collection: 'patientprofiles',
    retentionDays: 2555, // 7 years
    dateField: 'updatedAt',
    description: 'Patient profiles — medical records standard',
  },
  {
    collection: 'appointments',
    retentionDays: 2555, // 7 years
    dateField: 'createdAt',
    description: 'Appointments — clinical record retention',
  },
  {
    collection: 'consultations',
    retentionDays: 2555,
    dateField: 'createdAt',
    description: 'Consultations — clinical record retention',
  },
  {
    collection: 'referrals',
    retentionDays: 2555,
    dateField: 'createdAt',
    description: 'Referrals — clinical record retention',
  },
  {
    collection: 'followups',
    retentionDays: 2555,
    dateField: 'createdAt',
    description: 'Follow-ups — clinical record retention',
  },
  {
    collection: 'consents',
    retentionDays: 2555, // 7 years — must retain consent records
    dateField: 'createdAt',
    description: 'Consent records — DPDP compliance',
  },
  {
    collection: 'privacyrequests',
    retentionDays: 2555,
    dateField: 'createdAt',
    description: 'Privacy requests — DPDP compliance',
  },
];

/**
 * Run retention cleanup for a single collection.
 * Returns the count of deleted documents.
 */
export async function enforceRetentionForCollection(rule: RetentionRule): Promise<number> {
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB not connected');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - rule.retentionDays);

  try {
    const result = await db.collection(rule.collection).deleteMany({
      [rule.dateField]: { $lt: cutoffDate },
    });

    if (result.deletedCount > 0) {
      logger.info(
        {
          collection: rule.collection,
          deleted: result.deletedCount,
          cutoff: cutoffDate.toISOString(),
          retentionDays: rule.retentionDays,
        },
        'retention cleanup',
      );

      await recordAudit({
        action: 'RETENTION.CLEANUP',
        resourceType: rule.collection,
        result: 'SUCCESS',
        details: {
          deletedCount: result.deletedCount,
          cutoffDate: cutoffDate.toISOString(),
          retentionDays: rule.retentionDays,
        },
      });
    }

    return result.deletedCount;
  } catch (err) {
    logger.error({ err, collection: rule.collection }, 'retention cleanup failed');
    await recordAudit({
      action: 'RETENTION.CLEANUP_FAILED',
      resourceType: rule.collection,
      result: 'FAILURE',
      details: { error: err instanceof Error ? err.message : 'unknown' },
    });
    return 0;
  }
}

/**
 * Run all retention rules. Returns total deleted count.
 */
export async function enforceAllRetention(): Promise<{ totalDeleted: number; results: Array<{ collection: string; deleted: number }> }> {
  const results: Array<{ collection: string; deleted: number }> = [];
  let totalDeleted = 0;

  for (const rule of RETENTION_RULES) {
    const deleted = await enforceRetentionForCollection(rule);
    results.push({ collection: rule.collection, deleted });
    totalDeleted += deleted;
  }

  logger.info({ totalDeleted, collections: results.length }, 'retention enforcement complete');

  return { totalDeleted, results };
}

/**
 * Get retention status — how many documents would be deleted for each rule.
 * Useful for dashboards and compliance reporting.
 */
export async function getRetentionStatus(): Promise<
  Array<{ collection: string; retentionDays: number; cutoff: string; count: number }>
> {
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB not connected');

  const status: Array<{ collection: string; retentionDays: number; cutoff: string; count: number }> = [];

  for (const rule of RETENTION_RULES) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - rule.retentionDays);

    try {
      const count = await db.collection(rule.collection).countDocuments({
        [rule.dateField]: { $lt: cutoffDate },
      });
      status.push({
        collection: rule.collection,
        retentionDays: rule.retentionDays,
        cutoff: cutoffDate.toISOString(),
        count,
      });
    } catch {
      status.push({
        collection: rule.collection,
        retentionDays: rule.retentionDays,
        cutoff: cutoffDate.toISOString(),
        count: -1, // error
      });
    }
  }

  return status;
}
