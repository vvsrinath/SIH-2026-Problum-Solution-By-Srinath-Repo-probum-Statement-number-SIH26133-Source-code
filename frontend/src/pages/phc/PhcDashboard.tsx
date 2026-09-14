import {
  ClipboardListIcon,
  UsersIcon,
  FolderOpenIcon,
  RepeatIcon,
  PillIcon,
  FileTextIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../components/dashboard/StatCard';
import { Panel } from '../../components/common/Panel';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchPhcOverview, fetchPhcQueue } from '../../api/workspaces';
import type { QueueEntry } from '../../types/workspaces';

function severityTone(severity: QueueEntry['severity']): { label: string; tone: 'success' | 'pending' | 'danger' } {
  if (severity === 'URGENT') return { label: 'Urgent', tone: 'danger' };
  if (severity === 'HIGH') return { label: 'High', tone: 'danger' };
  if (severity === 'MODERATE') return { label: 'Moderate', tone: 'pending' };
  return { label: 'Low', tone: 'success' };
}

export function PhcDashboard() {
  const { data: stats, loading, error, reload } = useAsync(() => fetchPhcOverview(), []);
  const { data: queue } = useAsync(() => fetchPhcQueue(), []);

  const urgent = (queue ?? []).filter((entry) => entry.status === 'WAITING' && (entry.severity === 'URGENT' || entry.severity === 'HIGH'));

  const quick = [
    { label: 'Patient queue', to: '/phc/queue', icon: UsersIcon, accent: 'bg-sky-50 text-sky-700' },
    { label: 'PHC patients', to: '/phc/patients', icon: FolderOpenIcon, accent: 'bg-emerald-50 text-emerald-700' },
    { label: 'Referrals', to: '/phc/referrals', icon: RepeatIcon, accent: 'bg-amber-50 text-amber-700' },
    { label: 'Medicines', to: '/phc/medicines', icon: PillIcon, accent: 'bg-rose-50 text-rose-700' },
    { label: 'Diagnostics', to: '/phc/diagnostics', icon: FileTextIcon, accent: 'bg-cyan-50 text-cyan-700' },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-line bg-gradient-to-br from-brand-tint2 via-white to-emerald-50 p-3 shadow-card sm:p-4 md:p-5">
        <p className="text-[10px] uppercase tracking-[0.12em] text-brand">Swasthya Sathi · PHC</p>
        <h1 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-navy sm:text-xl md:text-2xl">
          PHC Operations
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">
          Capacity, patient queue and referral tracking for the health centre.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
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
        <LoadingState rows={3} label="Loading PHC overview" />
      ) : error ? (
        <ErrorState title="Couldn't load PHC overview" detail={error.message} onRetry={reload} />
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
            <StatCard icon={UsersIcon} label="Queue" value={stats ? String(stats.queueCount) : '--'} caption="Waiting now" linkLabel="Queue" linkTo="/phc/queue" trend={[5, 7, 8, 6, 9, stats?.queueCount ?? 9]} />
            <StatCard icon={FolderOpenIcon} label="Patients today" value={stats ? String(stats.patientsToday) : '--'} caption="Consultations" tone="info" trend={[28, 30, 31, 33, 32, stats?.patientsToday ?? 34]} />
            <StatCard
              icon={ClipboardListIcon}
              label="Beds"
              value={stats ? `${stats.bedsOccupied}/${stats.bedsTotal}` : '--'}
              caption="Occupied / total"
              badge={stats && stats.bedsOccupied >= stats.bedsTotal ? <StatusBadge status="Full" tone="danger" /> : undefined}
            />
            <StatCard
              icon={PillIcon}
              label="Medicines low"
              value={stats ? String(stats.medicinesLow) : '--'}
              caption="Below reorder mark"
              badge={stats && stats.medicinesLow > 0 ? <StatusBadge status="Restock" tone="pending" /> : undefined}
              tone="info"
              linkLabel="Medicines"
              linkTo="/phc/medicines"
            />
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Panel title="Waiting queue" subtitle="Patients currently waiting by urgency." linkLabel="View all" linkTo="/phc/queue">
              <div className="space-y-2">
                {(queue ?? []).slice(0, 5).map((entry) => {
                  const severity = severityTone(entry.severity);
                  return (
                    <article key={entry.token} className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-line-soft text-2xs font-semibold text-ink-500">
                        {entry.token}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-navy">{entry.patientName}</p>
                        <p className="mt-0.5 truncate text-2xs text-ink-500">{entry.reason}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={severity.label} tone={severity.tone} />
                        <span className="text-2xs text-ink-400">{entry.waitingMin} min</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Panel>

            <Panel title="Attention needed" subtitle="Waiting patients with priority flags.">
              {urgent.length === 0 ? (
                <p className="py-6 text-center text-2xs text-ink-500">No priority patients waiting.</p>
              ) : (
                <div className="space-y-2">
                  {urgent.map((entry) => (
                    <article key={entry.token} className="flex items-center gap-2.5 rounded-card border border-red-200 bg-red-50 px-3 py-2.5">
                      <span className="text-2xs font-semibold text-red-700">{entry.token}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-navy">{entry.patientName}</p>
                        <p className="truncate text-2xs text-ink-500">{entry.reason}</p>
                      </div>
                      <span className="text-2xs text-red-600">{entry.waitingMin} min</span>
                    </article>
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