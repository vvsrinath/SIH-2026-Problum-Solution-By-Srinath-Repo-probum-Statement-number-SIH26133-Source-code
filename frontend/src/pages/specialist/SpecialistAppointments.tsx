import { useMemo, useState } from 'react';
import { Loader2Icon, MapPinIcon, VideoIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { Tabs } from '../../components/common/Tabs';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import {
  fetchAppointments,
  confirmAppointment,
  startAppointment,
  completeAppointment,
  formatLocalDateTime,
  MODE_LABEL,
  APPOINTMENT_LABEL,
} from '../../api/services';
import type { RealAppointment } from '../../types';

const tabs = ['All', 'Upcoming', 'Consulting', 'Completed'];

const TAB_STATUS: Record<string, RealAppointment['status'][]> = {
  All: ['BOOKED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'],
  Upcoming: ['BOOKED', 'CONFIRMED'],
  Consulting: ['IN_PROGRESS'],
  Completed: ['COMPLETED'],
};

export function SpecialistAppointments() {
  const [tab, setTab] = useState(tabs[0]);
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const appointments = useAsync(() => fetchAppointments({ limit: 50 }), []);

  const apptList: RealAppointment[] = appointments.data?.appointments ?? [];

  const filtered = useMemo(() => {
    if (tab === 'All') return apptList;
    return apptList.filter((appointment) => TAB_STATUS[tab].includes(appointment.status));
  }, [apptList, tab]);

  const runAction = async (appointment: RealAppointment, action: (id: string) => Promise<RealAppointment>) => {
    setActionError(null);
    setActingId(appointment.appointmentId);
    try {
      await action(appointment.appointmentId);
      appointments.reload();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not update the appointment. Please try again.',
      );
    } finally {
      setActingId(null);
    }
  };

  const actionFor = (appointment: RealAppointment) => {
    const busy = actingId === appointment.appointmentId;
    if (appointment.status === 'BOOKED') {
      return (
        <Button
          variant="secondary"
          size="sm"
          disabled={busy || actingId !== null}
          onClick={() => runAction(appointment, confirmAppointment)}
        >
          {busy ? <Loader2Icon className="h-3 w-3 animate-spin" /> : null}
          Confirm
        </Button>
      );
    }
    if (appointment.status === 'CONFIRMED') {
      return (
        <Button
          variant="secondary"
          size="sm"
          disabled={busy || actingId !== null}
          onClick={() => runAction(appointment, startAppointment)}
        >
          {busy ? <Loader2Icon className="h-3 w-3 animate-spin" /> : null}
          Start
        </Button>
      );
    }
    if (appointment.status === 'IN_PROGRESS') {
      return (
        <Button
          variant="secondary"
          size="sm"
          disabled={busy || actingId !== null}
          onClick={() => runAction(appointment, completeAppointment)}
        >
          {busy ? <Loader2Icon className="h-3 w-3 animate-spin" /> : null}
          Complete
        </Button>
      );
    }
    return undefined;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">
            Appointments
          </h1>
          <p className="mt-0.5 text-2xs text-ink-500">
            Referred consultations
          </p>
        </div>
        <Tabs tabs={tabs} active={tab} onChange={(next) => { setTab(next); setActionError(null); }} />
      </div>

      {actionError && (
        <div role="alert" className="rounded-card border border-red-200 bg-red-50 px-3 py-2.5 text-2xs text-red-700">
          {actionError}
        </div>
      )}

      <Panel>
        {appointments.loading && <LoadingState rows={5} label="Loading appointments" />}

        {!appointments.loading && appointments.error && (
          <ErrorState
            title="Failed to load appointments"
            detail={appointments.error.message}
            onRetry={appointments.reload}
          />
        )}

        {!appointments.loading && !appointments.error && filtered.length === 0 && (
          <EmptyState
            title={`No ${tab.toLowerCase()} appointments`}
            description="Appointments matching this status will appear here."
          />
        )}

        {!appointments.loading && !appointments.error && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((appointment) => (
              <AppointmentRow
                key={appointment.appointmentId}
                appointment={appointment}
                busy={actingId !== null}
                action={actionFor(appointment)}
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function AppointmentRow({
  appointment,
  busy,
  action,
}: {
  appointment: RealAppointment;
  busy: boolean;
  action?: React.ReactNode;
}) {
  return (
    <article className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2.5">
      <span className="w-[92px] shrink-0 text-2xs font-medium text-navy">
        {formatLocalDateTime(appointment.scheduledAt)}
      </span>
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
      {action ?? <StatusBadge status={APPOINTMENT_LABEL[appointment.status] ?? appointment.status} />}
      {busy && <span className="sr-only">Updating…</span>}
    </article>
  );
}
