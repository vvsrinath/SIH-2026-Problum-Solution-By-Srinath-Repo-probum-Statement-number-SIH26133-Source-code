import type { Request, Response } from 'express';
import { AuthError, ForbiddenError } from '../../utils/errors';
import { sendSuccess } from '../../utils/response';
import { discoverNearbyHospitals } from './hospitals.service';

export async function nearby(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  if (req.auth.role !== 'PATIENT') throw new ForbiddenError();
  const result = await discoverNearbyHospitals({
    lat: req.query.lat as unknown as number,
    lng: req.query.lng as unknown as number,
    radiusKm: req.query.radius as unknown as number,
    type: req.query.type as string,
    language: typeof req.query.language === 'string' ? req.query.language : 'en',
    requesterUserId: req.auth.internalUserId,
  });
  return sendSuccess(res, { ...result });
}
