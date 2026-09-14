import { useEffect, useState } from 'react';
import { CheckCircle2Icon, PlayCircleIcon, UsersIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchPhcQueue } from '../../api/workspaces';
import type { QueueEntry } from '../../types/workspaces';
import { cn } from '../../utils/cn';

function severityMeta(severity: QueueEntry['severity']): { label: string; tone: 'success' | 'pending' | 'danger' } {
  if (severity === 'URGENT') return { label: 'Urgent', tone: 'danger' };
  if (severity === 'HIGH') return { label: 'High', tone: 'danger' };
  if (severity === 'MODERATE') return { label: 'Moderate', tone: 'pending' };
  return { label: 'Low', tone: 'success' };
}

function statusLabel(status: QueueEntry['status']): string {
  if (status === 'IN_CONSULTATION') return 'In consultation';
  if (status === 'DONE') return 'Done';
  return 'Waiting';
}

const FILTERS: Array<{ value: QueueEntry['severity'] | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HIGH', label: 'High' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'LOW', label: 'Low' },
];

export function PhcQueue() {
  const { toast } = useToast();
  const { data: queue, loading, error, reload } = useAsync(() => fetchPhcQueue(), []);
  const [rows, setRows] = useState<QueueEntry[] | null>(null);
  const [filter, setFilter] = useState<QueueEntry['severity'] | 'ALL'>('ALL');

  useEffect(() => {
    if (queue) setRows(queue);
  }, [queue]);

  const visible = (rows ?? []).filter((entry) => filter === 'ALL' || entry.severity === filter);
  const inConsultation = (rows ?? []).filter((entry) => entry.status === 'IN_CONSULTATION').length;
  const waiting = (rows ?? []).filter((entry) => entry.status === 'WAITING').length;

  const nameFor = (token: string) => rows?.find((e) => e.token === token)?.patientName ?? 'Patient';

  const startConsultation = (token: string) => {
    setRows((prev) => prev?.map((e) => (e.token === token ? { ...e, status: 'IN_CONSULTATION' as const } : e)) ?? prev);
    toast(`${nameFor(token)} started consultation`);
  };

  const discharge = (token: string) => {
    setRows((prev) => prev?.map((e) => (e.token === token ? { ...e, status: 'DONE' as const } : e)) ?? prev);
    toast(`${nameFor(token)} discharged`);
  };

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Patient queue</h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Current check-in and consultation queue by urgency.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!loading && !error && rows && (
          <>
            <span className="rounded-full border border-line bg-white px-3 py-1 text-2xs font-medium text-ink-500">
              {rows.length} checked in
            </span>
            <span className="rounded-full border border-line bg-white px-3 py-1 text-2xs font-medium text-ink-500">
              {inConsultation} in consultation
            </span>
            <span className="rounded-full border border-line bg-white px-3 py-1 text-2xs font-medium text-ink-500">
              {waiting} waiting
            </span>
          </>
        )}
        <div className="ml-auto flex flex-wrap gap-1.5">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-2xs font-medium transition-colors duration-150',
                filter === option.value
                  ? 'border-brand/40 bg-brand-tint text-brand'
                  : 'border-line bg-white text-ink-500 hover:bg-line-soft'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <Panel>
        {loading && !rows && <LoadingState rows={4} label="Loading queue" />}
        {!loading && error && (
          <ErrorState title="Couldn't load the queue" detail={error.message} onRetry={reload} />
        )}
        {!loading && !error && rows && rows.length === 0 && (
          <EmptyState
            icon={<UsersIcon className="h-4 w-4" />}
            title="Queue is clear"
            description="Queued patients for the current shift would be displayed here."
          />
        )}
        {!loading && !error && rows && rows.length > 0 && visible.length === 0 && (
          <p className="py-8 text-center text-2xs text-ink-500">
            No patients match this filter.
          </p>
        )}
        {!loading && !error && visible.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-line-soft text-2xs uppercase tracking-wide text-ink-400">
                  <th className="py-2 pr-2 font-medium">Token</th>
                  <th className="py-2 pr-2 font-medium">Patient</th>
                  <th className="py-2 pr-2 font-medium">Reason</th>
                  <th className="py-2 pr-2 font-medium">Severity</th>
                  <th className="py-2 pr-2 font-medium">Wait</th>
                  <th className="py-2 pr-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((entry) => {
                  const severity = severityMeta(entry.severity);
                  return (
                    <tr key={entry.token} className="border-b border-line-soft last:border-0">
                      <td className={cn('py-2.5 pr-2 text-xs font-semibold', entry.status === 'IN_CONSULTATION' ? 'text-brand' : 'text-navy')}>
                        {entry.token}
                      </td>
                      <td className="py-2.5 pr-2 text-xs font-medium text-navy">{entry.patientName}</td>
                      <td className="py-2.5 pr-2 text-2xs text-ink-500">{entry.reason}</td>
                      <td className="py-2.5 pr-2"><StatusBadge status={severity.label} tone={severity.tone} /></td>
                      <td className="py-2.5 pr-2 text-2xs text-ink-500">{entry.waitingMin} min</td>
                      <td className="py-2.5 pr-2 text-2xs text-ink-500">{statusLabel(entry.status)}</td>
                      <td className="py-2.5">
                        {entry.status === 'WAITING' && (
                          <Button size="sm" variant="secondary" onClick={() => startConsultation(entry.token)}>
                            <PlayCircleIcon className="h-3.5 w-3.5" /> Start
                          </Button>
                        )}
                        {entry.status === 'IN_CONSULTATION' && (
                          <Button size="sm" variant="secondary" onClick={() => discharge(entry.token)}>
                            <CheckCircle2Icon className="h-3.5 w-3.5" /> Discharge
                          </Button>
                        )}
                        {entry.status === 'DONE' && <span className="text-2xs text-ink-400">Complete</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}