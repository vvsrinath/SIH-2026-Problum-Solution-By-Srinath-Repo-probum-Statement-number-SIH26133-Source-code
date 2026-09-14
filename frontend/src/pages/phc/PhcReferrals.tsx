import { useEffect, useState } from 'react';
import { ArrowDownLeftIcon, ArrowUpRightIcon, CheckCircle2Icon, ClipboardCheckIcon, RepeatIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchPhcReferrals } from '../../api/workspaces';
import { formatLocalDateTime } from '../../api/services';
import type { PhcReferral } from '../../types/workspaces';

const STATUS: Record<PhcReferral['status'], { label: string; tone: 'pending' | 'success' }> = {
  CREATED: { label: 'Pending', tone: 'pending' },
  ACCEPTED: { label: 'Accepted', tone: 'success' },
  COMPLETED: { label: 'Completed', tone: 'success' },
};

export function PhcReferrals() {
  const { toast } = useToast();
  const { data: referrals, loading, error, reload } = useAsync(() => fetchPhcReferrals(), []);
  const [rows, setRows] = useState<PhcReferral[] | null>(null);

  useEffect(() => {
    if (referrals) setRows(referrals);
  }, [referrals]);

  const list = rows ?? [];

  const advance = (id: string, status: PhcReferral['status']) => {
    const name = rows?.find((r) => r.id === id)?.patientName ?? 'Referral';
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, status } : r)) ?? prev);
    toast(`${name} ${status === 'ACCEPTED' ? 'accepted' : 'completed'}`);
  };

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Referrals</h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Incoming and outgoing referrals managed by the PHC team.
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
            title="No referrals in flow"
            description="Inter-hospital and specialist referral status would be tracked here."
          />
        )}
        {!loading && !error && list.length > 0 && (
          <div className="space-y-2">
            {list.map((referral) => {
              const status = STATUS[referral.status];
              const isIncoming = referral.direction === 'INCOMING';
              return (
                <article key={referral.id} className="flex items-start gap-3 rounded-card border border-line bg-white px-3 py-2.5">
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      isIncoming ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {isIncoming ? <ArrowDownLeftIcon className="h-3.5 w-3.5" /> : <ArrowUpRightIcon className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-medium text-navy">{referral.patientName}</p>
                      <StatusBadge status={isIncoming ? 'Incoming' : 'Outgoing'} tone={isIncoming ? 'info' : 'pending'} />
                    </div>
                    <p className="mt-0.5 text-2xs text-ink-500">
                      {isIncoming ? 'From' : 'To'}: {referral.counterpart}
                    </p>
                    <p className="mt-0.5 text-2xs leading-5 text-ink-500">{referral.reason}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-2xs text-ink-400">{formatLocalDateTime(referral.createdAt)}</span>
                    <StatusBadge status={status.label} tone={status.tone} />
                    {referral.status === 'CREATED' && (
                      <Button size="sm" variant="secondary" onClick={() => advance(referral.id, 'ACCEPTED')}>
                        <CheckCircle2Icon className="h-3.5 w-3.5" /> {isIncoming ? 'Accept' : 'Dispatch'}
                      </Button>
                    )}
                    {referral.status === 'ACCEPTED' && (
                      <Button size="sm" variant="secondary" onClick={() => advance(referral.id, 'COMPLETED')}>
                        <ClipboardCheckIcon className="h-3.5 w-3.5" /> Complete
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