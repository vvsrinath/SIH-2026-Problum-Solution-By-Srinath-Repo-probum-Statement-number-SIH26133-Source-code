import mongoose from 'mongoose';
import { Appointment, APPOINTMENT_STATUS } from '../../database/models/Appointment';
import { SlotLock } from '../../database/models/SlotLock';
import { DoctorProfile } from '../../database/models/DoctorProfile';
import { DoctorAvailability, AvailabilityException } from '../../database/models/DoctorAvailability';
import { Consultation } from '../../database/models/Consultation';
import { newAppointmentId, newConsultationId } from '../../utils/id';
import { recordAudit } from '../../services/audit.service';
import { NotFoundError, ConflictError, UnavailableError, ForbiddenError } from '../../utils/errors';
import type { Role } from '../../constants/roles';

interface BookAppointmentInput {
  patientId: string;
  actorUserId: string;
  doctorId: string;
  scheduledAt: Date;
  consultationType: 'IN_PERSON' | 'VIDEO' | 'AUDIO';
  reason?: string;
  requestId?: string;
  ip?: string;
}

/** Resolve the local weekday (0=Sun) and minute-of-day for a UTC date in an IANA timezone. */
function localWeekdayAndMinute(date: Date, timezone: string): { weekday: number; minute: number } {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hour = Number(map.hour ?? '0');
  const minute = Number(map.minute ?? '0');
  let wd = dayMap[map.weekday ?? 'Sun'] ?? 0;
  // If hour>=24 (Intl may give "24" for midnight boundary) normalize.
  if (hour === 24) wd = (wd + 1) % 7;
  const minuteOfDay = (hour % 24) * 60 + minute;
  return { weekday: wd, minute: minuteOfDay };
}

