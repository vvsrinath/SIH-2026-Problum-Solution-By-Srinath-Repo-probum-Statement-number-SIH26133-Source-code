/**
 * Breach / Incident Response Workflow — Swasthya Sathi (SIH26133)
 *
 * Implements a structured incident response flow:
 *   1. DETECT  — anomaly/alert triggers incident creation
 *   2. ASSESS  — severity classification (LOW/MEDIUM/HIGH/CRITICAL)
 *   3. CONTAIN — immediate containment actions
 *   4. NOTIFY  — DPDP breach notification (Data Protection Board + affected users)
 *   5. REMEDIATE — fix root cause
 *   6. REVIEW  — post-incident review + policy update
 *
 * DPDP Act 2023, Section 8(6): Data fiduciary must notify the Board and
 * affected data principals within 72 hours of becoming aware of a breach.
 */

import mongoose from 'mongoose';
import { Schema, model, type InferSchemaType } from 'mongoose';
import { newAwarenessId } from '../utils/id';
import { recordAudit } from './audit.service';
import { createNotification } from './notification.service';
import logger from '../config/logger';

// ---------------------------------------------------------------------------
// Incident model
// ---------------------------------------------------------------------------

export const INCIDENT_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export const INCIDENT_STATUS = {
  DETECTED: 'DETECTED',
  ASSESSED: 'ASSESSED',
  CONTAINED: 'CONTAINED',
  NOTIFIED: 'NOTIFIED',
  REMEDIATED: 'REMEDIATED',
  REVIEWED: 'REVIEWED',
} as const;

const incidentSchema = new Schema(
  {
    incidentId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, maxlength: 500 },
    description: { type: String, required: true, maxlength: 5000 },
    severity: {
      type: String,
      enum: Object.values(INCIDENT_SEVERITY),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(INCIDENT_STATUS),
      default: 'DETECTED',
      index: true,
    },
    // Affected data
    affectedCollections: { type: [String], default: [] },
    affectedUserIds: { type: [String], default: [] },
    estimatedRecordsBreached: { type: Number, default: 0 },
    // Classification
    dataClassification: {
      type: String,
      enum: ['PUBLIC', 'INTERNAL', 'PERSONAL', 'HEALTH'],
    },
    // Timeline
    detectedAt: { type: Date, required: true, default: Date.now },
    assessedAt: { type: Date },
    containedAt: { type: Date },
    notifiedAt: { type: Date },
    remediatedAt: { type: Date },
    reviewedAt: { type: Date },
    // Notification
    boardNotificationRequired: { type: Boolean, default: false },
    boardNotificationSentAt: { type: Date },
    userNotificationRequired: { type: Boolean, default: false },
    userNotificationSentAt: { type: Date },
    // Response actions
    containmentActions: { type: [String], default: [] },
    remediationActions: { type: [String], default: [] },
    rootCause: { type: String, maxlength: 3000 },
    lessonsLearned: { type: String, maxlength: 3000 },
    // Assignees
    detectedBy: { type: String },
    assignedTo: { type: String },
    // Source
    source: {
      type: String,
      enum: ['AUTOMATED', 'REPORTED', 'EXTERNAL', 'AUDIT'],
      default: 'AUTOMATED',
    },
  },
  { timestamps: true },
);
incidentSchema.index({ severity: 1, status: 1 });
incidentSchema.index({ detectedAt: -1 });

export type IncidentDoc = InferSchemaType<typeof incidentSchema>;
export const Incident = mongoose.models.Incident || model('Incident', incidentSchema);

// ---------------------------------------------------------------------------
// Incident Response Service
// ---------------------------------------------------------------------------

/**
 * Create a new incident — step 1: DETECT
 */
export async function detectIncident(input: {
  title: string;
  description: string;
  severity: keyof typeof INCIDENT_SEVERITY;
  affectedCollections?: string[];
  affectedUserIds?: string[];
  estimatedRecordsBreached?: number;
  dataClassification?: string;
  source?: string;
  detectedBy?: string;
}): Promise<IncidentDoc> {
  const incident = await Incident.create({
    incidentId: newAwarenessId(),
    title: input.title,
    description: input.description,
    severity: input.severity,
    status: 'DETECTED',
    affectedCollections: input.affectedCollections || [],
    affectedUserIds: input.affectedUserIds || [],
    estimatedRecordsBreached: input.estimatedRecordsBreached || 0,
    dataClassification: input.dataClassification as string,
    source: (input.source as string) || 'AUTOMATED',
    detectedBy: input.detectedBy,
    detectedAt: new Date(),
  });

  // Determine notification requirements based on severity and DPDP
  const boardRequired = input.severity === 'HIGH' || input.severity === 'CRITICAL';
  const userRequired = (input.estimatedRecordsBreached || 0) > 0;

  await Incident.updateOne(
    { incidentId: incident.incidentId },
    {
      $set: {
        boardNotificationRequired: boardRequired,
        userNotificationRequired: userRequired,
      },
    },
  );

  await recordAudit({
    action: 'INCIDENT.DETECTED',
    resourceType: 'incident',
    resourceId: incident.incidentId,
    result: 'SUCCESS',
    details: {
      severity: input.severity,
      affectedCollections: input.affectedCollections,
      estimatedRecordsBreached: input.estimatedRecordsBreached,
    },
    severity: input.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
  });

  logger.error(
    {
      incidentId: incident.incidentId,
      severity: input.severity,
      title: input.title,
    },
    'INCIDENT DETECTED',
  );

  return incident;
}

