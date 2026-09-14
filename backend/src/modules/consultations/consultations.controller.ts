import type { Request, Response } from 'express';
import { Consultation } from '../../database/models/Consultation';
import { Appointment } from '../../database/models/Appointment';
import { PatientProfile } from '../../database/models/PatientProfile';
import { DoctorProfile } from '../../database/models/DoctorProfile';
import { NotFoundError, AuthError, ForbiddenError, ConflictError, UnavailableError } from '../../utils/errors';
import { sendSuccess } from '../../utils/response';
import { bharatVCProvider } from '../../integrations/bharatvc/bharatvc.provider';
import { newConsultationId } from '../../utils/id';

export async function startConsultation(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const appointment = await Appointment.findOne({ appointmentId: req.params.appointmentId }).lean();
  if (!appointment) throw new NotFoundError('Appointment not found');
  await assertBelongs(req.auth.internalUserId, req.auth.role, appointment.patientId, appointment.doctorId);
  if (appointment.status !== 'CONFIRMED' && appointment.status !== 'BOOKED') {
    throw new ConflictError('Appointment is not ready for consultation', 'APPOINTMENT_NOT_READY');
  }

  const existing = await Consultation.findOne({ appointmentId: appointment.appointmentId }).lean();
  let consultation = existing;
  if (!consultation) {
    consultation = await Consultation.create({
      consultationId: newConsultationId(),
      appointmentId: appointment.appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      provider: appointment.consultationType === 'IN_PERSON' ? 'IN_PERSON' : 'BHARATVC',
      status: 'SCHEDULED',
    });
  }

  // Only gather join info for video (BharatVC) consultations.
  if (consultation.provider === 'BHARATVC') {
    let joinInfo: { joinUrl: string } | null = null;
    try {
      if (!consultation.providerReference) {
        const created = await bharatVCProvider.createSession({
          appointmentId: appointment.appointmentId,
          participantIds: [appointment.patientId, appointment.doctorId],
        });
        await Consultation.updateOne({ consultationId: consultation.consultationId }, { providerReference: created.providerReference });
        consultation.providerReference = created.providerReference;
      }
      const participantId = req.auth.role === 'PATIENT' ? appointment.patientId : appointment.doctorId;
      joinInfo = await bharatVCProvider.getJoinInformation({
        providerReference: consultation.providerReference,
        participantId,
      });
    } catch (err) {
      if (err instanceof UnavailableError) {
        // Appointment remains valid; let caller know teleconsultation is down.
        return sendSuccess(res, { consultation, teleconsultation: { available: false } });
      }
      throw err;
    }
    return sendSuccess(res, { consultation, teleconsultation: { available: true }, joinInfo });
  }

  return sendSuccess(res, { consultation });
}

export async function getConsultation(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const consultation = await Consultation.findOne({ consultationId: req.params.id }).lean();
  if (!consultation) throw new NotFoundError('Consultation not found');
  await assertBelongs(req.auth.internalUserId, req.auth.role, consultation.patientId, consultation.doctorId);
  return sendSuccess(res, { consultation });
}

export async function endConsultation(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const consultation = await Consultation.findOne({ consultationId: req.params.id }).lean();
  if (!consultation) throw new NotFoundError('Consultation not found');
  await assertBelongs(req.auth.internalUserId, req.auth.role, consultation.patientId, consultation.doctorId);

  if (consultation.provider === 'BHARATVC' && consultation.providerReference) {
    try {
      await bharatVCProvider.endSession({ providerReference: consultation.providerReference });
    } catch {
      /* do not fail the end-request if provider is unavailable */
    }
  }
  await Consultation.updateOne({ consultationId: req.params.id }, { $set: { status: 'ENDED', endedAt: new Date() } });
  return sendSuccess(res, { consultation: { ...consultation, status: 'ENDED' } });
}

async function assertBelongs(internalUserId: string, role: string, patientId: string, doctorId: string) {
  if (role === 'PATIENT') {
    const p = await PatientProfile.findOne({ internalUserId }).lean();
    if (!p || p.patientId !== patientId) throw new ForbiddenError();
    return;
  }
  if (role === 'DOCTOR') {
    const d = await DoctorProfile.findOne({ internalUserId }).lean();
    if (!d || d.doctorId !== doctorId) throw new ForbiddenError();
    return;
  }
  throw new ForbiddenError();
}
