import { useEffect, useState } from 'react';
import { CheckCircle2Icon, RepeatIcon, SendIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchWorkerReferrals } from '../../api/workspaces';
import { formatLocalDateTime } from '../../api/services';
import type { WorkerReferral } from '../../types/workspaces';

const STATUS: Record<WorkerReferral['status'], { label: string; tone: 'pending' | 'success' }> = {
  CREATED: { label: 'Pending', tone: 'pending' },
  ACCEPTED: { label: 'Accepted', tone: 'success' },
  COMPLETED: { label: 'Completed', tone: 'success' },
};

export function WorkerReferrals() {
  const { toast } = useToast();
  const { data: referrals, loading, error, reload } = useAsync(() => fetchWorkerReferrals(), []);
  const [rows, setRows] = useState<WorkerReferral[] | null>(null);

  useEffect(() => {
    if (referrals) setRows(referrals);
  }, [referrals]);

  const list = rows ?? [];

  const advance = (id: string, status: WorkerReferral['status']) => {
    const name = rows?.find((r) => r.id === id)?.patientName ?? 'Referral';
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, status } : r)) ?? prev);
    toast(`${name} ${status === 'ACCEPTED' ? 'marked sent' : 'completed'}`);
  };

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Community referrals</h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Referrals from your cluster to PHCs, doctors and specialists.
        </p>
      </div>

      <Panel>
        {loading && <LoadingState rows={3} label="Loading referrals" />}
        {!loading && error && (
          <ErrorState title="Couldn't load referrals" detail={error.message} onRetry={reload} />
        )}
        {!loading && !error && referrals && referrals.length === 0 && (
          <EmptyState
            icon={<RepeatIcon className="h-4 w-4" />}
            title="No referral requests"
            description="Outbound referrals and follow-up status would be managed in this screen."
          />
        )}
        {!loading && !error && list.length > 0 && (
          <div className="space-y-2">
            {list.map((referral) => {
              const status = STATUS[referral.status];
              return (
                <article key={referral.id} className="flex items-start gap-3 rounded-card border border-line bg-white px-3 py-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
                    <RepeatIcon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-navy">{referral.patientName}</p>
                    <p className="mt-0.5 text-2xs text-ink-500">To: {referral.toFacility}</p>
                    <p className="mt-0.5 text-2xs leading-5 text-ink-500">{referral.reason}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-2xs text-ink-400">{formatLocalDateTime(referral.createdAt)}</span>
                    <StatusBadge status={status.label} tone={status.tone} />
                    {referral.status === 'CREATED' && (
                      <Button size="sm" variant="secondary" onClick={() => advance(referral.id, 'ACCEPTED')}>
                        <SendIcon className="h-3.5 w-3.5" /> Mark sent
                      </Button>
                    )}
                    {referral.status === 'ACCEPTED' && (
                      <Button size="sm" variant="secondary" onClick={() => advance(referral.id, 'COMPLETED')}>
                        <CheckCircle2Icon className="h-3.5 w-3.5" /> Completed
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}