import { ActivityIcon, ArrowDownRightIcon, ArrowUpRightIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchAnalytics } from '../../api/workspaces';
import { cn } from '../../utils/cn';

export function AdminAnalytics() {
  const { data: rows, loading, error, reload } = useAsync(() => fetchAnalytics(), []);

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Analytics</h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Coverage, utilization and referral performance dashboards.
        </p>
      </div>

      {loading && <LoadingState rows={4} label="Loading analytics" />}
      {!loading && error && (
        <ErrorState title="Couldn't load analytics" detail={error.message} onRetry={reload} />
      )}

      {!loading && !error && rows && rows.length === 0 && (
        <Panel>
          <EmptyState
            icon={<ActivityIcon className="h-4 w-4" />}
            title="No analytics available"
            description="Service trends and facility-level insights would be shown here."
          />
        </Panel>
      )}

      {!loading && !error && rows && rows.length > 0 && (
        <Panel title="Key performance indicators" subtitle="Latest reporting period.">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => {
              const positive = row.changePct >= 0;
              const isGood = row.metric.startsWith('Avg') ? !positive : positive;
              return (
                <div key={row.metric} className="rounded-card border border-line bg-white px-3 py-3">
                  <p className="text-2xs text-ink-500">{row.metric}</p>
                  <div className="mt-1 flex items-end justify-between">
                    <p className="text-xl font-semibold tracking-[-0.02em] text-navy">
                      {row.value}{row.unit && <span className="ml-0.5 text-xs text-ink-400">{row.unit}</span>}
                    </p>
                    <span className={cn('flex items-center gap-0.5 text-2xs font-medium', isGood ? 'text-emerald-600' : 'text-red-600')}>
                      {positive ? <ArrowUpRightIcon className="h-3 w-3" /> : <ArrowDownRightIcon className="h-3 w-3" />}
                      {Math.abs(row.changePct)}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line-soft">
                    <div
                      className={cn('h-full rounded-full', isGood ? 'bg-emerald-500' : 'bg-amber-500')}
                      style={{ width: `${Math.min(100, Math.max(8, row.value))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}