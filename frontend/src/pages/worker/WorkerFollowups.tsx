import { useEffect, useState } from 'react';
import { CheckCircle2Icon, HeartPulseIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchWorkerFollowUps } from '../../api/workspaces';
import { formatLocalDateTime } from '../../api/services';
import type { WorkerFollowUp } from '../../types/workspaces';

function statusMeta(status: WorkerFollowUp['status']): { label: string; tone: 'pending' | 'success' } {
  if (status === 'COMPLETED') return { label: 'Completed', tone: 'success' };
  return { label: 'Scheduled', tone: 'pending' };
}

export function WorkerFollowups() {
  const { toast } = useToast();
  const { data: followUps, loading, error, reload } = useAsync(() => fetchWorkerFollowUps(), []);
  const [rows, setRows] = useState<WorkerFollowUp[] | null>(null);

  useEffect(() => {
    if (followUps) setRows(followUps);
  }, [followUps]);

  const list = rows ?? [];
  const scheduled = list.filter((item) => item.status !== 'COMPLETED');
  const completed = list.filter((item) => item.status === 'COMPLETED');

  const markDone = (id: string) => {
    const name = rows?.find((r) => r.id === id)?.patientName ?? 'Follow-up';
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, status: 'COMPLETED' as const } : r)) ?? prev);
    toast(`${name} follow-up completed`);
  };

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Follow-ups</h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Home visits and treatment adherence checks in your cluster.
        </p>
      </div>

      {loading && <LoadingState rows={3} label="Loading follow-ups" />}
      {!loading && error && (
        <ErrorState title="Couldn't load follow-ups" detail={error.message} onRetry={reload} />
      )}

      {!loading && !error && followUps && followUps.length === 0 && (
        <Panel>
          <EmptyState
            icon={<HeartPulseIcon className="h-4 w-4" />}
            title="No follow-ups scheduled"
            description="Scheduled follow-ups and home-monitoring reminders would appear here."
          />
        </Panel>
      )}

      {!loading && !error && followUps && followUps.length > 0 && (
        <div className="grid gap-3 xl:grid-cols-2">
          <Panel title="Scheduled" subtitle="Visits that still need to be completed.">
            <div className="space-y-2">
              {scheduled.length === 0 && (
                <EmptyState title="Nothing scheduled" description="All follow-ups are up to date." />
              )}
              {scheduled.map((item) => {
                const meta = statusMeta(item.status);
                return (
                  <article key={item.id} className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-navy">{item.patientName}</p>
                      <p className="mt-0.5 text-2xs text-ink-500">{item.kind}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-2xs text-ink-400">{formatLocalDateTime(item.scheduledAt)}</span>
                      <StatusBadge status={meta.label} tone={meta.tone} />
                      <Button size="sm" variant="secondary" onClick={() => markDone(item.id)}>
                        <CheckCircle2Icon className="h-3.5 w-3.5" /> Mark done
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </Panel>

          <Panel title="Completed" subtitle="Visits already done.">
            <div className="space-y-2">
              {completed.length === 0 && (
                <EmptyState title="No completed visits yet" description="Past home visits would appear here." />
              )}
              {completed.map((item) => (
                <article key={item.id} className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2.5 opacity-80">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-navy">{item.patientName}</p>
                    <p className="mt-0.5 text-2xs text-ink-500">{item.kind}</p>
                  </div>
                  <StatusBadge status="Completed" tone="success" />
                </article>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}