/**
 * Assess the incident — step 2: ASSESS
 */
export async function assessIncident(
  incidentId: string,
  assessment: {
    severity?: keyof typeof INCIDENT_SEVERITY;
    affectedCollections?: string[];
    affectedUserIds?: string[];
    estimatedRecordsBreached?: number;
    dataClassification?: string;
    assignedTo?: string;
  },
): Promise<IncidentDoc | null> {
  const incident = await Incident.findOneAndUpdate(
    { incidentId },
    {
      $set: {
        status: 'ASSESSED',
        assessedAt: new Date(),
        ...(assessment.severity && { severity: assessment.severity }),
        ...(assessment.affectedCollections && { affectedCollections: assessment.affectedCollections }),
        ...(assessment.affectedUserIds && { affectedUserIds: assessment.affectedUserIds }),
        ...(assessment.estimatedRecordsBreached !== undefined && {
          estimatedRecordsBreached: assessment.estimatedRecordsBreached,
        }),
        ...(assessment.dataClassification && { dataClassification: assessment.dataClassification }),
        ...(assessment.assignedTo && { assignedTo: assessment.assignedTo }),
      },
    },
    { new: true },
  );

  if (incident) {
    await recordAudit({
      action: 'INCIDENT.ASSESSED',
      resourceType: 'incident',
      resourceId: incidentId,
      result: 'SUCCESS',
      details: { severity: assessment.severity, assignedTo: assessment.assignedTo },
    });
  }

  return incident;
}

/**
 * Contain the incident — step 3: CONTAIN
 */
export async function containIncident(
  incidentId: string,
  actions: string[],
): Promise<IncidentDoc | null> {
  const incident = await Incident.findOneAndUpdate(
    { incidentId },
    {
      $set: {
        status: 'CONTAINED',
        containedAt: new Date(),
        containmentActions: actions,
      },
    },
    { new: true },
  );

  if (incident) {
    await recordAudit({
      action: 'INCIDENT.CONTAINED',
      resourceType: 'incident',
      resourceId: incidentId,
      result: 'SUCCESS',
      details: { actions },
    });
  }

  return incident;
}

/**
 * Notify the Data Protection Board and affected users — step 4: NOTIFY
 * DPDP Act 2023, Section 8(6): must notify within 72 hours.
 */
export async function notifyIncident(incidentId: string): Promise<IncidentDoc | null> {
  const existing = (await Incident.findOne({ incidentId }).lean().exec()) as IncidentDoc | null;
  if (!existing) return null;

  const now = new Date();
  const hoursSinceDetection = existing.detectedAt
    ? (now.getTime() - new Date(existing.detectedAt).getTime()) / (1000 * 60 * 60)
    : 0;

  // Alert if approaching 72-hour DPDP deadline
  if (hoursSinceDetection > 60) {
    logger.error(
      { incidentId, hoursSinceDetection },
      'DPDP 72-HOUR BREACH NOTIFICATION DEADLINE APPROACHING',
    );
  }

  // Notify affected users
  if (existing.userNotificationRequired && existing.affectedUserIds.length > 0) {
    for (const userId of existing.affectedUserIds) {
      await createNotification({
        userId,
        type: 'PRIVACY',
        title: 'Data breach notification',
        body: 'We are informing you of a data security incident. Please review the details and take recommended actions.',
      });
    }
  }

  const updated = await Incident.findOneAndUpdate(
    { incidentId },
    {
      $set: {
        status: 'NOTIFIED',
        notifiedAt: now,
        boardNotificationSentAt: now,
        userNotificationSentAt: existing.userNotificationRequired ? now : undefined,
      },
    },
    { new: true },
  );

  await recordAudit({
    action: 'INCIDENT.NOTIFIED',
    resourceType: 'incident',
    resourceId: incidentId,
    result: 'SUCCESS',
    details: {
      boardNotificationRequired: existing.boardNotificationRequired,
      userNotificationRequired: existing.userNotificationRequired,
      affectedUserCount: existing.affectedUserIds.length,
      hoursSinceDetection: Math.round(hoursSinceDetection),
    },
    severity: 'CRITICAL',
  });

  return updated;
}

/**
 * Remediate the incident — step 5: REMEDIATE
 */
export async function remediateIncident(
  incidentId: string,
  actions: string[],
  rootCause: string,
): Promise<IncidentDoc | null> {
  return Incident.findOneAndUpdate(
    { incidentId },
    {
      $set: {
        status: 'REMEDIATED',
        remediatedAt: new Date(),
        remediationActions: actions,
        rootCause,
      },
    },
    { new: true },
  );
}

/**
 * Post-incident review — step 6: REVIEW
 */
export async function reviewIncident(
  incidentId: string,
  lessonsLearned: string,
): Promise<IncidentDoc | null> {
  return Incident.findOneAndUpdate(
    { incidentId },
    {
      $set: {
        status: 'REVIEWED',
        reviewedAt: new Date(),
        lessonsLearned,
      },
    },
    { new: true },
  );
}

/**
 * Get all open incidents (not yet reviewed).
 */
export async function getOpenIncidents() {
  return Incident.find({ status: { $ne: 'REVIEWED' } })
    .sort({ severity: 1, detectedAt: -1 })
    .lean();
}

/**
 * Get incident by ID.
 */
export async function getIncident(incidentId: string) {
  return Incident.findOne({ incidentId }).lean();
}
