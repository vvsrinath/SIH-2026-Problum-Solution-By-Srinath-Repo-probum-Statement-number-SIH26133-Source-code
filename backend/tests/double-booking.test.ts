import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectTestDb, resetCollections } from './setup';
import { DoctorProfile } from '../src/database/models/DoctorProfile';
import { DoctorAvailability } from '../src/database/models/DoctorAvailability';
import { SlotLock } from '../src/database/models/SlotLock';
import { bookAppointment } from '../src/modules/appointments/appointments.service';
import { newDoctorId, newPatientId } from '../src/utils/id';
import { ConflictError } from '../src/utils/errors';

const TZ = 'Asia/Kolkata';

function istWeekdayAndMinute(date: Date): { weekday: number; minute: number } {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) parts[p.type] = p.value;
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  let wd = dayMap[parts.weekday ?? 'Sun'] ?? 0;
  let hour = Number(parts.hour ?? '0');
  if (hour === 24) { hour = 0; wd = (wd + 1) % 7; }
  return { weekday: wd, minute: hour * 60 + Number(parts.minute ?? '0') };
}

/** Seed a doctor available at a specific future IST time window. */
async function seedDoctorWithSlot() {
  const doctorId = newDoctorId();
  await DoctorProfile.create({ doctorId, internalUserId: `usr-${doctorId}`, displayName: 'Dr Test' });

  const target = new Date(Date.now() + 2 * 86400000);
  target.setUTCHours(10, 0, 0, 0);
  const { weekday, minute } = istWeekdayAndMinute(target);
  const start = Math.max(0, minute - 5);
  const end = Math.min(1439, minute + 25);

  await DoctorAvailability.create({
    doctorId,
    dayOfWeek: weekday,
    startMinute: start,
    endMinute: end,
    timezone: TZ,
    active: true,
    consultationDurationMinutes: 15,
  });

  return { doctorId, target, patientId: newPatientId() };
}

describe('Appointment double-booking protection', () => {
  beforeAll(async () => {
    if (await connectTestDb()) await resetCollections(['doctorprofiles', 'doctoravailabilities', 'slotlocks', 'appointments']);
  });
  afterAll(async () => {});

  it('only one of two concurrent bookings for the same doctor+slot wins', async () => {
    const available = await connectTestDb();
    expect(available).toBe(true);
    if (!available) return;

    const { doctorId, target, patientId } = await seedDoctorWithSlot();

    const attempt = () =>
      bookAppointment({
        patientId,
        actorUserId: 'usr-act',
        doctorId,
        scheduledAt: target,
        consultationType: 'VIDEO',
      });

    const results = await Promise.allSettled([attempt(), attempt()]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
    for (const r of rejected) {
      expect((r as PromiseRejectedResult).reason).toBeInstanceOf(ConflictError);
    }

    const heldLocks = await SlotLock.countDocuments({ doctorId, scheduledAt: target, status: 'HELD' });
    expect(heldLocks).toBe(1);
  });
});
