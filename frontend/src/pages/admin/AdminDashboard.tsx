import {
  ShieldCheckIcon,
  MapPinIcon,
  UsersIcon,
  RepeatIcon,
  ClockIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../components/dashboard/StatCard';
import { Panel } from '../../components/common/Panel';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchAdminOverview } from '../../api/workspaces';

export function AdminDashboard() {
  const { data: stats, loading, error, reload } = useAsync(() => fetchAdminOverview(), []);

  const quick = [
    { label: 'Analytics', to: '/admin/analytics', icon: ShieldCheckIcon, accent: 'bg-sky-50 text-sky-700' },
    { label: 'Facilities', to: '/admin/facilities', icon: MapPinIcon, accent: 'bg-emerald-50 text-emerald-700' },
    { label: 'Referrals', to: '/admin/referrals', icon: RepeatIcon, accent: 'bg-amber-50 text-amber-700' },
    { label: 'Reports', to: '/admin/reports', icon: UsersIcon, accent: 'bg-rose-50 text-rose-700' },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-line bg-gradient-to-br from-brand-tint2 via-white to-emerald-50 p-3 shadow-card sm:p-4 md:p-5">
        <p className="text-[10px] uppercase tracking-[0.12em] text-brand">Swasthya Sathi · Administrator</p>
        <h1 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-navy sm:text-xl md:text-2xl">
          System overview
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">
          Network visibility across villages, facilities and care teams.
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
        <LoadingState rows={3} label="Loading system overview" />
      ) : error ? (
        <ErrorState title="Couldn't load system overview" detail={error.message} onRetry={reload} />
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
            <StatCard icon={MapPinIcon} label="Villages" value={stats ? String(stats.villages) : '--'} caption="Covered in district" linkLabel="Facilities" linkTo="/admin/facilities" trend={[120, 121, 123, 124, 125, stats?.villages ?? 126]} />
            <StatCard icon={UsersIcon} label="Active users" value={stats ? stats.activeUsers.toLocaleString() : '--'} caption="Platform wide" tone="info" trend={[2900, 2950, 3000, 3050, 3080, stats?.activeUsers ?? 3108]} />
            <StatCard icon={RepeatIcon} label="Referrals this month" value={stats ? String(stats.referralsThisMonth) : '--'} caption="Across facilities" linkLabel="View" linkTo="/admin/referrals" trend={[180, 190, 195, 200, 210, stats?.referralsThisMonth ?? 214]} />
            <StatCard
              icon={ClockIcon}
              label="Avg response time"
              value={stats ? `${stats.avgResponseHours}h` : '--'}
              caption="Referral turnaround"
            />
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Panel title="Facility performance snapshot" subtitle="Live usage across the network.">
              <div className="space-y-2">
                <MetricRow label="Total facilities" value={stats?.facilities ?? 0} />
                <MetricRow label="Satisfaction" value={stats ? `${stats.satisfactionPct}%` : '--'} />
                <MetricRow label="Active villages" value={stats?.villages ?? 0} />
                <MetricRow label="Average response" value={stats ? `${stats.avgResponseHours}h` : '--'} />
              </div>
            </Panel>

            <Panel title="Quick links" subtitle="Jump to common admin screens.">
              <div className="space-y-1.5">
                <QuickLink to="/admin/facilities" label="View facility directory" />
                <QuickLink to="/admin/referrals" label="Escalated referrals" />
                <QuickLink to="/admin/reports" label="Operational reports" />
                <QuickLink to="/admin/settings" label="System settings" />
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between rounded-card border border-line bg-white px-3 py-2">
      <span className="text-2xs text-ink-500">{label}</span>
      <span className="text-xs font-semibold text-navy">{value}</span>
    </div>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-card border border-line bg-white px-3 py-2 text-xs font-medium text-brand hover:border-brand/30 hover:text-brand-dark"
    >
      {label}
    </Link>
  );
}