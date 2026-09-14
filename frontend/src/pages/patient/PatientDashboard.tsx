import {
  CalendarDaysIcon,
  ChevronRightIcon,
  FolderOpenIcon,
  HeartPulseIcon,
  MapPinIcon,
  RepeatIcon,
  StethoscopeIcon,
  PillIcon,
  BellRingIcon,
  ActivityIcon
} from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { StatCard } from '../../components/dashboard/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Timeline } from '../../components/common/Timeline';
import { ActivityList } from '../../components/dashboard/ActivityList';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useLanguage } from '../../context/LanguageContext';
import { useAsync } from '../../hooks/useAsync';
import {
  fetchAppointments,
  fetchReferrals,
  fetchNotifications,
  getSelf,
  formatLocalTime,
  APPOINTMENT_LABEL,
  MODE_LABEL,
} from '../../api/services';
import type { RealAppointment, RealReferral, NotificationItem, JourneyStep } from '../../types';

const quickActions = [
  { key: 'findHealthcare', label: 'Find Healthcare', to: '/patient/find-healthcare', icon: MapPinIcon, accent: 'bg-emerald-50 text-emerald-700' },
  { key: 'talkToDoctor', label: 'Talk to Doctor', to: '/patient/consult-online', icon: StethoscopeIcon, accent: 'bg-sky-50 text-sky-700' },
  { key: 'appointments', label: 'My Appointments', to: '/patient/appointments', icon: CalendarDaysIcon, accent: 'bg-amber-50 text-amber-700' },
  { key: 'trackReferral', label: 'Track Referral', to: '/patient/referrals', icon: RepeatIcon, accent: 'bg-violet-50 text-violet-700' },
  { key: 'medicines', label: 'Medicines', to: '/patient/medicines', icon: PillIcon, accent: 'bg-rose-50 text-rose-700' },
  { key: 'records', label: 'My Records', to: '/patient/records', icon: FolderOpenIcon, accent: 'bg-cyan-50 text-cyan-700' },
];

const ACTIVE_APPOINTMENT_STATUSES = ['BOOKED', 'CONFIRMED', 'IN_PROGRESS'];

