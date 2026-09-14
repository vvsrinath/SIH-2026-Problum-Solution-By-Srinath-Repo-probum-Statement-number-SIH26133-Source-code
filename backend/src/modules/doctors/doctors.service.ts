import { DoctorProfile } from '../../database/models/DoctorProfile';
import { DoctorAvailability, AvailabilityException } from '../../database/models/DoctorAvailability';
import { NotFoundError } from '../../utils/errors';

/** Public-safe view of a doctor (no verification internals, no internal ids). */
export interface DoctorPublicView {
  doctorId: string;
  displayName: string;
  specialization: string | null;
  qualifications: string[];
  facilityName: string | null;
  facilityId: string | null;
  consultationModes: string[];
  consultationFee: number | null;
  languages: string[];
  experienceYears: number | null;
  bio: string | null;
  verified: boolean;
}

function toPublicView(p: Record<string, unknown>): DoctorPublicView {
  return {
    doctorId: String(p.doctorId),
    displayName: String(p.displayName ?? ''),
    specialization: (p.specialization as string) ?? null,
    qualifications: (p.qualifications as string[]) ?? [],
    facilityName: (p.facilityName as string) ?? null,
    facilityId: (p.facilityId as string) ?? null,
    consultationModes: (p.consultationModes as string[]) ?? [],
    consultationFee: (p.consultationFee as number) ?? null,
    languages: (p.languages as string[]) ?? [],
    experienceYears: (p.experienceYears as number) ?? null,
    bio: (p.bio as string) ?? null,
    verified: p.verificationStatus === 'VERIFIED',
  };
}

export async function listDoctors(opts: { specialization?: string; page: number; limit: number }) {
  const filter: Record<string, unknown> = { verificationStatus: { $ne: 'REJECTED' } };
  if (opts.specialization) filter.specialization = { $regex: opts.specialization, $options: 'i' };

  const total = await DoctorProfile.countDocuments(filter);
  const docs = await DoctorProfile.find(filter)
    .sort({ displayName: 1 })
    .skip((opts.page - 1) * opts.limit)
    .limit(opts.limit)
    .lean();

  return {
    doctors: docs.map((d) => toPublicView(d as unknown as Record<string, unknown>)),
    pagination: { page: opts.page, limit: opts.limit, total, totalPages: Math.ceil(total / opts.limit) },
  };
}

export async function getDoctor(doctorId: string): Promise<DoctorPublicView> {
  const doc = await DoctorProfile.findOne({ doctorId }).lean();
  if (!doc) throw new NotFoundError('Doctor not found');
  return toPublicView(doc as unknown as Record<string, unknown>);
}

export async function getDoctorAvailability(doctorId: string) {
  const doc = await DoctorProfile.findOne({ doctorId }).lean();
  if (!doc) throw new NotFoundError('Doctor not found');

  const [weekly, exceptions] = await Promise.all([
    DoctorAvailability.find({ doctorId, active: true }).lean(),
    AvailabilityException.find({ doctorId }).lean(),
  ]);

  return {
    doctorId,
    weekly: weekly.map((w) => ({
      dayOfWeek: w.dayOfWeek,
      startMinute: w.startMinute,
      endMinute: w.endMinute,
      consultationDurationMinutes: w.consultationDurationMinutes,
      timezone: w.timezone,
    })),
    exceptions: exceptions.map((e) => ({
      date: e.date,
      reason: e.reason,
      startMinute: e.startMinute ?? null,
      endMinute: e.endMinute ?? null,
    })),
  };
}
