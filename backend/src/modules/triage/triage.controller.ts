import type { Request, Response } from 'express';
import { assessTriage, getTriageForPatient } from './triage.service';
import { PatientProfile } from '../../database/models/PatientProfile';
import { NotFoundError, AuthError, ForbiddenError } from '../../utils/errors';
import { sendSuccess } from '../../utils/response';

export async function assess(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  if (req.auth.role !== 'PATIENT') throw new ForbiddenError();
  const patient = await PatientProfile.findOne({ internalUserId: req.auth.internalUserId }).lean();
  if (!patient) throw new NotFoundError('Patient profile not found');

  const result = await assessTriage({
    patientId: String(patient.patientId),
    actorUserId: req.auth.internalUserId,
    symptoms: req.body.symptoms,
    duration: req.body.duration,
    ageGroup: req.body.ageGroup,
    language: req.body.language,
    context: req.body.context,
    requestId: req.requestId,
    ip: req.ip,
  });
  return sendSuccess(res, { assessment: result }, 201);
}

export async function getTriage(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  if (req.auth.role !== 'PATIENT') throw new ForbiddenError();
  const assessment = await getTriageForPatient(req.params.id, req.auth.internalUserId);
  return sendSuccess(res, { assessment });
}