function appointmentToActivity(appt: RealAppointment) {
  return {
    id: appt.appointmentId,
    title: `Appointment ${APPOINTMENT_LABEL[appt.status] ?? appt.status}`,
    meta: appt.reason ? `Reason: ${appt.reason} · ${MODE_LABEL[appt.consultationType] ?? appt.consultationType}` : `${MODE_LABEL[appt.consultationType] ?? appt.consultationType}`,
    date: new Date(appt.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    kind: 'appointment' as const,
  };
}

function referralToActivity(ref: RealReferral) {
  return {
    id: ref.referralId,
    title: `Referral ${ref.status === 'ACCEPTED' ? 'accepted' : 'created'}`,
    meta: ref.reason ?? 'Referral',
    date: new Date(ref.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    kind: 'referral' as const,
  };
}

export function PatientDashboard() {
  const { t } = useLanguage();

  const self = useAsync(() => getSelf(), []);
  const appointments = useAsync(() => fetchAppointments(), []);
  const referrals = useAsync(() => fetchReferrals(), []);
  const notifications = useAsync(() => fetchNotifications({ limit: 10 }), []);

  const apptList: RealAppointment[] = appointments.data?.appointments ?? [];
  const referralList: RealReferral[] = referrals.data ?? [];
  const notifList: NotificationItem[] = notifications.data?.items ?? [];

  const displayName = self.data?.profile?.displayName ?? '';

  const nextAppointment = apptList.find((appointment) =>
    ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status)
  );

  const pendingReferrals = referralList.filter(
    (referral) => referral.status !== 'ACCEPTED'
  ).length;

  const careJourney: JourneyStep[] = [
    {
      id: 'j-1',
      label: 'Request',
      status: (apptList.length || referralList.length) ? 'Completed' : 'Upcoming',
      detail: apptList.length || referralList.length
        ? 'Care request raised'
        : 'No care request started yet',
    },
    {
      id: 'j-2',
      label: 'Doctor Consult',
      status: apptList.some((a) => a.status === 'COMPLETED' || a.status === 'IN_PROGRESS')
        ? 'Completed'
        : apptList.length ? 'In Progress' : 'Upcoming',
      detail: apptList.length
        ? 'Appointment scheduled'
        : 'No consultation scheduled',
    },
    {
      id: 'j-3',
      label: 'Referral',
      status: referralList.some((r) => r.status === 'ACCEPTED')
        ? 'Completed'
        : referralList.length ? 'In Progress' : 'Upcoming',
      detail: referralList.length
        ? `${referralList.length} referral${referralList.length > 1 ? 's' : ''} on record`
        : 'No referral yet',
    },
    {
      id: 'j-4',
      label: 'Specialist Care',
      status: 'Upcoming' as const,
      detail: 'Specialist consultation not yet scheduled',
    },
    {
      id: 'j-5',
      label: 'Follow-up',
      status: 'Upcoming' as const,
      detail: 'Follow-up reminder will be scheduled after review',
    },
  ];

  const activityItems = [
    ...referralList.map(referralToActivity),
    ...apptList.map(appointmentToActivity),
    ...notifList.map((n) => ({
      id: n.notificationId,
      title: n.title,
      meta: n.body,
      date: new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      kind: 'record' as const,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const loading = self.loading || appointments.loading || referrals.loading || notifications.loading;
  const anyError = self.error || appointments.error || referrals.error || notifications.error;
  const reloadAll = () => {
    self.reload();
    appointments.reload();
    referrals.reload();
    notifications.reload();
  };

  return (
    <div className="space-y-3 pb-24 md:pb-0">
      <div className="rounded-2xl border border-line bg-gradient-to-br from-brand-tint2 via-white to-emerald-50 p-3 shadow-card sm:p-4 md:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.12em] text-brand">{t('app.name')}</p>
            <h1 className="mt-1 truncate text-lg font-semibold tracking-[-0.02em] text-navy sm:text-xl md:text-2xl">
              {t('home.greeting')}
            </h1>
            <p className="mt-0.5 truncate text-sm font-semibold text-navy">
              {displayName || 'Patient'}
            </p>
          </div>
          <div className="flex-shrink-0 rounded-full border border-line bg-white p-1.5 text-ink-500">
            <BellRingIcon className="h-4 w-4" />
          </div>
        </div>

        <p className="mt-3 text-xs font-medium text-navy sm:text-sm md:text-base">{t('home.question')}</p>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
          {quickActions.map(({ key, to, icon: Icon, accent }) => (
            <Button key={key} variant="secondary" to={to} className="h-auto w-full flex-col items-start justify-start rounded-xl border border-line bg-white px-2.5 py-2.5 text-left shadow-sm hover:border-brand/30 sm:rounded-2xl sm:px-3 sm:py-3">
              <span className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg sm:mb-3 sm:h-10 sm:w-10 sm:rounded-xl ${accent}`}>
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <span className="text-xs font-medium text-navy sm:text-sm">{t(`home.${key}`)}</span>
            </Button>
          ))}
        </div>
      </div>

      {anyError ? (
        <ErrorState
          title="Couldn't load your dashboard"
          detail="Some data failed to load. Please try again."
          onRetry={reloadAll}
        />
      ) : (
        <>
          <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={CalendarDaysIcon}
              label="Upcoming Appointment"
              badge={nextAppointment && <StatusBadge status={APPOINTMENT_LABEL[nextAppointment.status] ?? nextAppointment.status} />}
              linkLabel="Manage"
              linkTo="/patient/appointments">
              {loading ? (
                <div className="space-y-1.5">
                  <span className="block h-2.5 w-2/3 animate-pulse rounded-full bg-line-soft" />
                  <span className="block h-2 w-1/2 animate-pulse rounded-full bg-line-soft" />
                </div>
              ) : nextAppointment ? (
                <div>
                  <p className="text-xs font-semibold text-navy">
                    {formatLocalTime(nextAppointment.scheduledAt)} · {MODE_LABEL[nextAppointment.consultationType] ?? nextAppointment.consultationType}
                  </p>
                  <p className="mt-1 text-2xs text-ink-500">
                    {new Date(nextAppointment.scheduledAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ) : (
                <p className="text-2xs text-ink-500">No appointment scheduled.</p>
              )}
            </StatCard>

            <StatCard
              icon={RepeatIcon}
              label="Referrals"
              value={loading ? '--' : String(pendingReferrals).padStart(2, '0')}
              caption="Active referrals"
              linkLabel="View"
              linkTo="/patient/referrals"
              trend={[2, 3, 1, 2, pendingReferrals, 1]}
            />

            <StatCard
              icon={FolderOpenIcon}
              label="Health Records"
              value={loading ? '--' : String(apptList.length).padStart(2, '0')}
              caption="Appointments on record"
              linkLabel="View"
              linkTo="/patient/records"
              tone="info"
              trend={[4, 5, 6, 7, 8, apptList.length]}
            />

            <StatCard
              icon={HeartPulseIcon}
              label="Follow-ups"
              value={loading ? '--' : String(notifList.length).padStart(2, '0')}
              caption="Recent notifications"
              linkLabel="View"
              linkTo="/patient/follow-up"
              trend={[1, 2, 3, 2, notifList.length, 2]}
            />
          </div>

          <div className="grid gap-2 sm:gap-3 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
            <Panel title="Your Care Journey" subtitle="Where you are in the current care request.">
              <Timeline steps={careJourney} orientation="vertical" className="mt-1" />
              <div className="mt-5 rounded-card border border-line bg-brand-tint2 px-3 py-2.5">
                <p className="text-2xs font-medium text-navy">Current step</p>
                <p className="mt-0.5 text-2xs text-ink-500">
                  {careJourney.find((step) => step.status === 'In Progress')?.detail ?? 'All steps are up to date.'}
                </p>
              </div>
            </Panel>

            <Panel title="Recent Activity" linkLabel="View All" linkTo="/patient/records">
              {loading ? (
                <LoadingState rows={3} />
              ) : activityItems.length ? (
                <ActivityList items={activityItems} />
              ) : (
                <EmptyState title="No recent activity" description="Appointments, referrals and updates will appear here." />
              )}
            </Panel>
          </div>

          <div className="rounded-lg border border-line bg-white p-2.5 shadow-card sm:rounded-card sm:p-3 md:flex md:items-center md:justify-between md:px-4 md:py-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-10 sm:w-10 sm:rounded-xl">
                <ActivityIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-navy sm:text-sm">Referral status</p>
                <p className="text-2xs text-ink-500">
                  {pendingReferrals > 0
                    ? `${pendingReferrals} active referral${pendingReferrals > 1 ? 's' : ''} being processed.`
                    : referralList.length > 0
                    ? 'Your referrals are up to date.'
                    : 'No referrals yet.'}
                </p>
              </div>
            </div>
            <Button variant="secondary" to="/patient/find-healthcare" className="mt-2 w-full text-xs sm:mt-3 sm:text-sm md:mt-0 md:w-auto">
              Find <ChevronRightIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
