import { User } from '../../database/models/User';
import { PatientProfile } from '../../database/models/PatientProfile';
import { DoctorProfile } from '../../database/models/DoctorProfile';
import { HealthWorkerProfile } from '../../database/models/HealthWorkerProfile';
import { NotFoundError } from '../../utils/errors';
import { recordAudit } from '../../services/audit.service';
import type { Request } from 'express';

export interface SelfView {
  internalUserId: string;
  role: string;
  profile: Record<string, unknown> | null;
}

/** Compose the caller's own identity + role profile view. */
export async function getSelfView(internalUserId: string): Promise<SelfView> {
  const user = await User.findOne({ internalUserId }).lean();
  if (!user) throw new NotFoundError('User not found');

  let profile: Record<string, unknown> | null = null;
  if (user.role === 'PATIENT') {
    profile = (await PatientProfile.findOne({ internalUserId }).lean()) ?? null;
  } else if (user.role === 'DOCTOR') {
    const p = await DoctorProfile.findOne({ internalUserId }).lean();
    profile = p ? omitVerifiedMeta(p) : null;
  } else if (user.role === 'HEALTH_WORKER') {
    profile = (await HealthWorkerProfile.findOne({ internalUserId }).lean()) ?? null;
  }

  return { internalUserId: user.internalUserId, role: user.role, profile };
}

/** Update allowed self-editable fields on the caller's role profile. */
export async function updateSelf(internalUserId: string, patch: Record<string, unknown>, req: Request): Promise<SelfView> {
  const user = await User.findOne({ internalUserId }).lean();
  if (!user) throw new NotFoundError('User not found');

  if (user.role === 'PATIENT') {
    const allowed = extractPatientFields(patch);
    await PatientProfile.updateOne({ internalUserId }, { $set: allowed });
  } else if (user.role === 'DOCTOR') {
    const allowed = extractDoctorFields(patch);
    await DoctorProfile.updateOne({ internalUserId }, { $set: allowed });
  } else if (user.role === 'HEALTH_WORKER') {
    const allowed = extractHealthWorkerFields(patch);
    await HealthWorkerProfile.updateOne({ internalUserId }, { $set: allowed });
  }

  await recordAudit({
    actorUserId: internalUserId,
    actorRole: user.role,
    action: 'PROFILE_UPDATED',
    resourceType: 'user',
    resourceId: internalUserId,
    result: 'SUCCESS',
    requestId: req.requestId,
    ip: req.ip,
  });

  return getSelfView(internalUserId);
}

function extractPatientFields(patch: Record<string, unknown>) {
  const keys = [
    'displayName',
    'preferredLanguage',
    'preferredConsultationMode',
    'accessibilityPreferences',
    'emergencyContactName',
    'emergencyContactPhone',
    'addressRegion',
    'addressDistrict',
    'dateOfBirth',
    'sex',
  ];
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in patch) out[k] = patch[k];
  return out;
}

function extractDoctorFields(patch: Record<string, unknown>) {
  const keys = ['displayName', 'languages', 'bio'];
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in patch) out[k] = patch[k];
  return out;
}

function extractHealthWorkerFields(patch: Record<string, unknown>) {
  const keys = ['displayName', 'languages'];
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in patch) out[k] = patch[k];
  return out;
}

function omitVerifiedMeta(p: Record<string, unknown>) {
  const { verificationMetadata, ...rest } = p;
  return rest as Record<string, unknown>;
}
