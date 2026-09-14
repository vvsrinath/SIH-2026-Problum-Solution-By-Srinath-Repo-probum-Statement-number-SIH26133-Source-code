import { Referral } from '../../database/models/Referral';
import { DoctorProfile } from '../../database/models/DoctorProfile';
import { PatientProfile } from '../../database/models/PatientProfile';
import { newReferralId } from '../../utils/id';
import { recordAudit } from '../../services/audit.service';
import { createNotification } from '../../services/notification.service';
import { NotFoundError, AuthError } from '../../utils/errors';

export interface CreateReferralInput {
  actorUserId: string;
  actorRole: string;
  patientUserId: string;
  toFacilityId?: string;
  toDoctorUserId?: string;
  reason?: string;
  clinicalSummary?: string;
  ip?: string;
  requestId?: string;
}

export async function createReferral(input: CreateReferralInput) {
  const doctor = await DoctorProfile.findOne({ internalUserId: input.actorUserId }).lean();
  if (!doctor) throw new AuthError('Doctor profile not found');

  const patient = await PatientProfile.findOne({ internalUserId: input.patientUserId }).lean();
  if (!patient) throw new NotFoundError('Referral target patient not found');

  const toDoctorId = input.toDoctorUserId
    ? (await DoctorProfile.findOne({ internalUserId: input.toDoctorUserId }).lean())?.doctorId
    : undefined;

  const referral = await Referral.create({
    referralId: newReferralId(),
    patientId: patient.patientId,
    fromDoctorId: doctor.doctorId,
    toFacilityId: input.toFacilityId,
    toDoctorId,
    reason: input.reason,
    clinicalSummary: input.clinicalSummary,
    status: 'CREATED',
    createdByUserId: input.actorUserId,
  });

  await recordAudit({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    action: 'REFERRAL.CREATE',
    resourceType: 'referral',
    resourceId: referral.referralId,
    result: 'SUCCESS',
    requestId: input.requestId,
    ip: input.ip,
  });
  await createNotification({
    userId: input.patientUserId,
    type: 'REFERRAL',
    title: 'New referral',
    body: 'A healthcare professional has referred you. Review it when convenient.',
    link: `/referrals/${referral.referralId}`,
  });

  return referral;
}

export async function listReferrals(userId: string, role: string) {
  if (role === 'PATIENT') {
    const patient = await PatientProfile.findOne({ internalUserId: userId }).lean();
    if (!patient) return [];
    return Referral.find({ patientId: patient.patientId }).sort({ createdAt: -1 }).lean();
  }
  if (role === 'DOCTOR') {
    const doctor = await DoctorProfile.findOne({ internalUserId: userId }).lean();
    if (!doctor) return [];
    return Referral.find({
      $or: [{ fromDoctorId: doctor.doctorId }, { toDoctorId: doctor.doctorId }],
    })
      .sort({ createdAt: -1 })
      .lean();
  }
  return [];
}

export async function acceptReferral(id: string, userId: string, role: string, ip?: string, requestId?: string) {
  if (role !== 'DOCTOR') throw new AuthError('Only a doctor can accept a referral');
  const doctor = await DoctorProfile.findOne({ internalUserId: userId }).lean();
  if (!doctor) throw new AuthError('Doctor profile not found');

  const referral = await Referral.findOneAndUpdate(
    { referralId: id, status: 'CREATED', $or: [{ toDoctorId: doctor.doctorId }, { toDoctorId: { $exists: false } }] },
    { $set: { status: 'ACCEPTED', toDoctorId: doctor.doctorId, acceptedAt: new Date() } },
    { new: true },
  ).lean();
  if (!referral) throw new NotFoundError('Referral is not available to accept');

  await recordAudit({
    actorUserId: userId,
    actorRole: role,
    action: 'REFERRAL.ACCEPT',
    resourceType: 'referral',
    resourceId: referral.referralId,
    result: 'SUCCESS',
    requestId,
    ip,
  });
  return referral;
}
