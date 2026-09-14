import type { Request, Response } from 'express';
import { AuthError } from '../../utils/errors';
import { sendSuccess } from '../../utils/response';
import { createFollowUp, listFollowUps, completeFollowUp } from './followups.service';

export async function create(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const followUp = await createFollowUp({
    actorUserId: req.auth.internalUserId,
    actorRole: req.auth.role,
    patientUserId: req.body.patientUserId,
    appointmentId: req.body.appointmentId,
    scheduledAt: req.body.scheduledAt,
    reason: req.body.reason,
    instructions: req.body.instructions,
    ip: req.ip,
    requestId: req.requestId,
  });
  return sendSuccess(res, { followUp }, 201);
}

export async function list(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const followUps = await listFollowUps(req.auth.internalUserId, req.auth.role);
  return sendSuccess(res, { followUps });
}

export async function complete(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const followUp = await completeFollowUp(req.params.id, req.auth.internalUserId, req.auth.role, req.ip, req.requestId);
  return sendSuccess(res, { followUp });
}
