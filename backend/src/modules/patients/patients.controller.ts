import type { Request, Response } from 'express';
import { PatientProfile } from '../../database/models/PatientProfile';
import { NotFoundError, AuthError } from '../../utils/errors';
import { recordAudit } from '../../services/audit.service';
import { sendSuccess } from '../../utils/response';
import { requirePermission } from '../../middleware/authorization';
import { PERMISSION } from '../../constants/roles';

async function findPatientProfile(internalUserId: string) {
  const profile = await PatientProfile.findOne({ internalUserId }).lean();
  if (!profile) throw new NotFoundError('Patient profile not found');
  return profile;
}

export async function getMyPatientProfile(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const profile = await findPatientProfile(req.auth.internalUserId);
  return sendSuccess(res, { patient: profile });
}

export async function patchMyPatientProfile(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const profile = await findPatientProfile(req.auth.internalUserId);

  const patch = patientPatchable(req.body);
  await PatientProfile.updateOne({ internalUserId: req.auth.internalUserId }, { $set: patch });

  await recordAudit({
    actorUserId: req.auth.internalUserId,
    actorRole: 'PATIENT',
    action: 'PATIENT_PROFILE_UPDATED',
    resourceType: 'patient',
    resourceId: String(profile.patientId),
    result: 'SUCCESS',
    requestId: req.requestId,
    ip: req.ip,
  });

  return sendSuccess(res, { patient: await findPatientProfile(req.auth.internalUserId) });
}

export const readSelfPermission = requirePermission(PERMISSION.PROFILE_READ_SELF);
export const updateSelfPermission = requirePermission(PERMISSION.PROFILE_UPDATE_SELF);

function patientPatchable(body: Record<string, unknown>) {
  const keys = [
    'displayName',
    'dateOfBirth',
    'sex',
    'preferredLanguage',
    'preferredConsultationMode',
    'accessibilityPreferences',
    'emergencyContactName',
    'emergencyContactPhone',
    'addressRegion',
    'addressDistrict',
  ];
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in body) out[k] = body[k];
  return out;
}
