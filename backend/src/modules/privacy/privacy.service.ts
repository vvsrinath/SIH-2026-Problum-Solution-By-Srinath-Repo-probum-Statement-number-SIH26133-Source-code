import { Consent } from '../../database/models/Consent';
import { User } from '../../database/models/User';
import { PatientProfile } from '../../database/models/PatientProfile';
import { Appointment } from '../../database/models/Appointment';
import { TriageAssessment } from '../../database/models/TriageAssessment';
import { Referral } from '../../database/models/Referral';
import { FollowUp } from '../../database/models/FollowUp';
import { PrivacyRequest } from '../../database/models/PrivacyRequest';
import { newPrivacyRequestId } from '../../utils/id';
import { recordAudit } from '../../services/audit.service';
import { createNotification } from '../../services/notification.service';
import { NotFoundError } from '../../utils/errors';
import logger from '../../config/logger';

export interface PrivacyRequestInput {
  userId: string;
  type: string;
  describeData?: string;
  correctionDetails?: string;
  rationale?: string;
  ip?: string;
  requestId?: string;
}

export async function submitPrivacyRequest(input: PrivacyRequestInput) {
  const doc = await PrivacyRequest.create({
    privacyRequestId: newPrivacyRequestId(),
    userId: input.userId,
    type: input.type,
    describeData: input.describeData,
    correctionDetails: input.correctionDetails,
    rationale: input.rationale,
    status: 'SUBMITTED',
  });

  await recordAudit({
    actorUserId: input.userId,
    action: 'PRIVACY.SUBMIT',
    resourceType: 'privacyRequest',
    resourceId: doc.privacyRequestId,
    result: 'SUCCESS',
    requestId: input.requestId,
    ip: input.ip,
    details: { type: input.type },
  });
  await createNotification({
    userId: input.userId,
    type: 'PRIVACY',
    title: 'Privacy request received',
    body: 'Your data-request has been submitted and is under review.',
  });

  return doc;
}

export async function listMyPrivacyRequests(userId: string) {
  return PrivacyRequest.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function getPrivacyRequest(id: string, userId: string) {
  const doc = await PrivacyRequest.findOne({ privacyRequestId: id, userId }).lean();
  if (!doc) throw new NotFoundError('Privacy request not found');
  return doc;
}

export async function decidePrivacyRequest(
  privacyRequestId: string,
  reviewerUserId: string,
  status: 'APPROVED' | 'REJECTED',
  decisionNote?: string,
  ip?: string,
  requestId?: string,
) {
  const doc = await PrivacyRequest.findOne({ privacyRequestId }).lean();
  if (!doc) throw new NotFoundError('Privacy request not found');
  if (doc.status !== 'SUBMITTED' && doc.status !== 'UNDER_REVIEW') {
    throw new Error('Request already decided');
  }

  const updated = await PrivacyRequest.findOneAndUpdate(
    { privacyRequestId },
    {
      $set: {
        status,
        reviewerUserId,
        decidedAt: new Date(),
        decisionNote: decisionNote || '',
      },
    },
    { new: true },
  ).lean();

  await recordAudit({
    actorUserId: reviewerUserId,
    action: `PRIVACY.${status}`,
    resourceType: 'privacyRequest',
    resourceId: privacyRequestId,
    result: 'SUCCESS',
    requestId,
    ip,
    details: { type: doc.type, decision: status },
  });
  await createNotification({
    userId: doc.userId,
    type: 'PRIVACY',
    title: `Privacy request ${status.toLowerCase()}`,
    body: `Your ${doc.type.toLowerCase()} request has been ${status.toLowerCase()}.`,
  });

  return updated;
}

export async function exportUserData(userId: string) {
  const consents = await Consent.find({ userId }).lean();
  const privacyRequests = await PrivacyRequest.find({ userId }).lean();
  return {
    exportedAt: new Date().toISOString(),
    userId,
    consents,
    privacyRequests,
  };
}

export async function exportFullUserData(userId: string) {
  const user = await User.findOne({ _id: userId }).lean();
  const consents = await Consent.find({ userId }).lean();
  const privacyRequests = await PrivacyRequest.find({ userId }).lean();
  const profile = await PatientProfile.findOne({ userId }).lean();
  const appointments = await Appointment.find({ patientId: userId }).lean();
  const triage = await TriageAssessment.find({ patientId: userId }).lean();
  const referrals = await Referral.find({ patientId: userId }).lean();
  const followUps = await FollowUp.find({ patientId: userId }).lean();

  return {
    exportedAt: new Date().toISOString(),
    userId,
    user: user
      ? {
          internalUserId: user.internalUserId,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
        }
      : null,
    consents,
    privacyRequests,
    profile,
    appointments,
    triage,
    referrals,
    followUps,
  };
}

export async function eraseAllUserData(userId: string) {
  const results = await Promise.all([
    Consent.deleteMany({ userId }),
    PrivacyRequest.deleteMany({ userId }),
    PatientProfile.deleteMany({ userId }),
    Appointment.deleteMany({ patientId: userId }),
    TriageAssessment.deleteMany({ patientId: userId }),
    Referral.deleteMany({ patientId: userId }),
    FollowUp.deleteMany({ patientId: userId }),
    User.updateOne(
      { _id: userId },
      {
        $set: {
          status: 'DISABLED',
        },
      },
    ),
  ]);

  await recordAudit({
    actorUserId: userId,
    action: 'USER.ERASE_ALL',
    resourceType: 'user',
    resourceId: userId,
    result: 'SUCCESS',
    details: { collections: results.length },
  });

  logger.info(`Full data erasure completed for user ${userId}`);

  return { erased: true, collections: results.length };
}
