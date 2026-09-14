import { Consent, CONSENT_PURPOSE } from '../../database/models/Consent';
import { User } from '../../database/models/User';
import { PatientProfile } from '../../database/models/PatientProfile';
import { Appointment } from '../../database/models/Appointment';
import { TriageAssessment } from '../../database/models/TriageAssessment';
import { Referral } from '../../database/models/Referral';
import { FollowUp } from '../../database/models/FollowUp';
import { newConsentId } from '../../utils/id';
import { recordAudit } from '../../services/audit.service';
import { createNotification } from '../../services/notification.service';
import { NotFoundError } from '../../utils/errors';
import logger from '../../config/logger';

export interface ConsentInput {
  userId: string;
  purpose: string;
  version: string;
  text?: string;
  source?: string;
  requestId?: string;
  ip?: string;
}

export async function giveConsent(input: ConsentInput) {
  const consent = await Consent.create({
    consentId: newConsentId(),
    userId: input.userId,
    purpose: input.purpose,
    version: input.version,
    status: 'GRANTED',
    source: input.source || 'PWA',
    text: input.text,
  });

  await recordAudit({
    actorUserId: input.userId,
    action: 'CONSENT.GRANT',
    resourceType: 'consent',
    resourceId: consent.consentId,
    result: 'SUCCESS',
    requestId: input.requestId,
    ip: input.ip,
    details: { purpose: input.purpose, version: input.version },
  });
  await createNotification({
    userId: input.userId,
    type: 'CONSENT',
    title: 'Consent recorded',
    body: 'Your consent preference has been recorded.',
  });

  return consent;
}

export async function listMyConsents(userId: string) {
  return Consent.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function withdrawConsent(consentId: string, userId: string, ip?: string, requestId?: string) {
  const consent = await Consent.findOneAndUpdate(
    { consentId, userId },
    { $set: { status: 'WITHDRAWN', withdrawnAt: new Date() } },
    { new: true }
  ).lean();
  if (!consent) throw new NotFoundError('Consent not found');

  await recordAudit({
    actorUserId: userId,
    action: 'CONSENT.WITHDRAW',
    resourceType: 'consent',
    resourceId: consent.consentId,
    result: 'SUCCESS',
    requestId,
    ip,
    details: { purpose: consent.purpose },
  });
  await createNotification({
    userId,
    type: 'CONSENT',
    title: 'Consent withdrawn',
    body: 'Your consent has been withdrawn as requested.',
  });

  return consent;
}

export { CONSENT_PURPOSE };

// ---------------------------------------------------------------------------
// DPDP Consent Lifecycle
// ---------------------------------------------------------------------------

/**
 * Check consent validity — expired consents are auto-expired.
 * Must be checked before processing data for a given purpose.
 */
export async function isConsentValid(userId: string, purpose: string): Promise<boolean> {
  const consent = await Consent.findOne({
    userId,
    purpose,
    status: 'GRANTED',
  }).sort({ createdAt: -1 }).lean();

  if (!consent) return false;

  // Consent expires after 1 year if not explicitly renewed
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  if (consent.createdAt && new Date(consent.createdAt) < oneYearAgo) {
    await Consent.updateOne(
      { consentId: consent.consentId },
      { $set: { status: 'EXPIRED' } },
    );
    return false;
  }

  return true;
}

/**
 * Enforce consent expiry — expire consents older than 1 year.
 * Run as scheduled job.
 */
export async function enforceConsentExpiry(): Promise<number> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const result = await Consent.updateMany(
    { status: 'GRANTED', createdAt: { $lt: oneYearAgo } },
    { $set: { status: 'EXPIRED' } },
  );

  if (result.modifiedCount > 0) {
    logger.info({ expired: result.modifiedCount }, 'consent expiry enforcement');
    await recordAudit({
      action: 'CONSENT.EXPIRY_ENFORCEMENT',
      resourceType: 'consent',
      result: 'SUCCESS',
      details: { expiredCount: result.modifiedCount },
    });
  }

  return result.modifiedCount;
}

/**
 * Get consent summary for a user — which purposes are consented.
 */
