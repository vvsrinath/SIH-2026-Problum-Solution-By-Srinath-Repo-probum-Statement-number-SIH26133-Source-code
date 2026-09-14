import type { Request, Response } from 'express';
import { bookAppointment, transitionAppointment, listAppointmentsForActor } from './appointments.service';
import { PatientProfile } from '../../database/models/PatientProfile';
import { DoctorProfile } from '../../database/models/DoctorProfile';
import { NotFoundError, AuthError, ForbiddenError } from '../../utils/errors';
import { sendSuccess } from '../../utils/response';

async function patientIdFor(userId: string): Promise<string> {
  const p = await PatientProfile.findOne({ internalUserId: userId }).lean();
  if (!p) throw new NotFoundError('Patient profile not found');
  return String(p.patientId);
}

export async function createAppointment(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  if (req.auth.role !== 'PATIENT') throw new ForbiddenError();
  const patientId = await patientIdFor(req.auth.internalUserId);
  const appointment = await bookAppointment({
    patientId,
    actorUserId: req.auth.internalUserId,
    doctorId: req.body.doctorId,
    scheduledAt: new Date(req.body.scheduledAt),
    consultationType: req.body.consultationType,
    reason: req.body.reason,
    requestId: req.requestId,
    ip: req.ip,
  });
  return sendSuccess(res, { appointment }, 201);
}

export async function listAppointments(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const q = req.query as unknown as { status?: string; page: number; limit: number };
  const result = await listAppointmentsForActor(req.auth.internalUserId, req.auth.role, { status: q.status, page: q.page, limit: q.limit });
  return sendSuccess(res, result);
}

export async function getAppointmentById(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const { Appointment } = await import('../../database/models/Appointment');
  const appointment = await Appointment.findOne({ appointmentId: req.params.id }).lean();
  if (!appointment) throw new NotFoundError('Appointment not found');

  await assertActorAccess(req.auth.internalUserId, req.auth.role, appointment as never);
  return sendSuccess(res, { appointment });
}

export async function cancelAppointment(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const { Appointment } = await import('../../database/models/Appointment');
  const appointment = await Appointment.findOne({ appointmentId: req.params.id }).lean();
  if (!appointment) throw new NotFoundError('Appointment not found');
  await assertActorAccess(req.auth.internalUserId, req.auth.role, appointment as never);

  const updated = await transitionAppointment(req.params.id, 'CANCEL', {
    actorUserId: req.auth.internalUserId,
    actorRole: req.auth.role,
    requestId: req.requestId,
    ip: req.ip,
    reason: (req.body as { reason?: string }).reason,
  });
  return sendSuccess(res, { appointment: updated });
}

export async function confirmAppointment(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  if (req.auth.role !== 'DOCTOR') throw new ForbiddenError();
  const updated = await transitionAppointment(req.params.id, 'CONFIRM', {
    actorUserId: req.auth.internalUserId,
    actorRole: req.auth.role,
    requestId: req.requestId,
    ip: req.ip,
  });
  return sendSuccess(res, { appointment: updated });
}

export async function startAppointment(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  if (req.auth.role !== 'DOCTOR') throw new ForbiddenError();
  const updated = await transitionAppointment(req.params.id, 'START', {
    actorUserId: req.auth.internalUserId,
    actorRole: req.auth.role,
    requestId: req.requestId,
    ip: req.ip,
  });
  return sendSuccess(res, { appointment: updated });
}

export async function completeAppointment(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  if (req.auth.role !== 'DOCTOR') throw new ForbiddenError();
  const updated = await transitionAppointment(req.params.id, 'COMPLETE', {
    actorUserId: req.auth.internalUserId,
    actorRole: req.auth.role,
    requestId: req.requestId,
    ip: req.ip,
  });
  return sendSuccess(res, { appointment: updated });
}

/** Enforce that a patient/doctor can only view appointments they belong to. */
async function assertActorAccess(
  internalUserId: string,
  role: string,
  appointment: { patientId: string; doctorId: string },
) {
  if (role === 'PATIENT') {
    const patientId = await patientIdFor(internalUserId);
    if (appointment.patientId !== patientId) throw new ForbiddenError();
    return;
  }
  if (role === 'DOCTOR') {
    const doc = await DoctorProfile.findOne({ internalUserId }).lean();
    if (!doc || appointment.doctorId !== doc.doctorId) throw new ForbiddenError();
    return;
  }
  throw new ForbiddenError();
}
