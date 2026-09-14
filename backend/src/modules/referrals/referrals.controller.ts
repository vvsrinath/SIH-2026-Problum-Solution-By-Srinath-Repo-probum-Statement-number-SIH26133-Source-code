import type { Request, Response } from 'express';
import { AuthError } from '../../utils/errors';
import { sendSuccess } from '../../utils/response';
import { createReferral, listReferrals, acceptReferral } from './referrals.service';

export async function create(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const referral = await createReferral({
    actorUserId: req.auth.internalUserId,
    actorRole: req.auth.role,
    patientUserId: req.body.patientUserId,
    toFacilityId: req.body.toFacilityId,
    toDoctorUserId: req.body.toDoctorUserId,
    reason: req.body.reason,
    clinicalSummary: req.body.clinicalSummary,
    ip: req.ip,
    requestId: req.requestId,
  });
  return sendSuccess(res, { referral }, 201);
}

export async function list(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const referrals = await listReferrals(req.auth.internalUserId, req.auth.role);
  return sendSuccess(res, { referrals });
}

export async function accept(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const referral = await acceptReferral(req.params.id, req.auth.internalUserId, req.auth.role, req.ip, req.requestId);
  return sendSuccess(res, { referral });
}
