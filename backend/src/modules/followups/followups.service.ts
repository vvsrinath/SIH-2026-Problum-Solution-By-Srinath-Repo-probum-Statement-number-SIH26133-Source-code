import { FollowUp } from '../../database/models/FollowUp';
import { DoctorProfile } from '../../database/models/DoctorProfile';
import { PatientProfile } from '../../database/models/PatientProfile';
import { newFollowUpId } from '../../utils/id';
import { recordAudit } from '../../services/audit.service';
import { createNotification } from '../../services/notification.service';
import { NotFoundError, AuthError, ForbiddenError } from '../../utils/errors';

export interface CreateFollowUpInput {
  actorUserId: string;
  actorRole: string;
  patientUserId: string;
  appointmentId?: string;
  scheduledAt?: string;
  reason?: string;
  instructions?: string;
  ip?: string;
  requestId?: string;
}

export async function createFollowUp(input: CreateFollowUpInput) {
  const patient = await PatientProfile.findOne({ internalUserId: input.patientUserId }).lean();
  if (!patient) throw new NotFoundError('Follow-up target patient not found');

  let doctorId: string | undefined;
  if (input.actorRole === 'DOCTOR') {
    const doctor = await DoctorProfile.findOne({ internalUserId: input.actorUserId }).lean();
    if (!doctor) throw new AuthError('Doctor profile not found');
    doctorId = doctor.doctorId;
  }

  const followUp = await FollowUp.create({
    followUpId: newFollowUpId(),
    patientId: patient.patientId,
    doctorId: doctorId || 'unassigned',
    appointmentId: input.appointmentId,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    reason: input.reason,
    instructions: input.instructions,
    status: input.scheduledAt ? 'SCHEDULED' : 'PENDING',
    createdByUserId: input.actorUserId,
    createdByRole: input.actorRole,
  });

  await recordAudit({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    action: 'FOLLOWUP.CREATE',
    resourceType: 'followUp',
    resourceId: followUp.followUpId,
    result: 'SUCCESS',
    requestId: input.requestId,
    ip: input.ip,
  });
  await createNotification({
    userId: input.patientUserId,
    type: 'FOLLOWUP',
    title: 'Follow-up scheduled',
    body: 'A follow-up has been scheduled for you.',
    link: `/followups/${followUp.followUpId}`,
  });

  return followUp;
}

export async function listFollowUps(userId: string, role: string) {
  if (role === 'PATIENT') {
    const patient = await PatientProfile.findOne({ internalUserId: userId }).lean();
    if (!patient) return [];
    return FollowUp.find({ patientId: patient.patientId }).sort({ scheduledAt: -1 }).lean();
  }
  if (role === 'DOCTOR') {
    const doctor = await DoctorProfile.findOne({ internalUserId: userId }).lean();
    if (!doctor) return [];
    return FollowUp.find({ doctorId: doctor.doctorId }).sort({ scheduledAt: -1 }).lean();
  }
  if (role === 'HEALTH_WORKER') {
    return FollowUp.find().sort({ scheduledAt: -1 }).lean();
  }
  return [];
}

export async function completeFollowUp(id: string, userId: string, role: string, ip?: string, requestId?: string) {
  const followUp = await FollowUp.findOne({ followUpId: id }).lean();
  if (!followUp || !['PENDING', 'SCHEDULED'].includes(followUp.status)) {
    throw new NotFoundError('Follow-up is not available to complete');
  }
  if (role === 'PATIENT') {
    const patient = await PatientProfile.findOne({ internalUserId: userId }).lean();
    if (!patient || patient.patientId !== followUp.patientId) {
      throw new ForbiddenError('You can only complete your own follow-ups');
    }
  }
  await FollowUp.updateOne(
    { followUpId: id },
    { $set: { status: 'COMPLETED', completedAt: new Date() } },
  );

  await recordAudit({
    actorUserId: userId,
    actorRole: role,
    action: 'FOLLOWUP.COMPLETE',
    resourceType: 'followUp',
    resourceId: followUp.followUpId,
    result: 'SUCCESS',
    requestId,
    ip,
  });
  return { ...followUp, status: 'COMPLETED', completedAt: new Date() };
}
