import type { RealAppointment, RealReferral, Appointment, Referral } from '../../types';
import { formatLocalDateTime, formatLocalTime } from '../../api/services';

const STATUS_MAP: Record<string, Appointment['status']> = {
  BOOKED: 'Upcoming',
  CONFIRMED: 'Upcoming',
  IN_PROGRESS: 'Consulting',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'Cancelled',
};

const REFERRAL_MAP: Record<string, Referral['status']> = {
  CREATED: 'Pending',
  ACCEPTED: 'Accepted',
};

export function toAppointment(a: RealAppointment): Appointment {
  const dt = formatLocalDateTime(a.scheduledAt);
  const time = formatLocalTime(a.scheduledAt);
  return {
    id: a.appointmentId,
    patientId: a.patientId,
    patientName: 'Patient',
    doctorName: 'Specialist',
    reason: a.reason ?? '',
    facility: '',
    time,
    date: dt,
    mode: a.consultationType === 'IN_PERSON' ? 'In person' : 'Online',
    status: STATUS_MAP[a.status] ?? 'Upcoming',
  };
}

export function toReferral(r: RealReferral): Referral {
  return {
    id: r.referralId,
    patientId: r.patientId,
    patientName: 'Patient',
    patientPhoto: '',
    referredTo: r.toDoctorId ?? '',
    specialistName: '',
    facility: r.toFacilityId ?? '',
    date: formatLocalDateTime(r.createdAt),
    reason: r.reason ?? r.clinicalSummary ?? '',
    status: REFERRAL_MAP[r.status] ?? 'Pending',
    direction: 'received',
  };
}
