import type { Request, Response } from 'express';
import { listDoctors, getDoctor, getDoctorAvailability } from './doctors.service';
import { sendSuccess } from '../../utils/response';

export async function handleListDoctors(req: Request, res: Response) {
  const q = req.query as unknown as { specialization?: string; page: number; limit: number };
  const result = await listDoctors({ specialization: q.specialization, page: q.page, limit: q.limit });
  return sendSuccess(res, result);
}

export async function handleGetDoctor(req: Request, res: Response) {
  const doctor = await getDoctor(req.params.id);
  return sendSuccess(res, { doctor });
}

export async function handleGetDoctorAvailability(req: Request, res: Response) {
  const availability = await getDoctorAvailability(req.params.id);
  return sendSuccess(res, availability);
}
