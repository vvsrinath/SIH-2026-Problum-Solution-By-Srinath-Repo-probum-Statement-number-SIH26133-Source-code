import {
  CalendarDaysIcon,
  HeartPulseIcon,
  MapPinIcon,
  RepeatIcon,
  VideoIcon,
} from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { StatCard } from '../../components/dashboard/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import {
  getSelf,
  fetchAppointments,
  fetchReferrals,
  formatLocalTime,
  formatLocalDateTime,
  MODE_LABEL,
  APPOINTMENT_LABEL,
} from '../../api/services';
import type { RealAppointment, RealReferral } from '../../types';

export function SpecialistDashboard() {
  const self = useAsync(() => getSelf(), []);
  const appointments = useAsync(() => fetchAppointments({ limit: 100 }), []);
  const referrals = useAsync(() => fetchReferrals(), []);

  const apptList: RealAppointment[] = appointments.data?.appointments ?? [];
  const referralList: RealReferral[] = referrals.data ?? [];

  const upcoming = apptList
    .filter((a) => a.status === 'BOOKED' || a.status === 'CONFIRMED')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const recentReferrals = referralList.slice(0, 4);
  const newReferrals = referralList.filter((r) => r.status === 'CREATED').length;

  const displayName = self.data?.profile?.displayName ?? 'Specialist';
  const loading = self.loading || appointments.loading || referrals.loading;
  const anyError = self.error || appointments.error || referrals.error;
  const reloadAll = () => {
    self.reload();
    appointments.reload();
    referrals.reload();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">
          {loading ? 'Welcome, Specialist 👋' : `Welcome, ${displayName} 👋`}
        </h1>
        <p className="mt-0.5 text-2xs text-ink-500">Here is your overview.</p>
      </div>

      {anyError ? (
        <ErrorState
          title="Couldn't load your dashboard"
          detail="Some data failed to load. Please try again."
          onRetry={reloadAll}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              icon={CalendarDaysIcon}
              label="Appointments"
              value={loading ? '--' : String(apptList.length).padStart(2, '0')}
              caption="Referred consultations"
              linkLabel="View"
              linkTo="/specialist/appointments"
            />
            <StatCard
              icon={RepeatIcon}
              label="New Referrals"
              value={loading ? '--' : String(newReferrals).padStart(2, '0')}
              caption="Awaiting your review"
              linkLabel="View"
              linkTo="/specialist/referrals"
              tone="info"
            />
            <StatCard
              icon={HeartPulseIcon}
              label="Follow-ups"
              value="00"
              caption="Due in the next 7 days"
            />
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
            <Panel
              title="Upcoming Appointments"
              linkLabel="View Calendar"
              linkTo="/specialist/appointments"
              footer={
                <Button variant="ghost" size="sm" to="/specialist/appointments">
                  View full day
                </Button>
              }
            >
              {loading ? (
                <LoadingState rows={3} label="Loading appointments" />
              ) : upcoming.length === 0 ? (
                <EmptyState title="No appointments" description="No upcoming appointments found." />
              ) : (
                <div className="space-y-2">
                  {upcoming.map((appointment) => (
                    <AppointmentRow key={appointment.appointmentId} appointment={appointment} />
                  ))}
                </div>
              )}
            </Panel>

            <Panel
              title="Recent Referrals"
              linkLabel="View All"
              linkTo="/specialist/referrals"
            >
              {loading ? (
                <LoadingState rows={3} label="Loading referrals" />
              ) : recentReferrals.length === 0 ? (
                <EmptyState title="No referrals" description="No referrals received yet." />
              ) : (
                <div className="space-y-2">
                  {recentReferrals.map((referral) => (
                    <ReferralRow key={referral.referralId} referral={referral} />
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function AppointmentRow({ appointment }: { appointment: RealAppointment }) {
  return (
    <article className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2.5">
      <span className="w-[68px] shrink-0 text-2xs font-medium text-navy">
        {formatLocalTime(appointment.scheduledAt)}
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
      <StatusBadge
        status={APPOINTMENT_LABEL[appointment.status] ?? appointment.status}
        tone={appointment.status === 'IN_PROGRESS' ? 'pending' : 'info'}
      />
    </article>
  );
}

function ReferralRow({ referral }: { referral: RealReferral }) {
  const statusLabel = referral.status === 'ACCEPTED' ? 'Accepted' : 'Pending';
  const tone = referral.status === 'ACCEPTED' ? 'success' : 'pending';
  const when = new Date(referral.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return (
    <article className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[10px] font-semibold text-brand">
        {referral.patientId.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-navy">
          Patient {referral.patientId}
        </p>
        <p className="mt-0.5 truncate text-2xs text-ink-500">
          {referral.reason ?? formatLocalDateTime(referral.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-2xs text-ink-400">{when}</span>
        <StatusBadge status={statusLabel} tone={tone} />
      </div>
    </article>
  );
}