async function validateAvailability(doctorId: string, scheduledAt: Date, durationMinutes: number, doctorTz: string) {
  const { weekday, minute } = localWeekdayAndMinute(scheduledAt, doctorTz);

  const day = new Intl.DateTimeFormat('en-CA', { timeZone: doctorTz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(scheduledAt);
  const [y, m, d] = day.split('-').map(Number);
  const startOfLocalDay = new Date(Date.UTC(y, m - 1, d));

  const [weekly, exceptions] = await Promise.all([
    DoctorAvailability.findOne({ doctorId, dayOfWeek: weekday, active: true, startMinute: { $lte: minute }, endMinute: { $gt: minute } }).lean(),
    AvailabilityException.findOne({ doctorId, date: { $gte: startOfLocalDay, $lt: new Date(startOfLocalDay.getTime() + 86400000) } }).lean(),
  ]);

  if (!weekly) return { ok: false as const, reason: 'DOCTOR_NOT_AVAILABLE' };
  if (exceptions && exceptions.reason !== 'SPECIAL_OPEN') return { ok: false as const, reason: 'DOCTOR_UNAVAILABLE_DATE' };
  if (minute + durationMinutes > weekly.endMinute) return { ok: false as const, reason: 'OUTSIDE_AVAILABILITY' };
  return { ok: true as const };
}

/**
 * Book an appointment atomically.
 *
 * Double-booking protection: a SlotLock document with a unique index on
 * (doctorId, scheduledAt) is created inside the same transaction as the
 * Appointment. Exactly one concurrent booking for a given doctor+time can win;
 * the loser receives a unique-key error and is rejected with 409.
 */
export async function bookAppointment(input: BookAppointmentInput) {
  const doctor = await DoctorProfile.findOne({ doctorId: input.doctorId }).lean();
  if (!doctor) throw new NotFoundError('Doctor not found');

  const tz = ((doctor as unknown as { timezone?: string }).timezone || 'Asia/Kolkata');
  const availabilityTz = await pickDoctorTimezone(input.doctorId, tz);
  const durationMinutes = await inferDuration(input.doctorId);

  const check = await validateAvailability(input.doctorId, input.scheduledAt, durationMinutes, availabilityTz);
  if (!check.ok) throw new ConflictError('Selected slot is not within the doctor\'s availability', 'APPOINTMENT_SLOT_UNAVAILABLE');

  if (input.scheduledAt.getTime() < Date.now()) {
    throw new ConflictError('Cannot book an appointment in the past', 'APPOINTMENT_IN_PAST');
  }

  const session = await mongoose.startSession();
  try {
    type CreatedAppointment = Awaited<ReturnType<typeof Appointment.create>>[number];
    let result: CreatedAppointment | undefined;
    await session.withTransaction(async () => {
      const appointment = await Appointment.create(
        [
          {
            appointmentId: newAppointmentId(),
            patientId: input.patientId,
            doctorId: input.doctorId,
            scheduledAt: input.scheduledAt,
            durationMinutes,
            consultationType: input.consultationType,
            status: APPOINTMENT_STATUS.BOOKED,
            reason: input.reason,
            bookedByUserId: input.actorUserId,
          },
        ],
        { session },
      );

      // Unique (doctorId, scheduledAt) index enforces single-winner under concurrency.
      await SlotLock.create(
        [{ doctorId: input.doctorId, scheduledAt: input.scheduledAt, appointmentId: appointment[0].appointmentId }],
        { session },
      );

      result = appointment[0];
    });

    if (!result) throw new UnavailableError('Booking transaction did not complete');

    void recordAudit({
      actorUserId: input.actorUserId,
      action: 'APPOINTMENT_CREATED',
      resourceType: 'appointment',
      resourceId: result.appointmentId,
      result: 'SUCCESS',
      requestId: input.requestId,
      ip: input.ip,
    });

    return result;
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new ConflictError('That appointment slot was just booked by someone else', 'APPOINTMENT_SLOT_UNAVAILABLE');
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

async function pickDoctorTimezone(doctorId: string, fallback: string): Promise<string> {
  const slot = await DoctorAvailability.findOne({ doctorId }).lean();
  return (slot?.timezone as string) || fallback;
}

async function inferDuration(doctorId: string): Promise<number> {
  const slot = await DoctorAvailability.findOne({ doctorId, active: true }).sort({ consultationDurationMinutes: 1 }).lean();
  return (slot?.consultationDurationMinutes as number) || 15;
}

export async function getAppointmentParameters(doctorId: string) {
  const duration = await inferDuration(doctorId);
  return { durationMinutes: duration };
}

function isDuplicateKeyError(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { code?: number }).code === 11000;
}

/* ------------------------------ state changes ------------------------------ */

export async function transitionAppointment(
  appointmentId: string,
  to: 'CANCEL' | 'CONFIRM' | 'START' | 'COMPLETE',
  opts: { actorUserId?: string; actorRole?: Role; requestId?: string; ip?: string; reason?: string },
) {
  const appointment = await Appointment.findOne({ appointmentId }).lean();
  if (!appointment) throw new NotFoundError('Appointment not found');

  let update: Record<string, unknown> = {};
  let action = '';

  switch (to) {
    case 'CANCEL': {
      if (appointment.status !== 'BOOKED' && appointment.status !== 'CONFIRMED') {
        throw new ConflictError('Only pending or confirmed appointments can be cancelled', 'APPOINTMENT_NOT_CANCELLABLE');
      }
      update = { status: APPOINTMENT_STATUS.CANCELLED, cancelledAt: new Date(), cancelledReason: opts.reason, cancelledBy: opts.actorRole ?? 'PATIENT' };
      action = 'APPOINTMENT_CANCELLED';
      await releaseSlot(appointment.doctorId, appointment.scheduledAt, appointment.appointmentId);
      break;
    }
    case 'CONFIRM': {
      if (appointment.status !== 'BOOKED') throw new ConflictError('Appointment is not bookable', 'APPOINTMENT_NOT_CONFIRMABLE');
      update = { status: APPOINTMENT_STATUS.CONFIRMED };
      action = 'APPOINTMENT_CONFIRMED';
      break;
    }
    case 'START': {
      if (appointment.status !== 'CONFIRMED' && appointment.status !== 'BOOKED') {
        throw new ConflictError('Appointment cannot start from this state', 'APPOINTMENT_NOT_STARTABLE');
      }
      const consultation = await Consultation.create({
        consultationId: newConsultationId(),
        appointmentId: appointment.appointmentId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        provider: appointment.consultationType === 'IN_PERSON' ? 'IN_PERSON' : 'BHARATVC',
        status: 'ACTIVE',
        startedAt: new Date(),
      });
      update = { status: APPOINTMENT_STATUS.IN_PROGRESS, consultationId: consultation.consultationId };
      action = 'CONSULTATION_STARTED';
      break;
    }
    case 'COMPLETE': {
      if (appointment.status !== 'IN_PROGRESS' && appointment.status !== 'CONFIRMED') {
        throw new ConflictError('Appointment cannot complete from this state', 'APPOINTMENT_NOT_COMPLETABLE');
      }
      update = { status: APPOINTMENT_STATUS.COMPLETED };
      action = 'APPOINTMENT_COMPLETED';
      await releaseSlot(appointment.doctorId, appointment.scheduledAt, appointment.appointmentId);
      break;
    }
    default:
      throw new UnavailableError('Unsupported transition');
  }

  await Appointment.updateOne({ appointmentId }, { $set: update });

  void recordAudit({
    actorUserId: opts.actorUserId,
    actorRole: opts.actorRole,
    action,
    resourceType: 'appointment',
    resourceId: appointmentId,
    result: 'SUCCESS',
    requestId: opts.requestId,
    ip: opts.ip,
  });

  return Appointment.findOne({ appointmentId }).lean();
}

/** Release the held slot so the time can be rebooked. */
async function releaseSlot(doctorId: string, scheduledAt: Date, appointmentId: string) {
  const lock = await SlotLock.findOne({ doctorId, scheduledAt, appointmentId }).lean();
  if (lock) {
    await SlotLock.updateOne({ _id: lock._id }, { $set: { status: 'RELEASED', releasedAt: new Date() } });
  } else {
    await SlotLock.create({ doctorId, scheduledAt, appointmentId, status: 'RELEASED' });
  }
}

/** List appointments for the acting user (patient sees own; doctor sees assigned). */
export async function listAppointmentsForActor(
  actorUserId: string,
  actorRole: Role,
  opts: { status?: string; page: number; limit: number },
) {
  let filter: Record<string, unknown> = {};
  if (actorRole === 'PATIENT') {
    const profile = await import('../../database/models/PatientProfile').then((m) => m.PatientProfile.findOne({ internalUserId: actorUserId }).lean());
    filter = { patientId: profile?.patientId };
  } else if (actorRole === 'DOCTOR') {
    const profile = await import('../../database/models/DoctorProfile').then((m) => m.DoctorProfile.findOne({ internalUserId: actorUserId }).lean());
    filter = { doctorId: profile?.doctorId };
  } else {
    throw new ForbiddenError();
  }
  if (opts.status) filter.status = opts.status;

  const total = await Appointment.countDocuments(filter);
  const items = await Appointment.find(filter)
    .sort({ scheduledAt: 1 })
    .skip((opts.page - 1) * opts.limit)
    .limit(opts.limit)
    .lean();

  return { appointments: items, pagination: { page: opts.page, limit: opts.limit, total, totalPages: Math.ceil(total / opts.limit) } };
}
