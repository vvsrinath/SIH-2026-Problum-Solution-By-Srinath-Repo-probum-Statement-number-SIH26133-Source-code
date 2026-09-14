import { MapPinIcon, VideoIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import {
  fetchAppointments,
  formatLocalDateTime,
  MODE_LABEL,
  APPOINTMENT_LABEL,
} from '../../api/services';
import type { RealAppointment } from '../../types';

export function SpecialistPatients() {
  const appointments = useAsync(() => fetchAppointments({ status: 'COMPLETED', limit: 200 }), []);

  const apptList: RealAppointment[] = appointments.data?.appointments ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">
          Patients
        </h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Patients referred to you.
        </p>
      </div>

      <Panel>
        {appointments.loading && <LoadingState rows={5} label="Loading patients" />}

        {!appointments.loading && appointments.error && (
          <ErrorState
            title="Failed to load patients"
            detail={appointments.error.message}
            onRetry={appointments.reload}
          />
        )}

        {!appointments.loading && !appointments.error && apptList.length === 0 && (
          <EmptyState
            title="No patients"
            description="Patients from completed referrals will appear here."
          />
        )}

        {!appointments.loading && !appointments.error && apptList.length > 0 && (
          <ul className="space-y-2">
            {apptList.map((appointment) => (
              <PatientRow key={appointment.appointmentId} appointment={appointment} />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function PatientRow({ appointment }: { appointment: RealAppointment }) {
  return (
    <li className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[10px] font-semibold text-brand">
        {appointment.patientId.slice(0, 2).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-navy">
          Patient {appointment.patientId}
        </span>
        <span className="mt-0.5 flex items-center gap-1 truncate text-2xs text-ink-500">
          {appointment.consultationType === 'VIDEO' ? (
            <VideoIcon className="h-3 w-3 shrink-0 text-ink-400" />
          ) : (
            <MapPinIcon className="h-3 w-3 shrink-0 text-ink-400" />
          )}
          <span className="truncate">
            {MODE_LABEL[appointment.consultationType] ?? appointment.consultationType}
            {appointment.reason ? ` · ${appointment.reason}` : ''}
          </span>
        </span>
      </span>
      <span className="hidden text-2xs text-ink-400 sm:block">
        {formatLocalDateTime(appointment.scheduledAt)}
      </span>
      <StatusBadge status={APPOINTMENT_LABEL[appointment.status] ?? appointment.status} />
    </li>
  );
}
