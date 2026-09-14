import type { Request, Response } from 'express';
import { DoctorProfile } from '../../database/models/DoctorProfile';
import { DoctorAvailability, AvailabilityException } from '../../database/models/DoctorAvailability';
import { NotFoundError, AuthError, ForbiddenError } from '../../utils/errors';
import { sendSuccess } from '../../utils/response';

async function doctorIdFor(userId: string): Promise<string> {
  const doc = await DoctorProfile.findOne({ internalUserId: userId }).lean();
  if (!doc) throw new NotFoundError('Doctor profile not found');
  return String(doc.doctorId);
}

export async function listMyAvailability(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const doctorId = await doctorIdFor(req.auth.internalUserId);
  const weekly = await DoctorAvailability.find({ doctorId, active: true }).lean();
  const exceptions = await AvailabilityException.find({ doctorId }).lean();
  return sendSuccess(res, { doctorId, weekly, exceptions });
}

export async function upsertAvailability(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const doctorId = await doctorIdFor(req.auth.internalUserId);
  const slot = await DoctorAvailability.updateOne(
    { doctorId, dayOfWeek: req.body.dayOfWeek },
    {
      $set: {
        doctorId,
        dayOfWeek: req.body.dayOfWeek,
        startMinute: req.body.startMinute,
        endMinute: req.body.endMinute,
        timezone: req.body.timezone,
        active: req.body.active ?? true,
        consultationDurationMinutes: req.body.consultationDurationMinutes ?? 15,
      },
    },
    { upsert: true },
  );
  return sendSuccess(res, { updated: Boolean(slot.upsertedCount || slot.modifiedCount) });
}

export async function removeAvailability(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const doctorId = await doctorIdFor(req.auth.internalUserId);
  const slot = await DoctorAvailability.findOne({ _id: req.params.id, doctorId }).lean();
  if (!slot) throw new NotFoundError('Availability slot not found');
  await DoctorAvailability.deleteOne({ _id: req.params.id });
  return res.status(204).send();
}

export async function setException(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const doctorId = await doctorIdFor(req.auth.internalUserId);
  await AvailabilityException.updateOne(
    { doctorId, date: new Date(req.body.date) },
    { $set: { doctorId, date: new Date(req.body.date), reason: req.body.reason, startMinute: req.body.startMinute, endMinute: req.body.endMinute } },
    { upsert: true },
  );
  return sendSuccess(res, { done: true });
}

export function ensureDoctorRole(req: Request, _res: Response, next: import('express').NextFunction) {
  if (!req.auth) return next(new AuthError());
  if (req.auth.role !== 'DOCTOR') return next(new ForbiddenError());
  return next();
}