export async function getConsentSummary(userId: string) {
  const purposes = Object.values(CONSENT_PURPOSE);
  const summary: Record<string, { status: string; lastUpdated: string | null }> = {};

  for (const purpose of purposes) {
    const consent = await Consent.findOne({ userId, purpose })
      .sort({ createdAt: -1 })
      .lean();
    summary[purpose] = {
      status: consent?.status || 'NOT_GIVEN',
      lastUpdated: consent?.createdAt?.toISOString() || null,
    };
  }

  return summary;
}

// ---------------------------------------------------------------------------
// DPDP Data Subject Rights — Full Data Erasure
// ---------------------------------------------------------------------------

/**
 * Erase all user data — DPDP right to erasure (Section 17).
 * Deletes user profile, appointments, triage, referrals, follow-ups.
 * Retains: audit logs (regulatory), consent records (DPDP proof).
 */
export async function eraseAllUserData(userId: string): Promise<{
  deleted: Record<string, number>;
  retained: string[];
}> {
  const deleted: Record<string, number> = {};
  const retained: string[] = [];

  // Delete patient profile
  const profileResult = await PatientProfile.deleteOne({ internalUserId: userId });
  deleted['patientprofiles'] = profileResult.deletedCount;

  // Delete appointments
  const apptResult = await Appointment.deleteMany({ patientId: userId });
  deleted['appointments'] = apptResult.deletedCount;

  // Delete triage assessments
  const triageResult = await TriageAssessment.deleteMany({ patientId: userId });
  deleted['triageassessments'] = triageResult.deletedCount;

  // Delete referrals (where patient)
  const refResult = await Referral.deleteMany({ patientId: userId });
  deleted['referrals'] = refResult.deletedCount;

  // Delete follow-ups (where patient)
  const fuResult = await FollowUp.deleteMany({ patientId: userId });
  deleted['followups'] = fuResult.deletedCount;

  // Mark user as disabled (don't delete — needed for audit trail)
  await User.updateOne(
    { internalUserId: userId },
    { $set: { status: 'DISABLED' } },
  );

  // Retain audit logs and consent records (DPDP regulatory requirement)
  retained.push('auditlogs', 'consents');

  await recordAudit({
    actorUserId: userId,
    action: 'PRIVACY.DATA_ERASURE',
    resourceType: 'user',
    resourceId: userId,
    result: 'SUCCESS',
    details: { deleted, retained },
    severity: 'CRITICAL',
  });

  await createNotification({
    userId,
    type: 'PRIVACY',
    title: 'Data erasure complete',
    body: 'Your personal data has been erased as requested. Audit logs and consent records are retained per regulatory requirements.',
  });

  logger.warn({ userId, deleted, retained }, 'USER DATA ERASED');

  return { deleted, retained };
}

/**
 * Full data export — DPDP data portability (Section 16).
 * Returns ALL user data in a portable format.
 */
export async function exportFullUserData(userId: string) {
  const user = await User.findOne({ internalUserId: userId }).lean();
  const profile = await PatientProfile.findOne({ internalUserId: userId }).lean();
  const consents = await Consent.find({ userId }).lean();
  const privacyRequests = await (await import('../../database/models/PrivacyRequest')).PrivacyRequest
    .find({ userId }).lean();
  const appointments = await Appointment.find({ patientId: userId }).lean();
  const triage = await TriageAssessment.find({ patientId: userId }).lean();
  const referrals = await Referral.find({ patientId: userId }).lean();
  const followups = await FollowUp.find({ patientId: userId }).lean();

  await recordAudit({
    actorUserId: userId,
    action: 'PRIVACY.DATA_EXPORT',
    resourceType: 'user',
    resourceId: userId,
    result: 'SUCCESS',
    details: {
      sections: ['profile', 'consents', 'privacyRequests', 'appointments', 'triage', 'referrals', 'followups'],
    },
  });

  return {
    exportedAt: new Date().toISOString(),
    userId,
    data: {
      profile,
      consents,
      privacyRequests,
      appointments,
      triageAssessments: triage,
      referrals,
      followups,
    },
    metadata: {
      format: 'Swasthya Sathi DPDP Export v1.0',
      disclaimer: 'This export contains your personal data as stored by Swasthya Sathi.',
    },
  };
}
