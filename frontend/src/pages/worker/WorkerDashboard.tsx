import {
  HomeIcon,
  UsersIcon,
  ClipboardListIcon,
  RepeatIcon,
  HeartPulseIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../components/dashboard/StatCard';
import { Panel } from '../../components/common/Panel';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import {
  fetchWorkerOverview,
} from '../../api/workspaces';
import type { FieldPatient } from '../../types/workspaces';

export function WorkerDashboard() {
  const { data: stats, loading, error, reload } = useAsync(() => fetchWorkerOverview(), []);

  const quick = [
    { label: 'My patients', to: '/worker/patients', icon: UsersIcon, accent: 'bg-emerald-50 text-emerald-700' },
    { label: 'Field triage', to: '/worker/triage', icon: ClipboardListIcon, accent: 'bg-sky-50 text-sky-700' },
    { label: 'Community referrals', to: '/worker/referrals', icon: RepeatIcon, accent: 'bg-amber-50 text-amber-700' },
    { label: 'Follow-ups', to: '/worker/followups', icon: HeartPulseIcon, accent: 'bg-rose-50 text-rose-700' },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-line bg-gradient-to-br from-brand-tint2 via-white to-emerald-50 p-3 shadow-card sm:p-4 md:p-5">
        <p className="text-[10px] uppercase tracking-[0.12em] text-brand">Swasthya Sathi · Field Worker</p>
        <h1 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-navy sm:text-xl md:text-2xl">
          Good morning, Sunita
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">
          Danapur cluster · 6 visits planned for today.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
{quick.map(({ label, to, icon: Icon, accent }) => (
            <Link
              key={label}
              to={to}
              className="rounded-xl border border-line bg-white px-2.5 py-2.5 text-left shadow-sm transition-colors hover:border-brand/30 sm:rounded-2xl sm:px-3 sm:py-3"
            >
              <span className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl ${accent}`}>
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <span className="text-xs font-medium text-navy">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState rows={3} label="Loading field overview" />
      ) : error ? (
        <ErrorState title="Couldn't load field overview" detail={error.message} onRetry={reload} />
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
            <StatCard icon={HomeIcon} label="Households" value={stats ? String(stats.households) : '--'} caption="Assigned cluster" linkLabel="Patients" linkTo="/worker/patients" trend={[38, 39, 40, 41, 42, stats?.households ?? 42]} />
            <StatCard icon={UsersIcon} label="Patients" value={stats ? String(stats.patients) : '--'} caption="Active registrations" tone="info" trend={[110, 112, 114, 115, 117, stats?.patients ?? 118]} />
            <StatCard icon={HeartPulseIcon} label="Visits today" value={stats ? String(stats.visitsToday) : '--'} caption="Home visits planned" linkLabel="Follow-ups" linkTo="/worker/followups" trend={[4, 5, 3, 6, 5, stats?.visitsToday ?? 6]} />
            <StatCard
              icon={AlertTriangleIcon}
              label="High risk"
              value={stats ? String(stats.highRiskPatients) : '--'}
              caption="Need priority visit"
              badge={stats && stats.highRiskPatients > 0 ? <StatusBadge status="Attention" tone="danger" /> : undefined}
              tone="info"
            />
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Panel title="Today's schedule" subtitle="Households assigned for visits.">
              <SampleVisits />
            </Panel>

            <Panel title="This week in your cluster" subtitle="Summarised from your daily work.">
              <div className="space-y-2">
                <SummaryRow label="Referrals raised" value={stats?.referralsThisWeek ?? 0} />
                <SummaryRow label="Pending follow-ups" value={stats?.pendingFollowUps ?? 0} />
                <SummaryRow label="Households covered" value={stats ? Math.round((stats.patients / Math.max(1, stats.households)) * 10) : 0} />
                <div className="mt-2 rounded-card border border-line bg-brand-tint2 px-3 py-2.5">
                  <p className="text-2xs font-medium text-navy">Field tip</p>
                  <p className="mt-0.5 text-2xs leading-5 text-ink-500">
                    Carry the digital screening checklist and record vitals in the app for every home visit.
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function SampleVisits() {
  const visits: FieldPatient[] = [
    { patientId: 'wp-1', name: 'Ramesh Kumar', village: 'Danapur', age: 47, sex: 'MALE', condition: 'Fever recovery', risk: 'MODERATE', lastVisitAt: '', nextVisitAt: '', },
    { patientId: 'wp-4', name: 'Sunita Ram', village: 'Danapur', age: 58, sex: 'FEMALE', condition: 'Hypertension check', risk: 'URGENT', lastVisitAt: '', nextVisitAt: '', },
    { patientId: 'wp-2', name: 'Geeta Pal', village: 'Sugut', age: 24, sex: 'FEMALE', condition: 'Anaemia monitoring', risk: 'HIGH', lastVisitAt: '', nextVisitAt: '', },
  ];
  return (
    <div className="space-y-2">
      {visits.map((visit) => (
        <article key={visit.patientId} className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[10px] font-semibold text-brand">
            {visit.name.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-navy">{visit.name} · {visit.village}</p>
            <p className="mt-0.5 truncate text-2xs text-ink-500">{visit.condition}</p>
          </div>
          <StatusBadge
            status={visit.risk === 'URGENT' ? 'Urgent' : visit.risk === 'HIGH' ? 'High' : 'Moderate'}
            tone={visit.risk === 'URGENT' || visit.risk === 'HIGH' ? 'danger' : 'pending'}
          />
        </article>
      ))}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-card border border-line px-3 py-2">
      <span className="text-2xs text-ink-500">{label}</span>
      <span className="text-xs font-semibold text-navy">{value}</span>
    </div>
  );
}