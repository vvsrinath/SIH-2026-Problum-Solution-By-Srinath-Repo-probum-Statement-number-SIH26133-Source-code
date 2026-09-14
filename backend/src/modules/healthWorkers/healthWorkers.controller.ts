import type { Request, Response } from 'express';
import { HealthWorkerProfile } from '../../database/models/HealthWorkerProfile';
import { NotFoundError, AuthError } from '../../utils/errors';
import { sendSuccess } from '../../utils/response';

export async function getMyHealthWorkerProfile(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const profile = await HealthWorkerProfile.findOne({ internalUserId: req.auth.internalUserId }).lean();
  if (!profile) throw new NotFoundError('Health worker profile not found');
  return sendSuccess(res, { healthWorker: profile });
}
