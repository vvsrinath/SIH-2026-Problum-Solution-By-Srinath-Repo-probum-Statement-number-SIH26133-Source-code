import { useEffect, useState } from 'react';
import { CheckCircle2Icon, RepeatIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchAdminReferralCases } from '../../api/workspaces';
import type { AdminReferralCase } from '../../types/workspaces';

function statusMeta(status: AdminReferralCase['status']): { label: string; tone: 'pending' | 'success' } {
  if (status === 'COMPLETED') return { label: 'Completed', tone: 'success' };
  if (status === 'ACCEPTED') return { label: 'Accepted', tone: 'success' };
  return { label: 'Pending', tone: 'pending' };
}

export function AdminReferrals() {
  const { toast } = useToast();
  const { data: cases, loading, error, reload } = useAsync(() => fetchAdminReferralCases(), []);
  const [rows, setRows] = useState<AdminReferralCase[] | null>(null);

  useEffect(() => {
    if (cases) setRows(cases);
  }, [cases]);

  const list = rows ?? [];
  const escalated = list.filter((item) => item.escalated);

  const resolve = (id: string) => {
    const name = rows?.find((r) => r.id === id)?.patient ?? 'Case';
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, status: 'COMPLETED' as const } : r)) ?? prev);
    toast(`${name} case resolved`);
  };

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Referral oversight</h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Cross-facility referral coordination and issue tracking.
        </p>
      </div>

      {loading && <LoadingState rows={4} label="Loading referral cases" />}
      {!loading && error && (
        <ErrorState title="Couldn't load referral cases" detail={error.message} onRetry={reload} />
      )}

      {!loading && !error && cases && cases.length === 0 && (
        <Panel>
          <EmptyState
            icon={<RepeatIcon className="h-4 w-4" />}
            title="No referral escalations"
            description="Referral queues and delayed cases would be visible to administrators."
          />
        </Panel>
      )}

      {!loading && !error && cases && cases.length > 0 && (
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Panel title="All referral cases" subtitle="Cross-facility referral flow.">
            <div className="space-y-2">
              {cases.map((item) => {
                const meta = statusMeta(item.status);
                return (
                  <article key={item.id} className="flex items-start gap-3 rounded-card border border-line bg-white px-3 py-2.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
                      <RepeatIcon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-medium text-navy">{item.patient}</p>
                        {item.escalated && <StatusBadge status="Escalated" tone="danger" />}
                      </div>
                      <p className="mt-0.5 text-2xs text-ink-500">
                        {item.from} → {item.to}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-2xs text-ink-400">{item.ageDays} days</span>
                      <StatusBadge status={meta.label} tone={meta.tone} />
                      {item.status !== 'COMPLETED' && (
                        <Button size="sm" variant="secondary" onClick={() => resolve(item.id)}>
                          <CheckCircle2Icon className="h-3.5 w-3.5" /> Resolve
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </Panel>

          <Panel
            title="Needs attention"
            subtitle="Cases flagged for escalation."
            action={escalated.length > 0 ? <StatusBadge status={`${escalated.length}`} tone="danger" /> : undefined}
          >
            {escalated.length === 0 ? (
              <p className="py-8 text-center text-2xs text-ink-500">No escalated cases.</p>
            ) : (
              <div className="space-y-2">
                {escalated.map((item) => (
                  <article key={item.id} className="rounded-card border border-red-200 bg-red-50 px-3 py-2.5">
                    <p className="text-xs font-medium text-navy">{item.patient}</p>
                    <p className="mt-0.5 text-2xs text-ink-500">
                      {item.from} → {item.to} · {item.ageDays} days open
                    </p>
                  </article>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}