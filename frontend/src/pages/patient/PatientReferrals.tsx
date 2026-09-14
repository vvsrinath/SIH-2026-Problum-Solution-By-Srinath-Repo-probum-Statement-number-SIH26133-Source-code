import { useMemo } from 'react';
import { Panel } from '../../components/common/Panel';
import { Timeline } from '../../components/common/Timeline';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { fetchReferrals, formatLocalDateTime } from '../../api/services';
import { useAsync } from '../../hooks/useAsync';
import type { JourneyStep, RealReferral, RealReferralStatus } from '../../types';

const STATUS_LABEL: Record<RealReferralStatus, string> = {
  CREATED: 'Pending',
  ACCEPTED: 'Accepted',
};

export function PatientReferrals() {
  const { data: referrals, loading, error, reload } = useAsync(() => fetchReferrals(), []);

  const journeySteps = useMemo<JourneyStep[]>(() => {
    const sorted = [...(referrals ?? [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return sorted.map((referral, index) => ({
      id: `${referral.referralId}-step`,
      label: referral.reason || `Referral ${index + 1}`,
      status: referral.status === 'ACCEPTED' ? 'Completed' : 'In Progress',
      detail: `${STATUS_LABEL[referral.status] ?? referral.status} · ${formatLocalDateTime(referral.createdAt)}`,
    }));
  }, [referrals]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">
          My Referrals
        </h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Track referrals raised by your doctor and their current status.
        </p>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Referrals" subtitle="Referral records from your doctor.">
          {loading && <LoadingState rows={3} label="Loading referrals" />}

          {!loading && error && (
            <ErrorState
              title="Failed to load referrals"
              detail={error.message}
              onRetry={reload}
            />
          )}

          {!loading && !error && referrals && referrals.length === 0 && (
            <EmptyState
              title="No referrals yet"
              description="If your doctor refers you to a specialist, it will appear here."
            />
          )}

          {!loading && !error && referrals && referrals.length > 0 && (
            <div className="space-y-2">
              {referrals.map((referral) => (
                <ReferralRow key={referral.referralId} referral={referral} />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Referral progress" subtitle="Status of your active referrals.">
          {loading && <LoadingState rows={3} label="Loading referrals" />}

          {!loading && error && (
            <ErrorState
              title="Failed to load referral progress"
              detail={error.message}
              onRetry={reload}
            />
          )}

          {!loading && !error && journeySteps.length === 0 && (
            <EmptyState
              title="No referral progress"
              description="Referral milestones will appear here once a doctor refers you."
            />
          )}

          {!loading && !error && journeySteps.length > 0 && (
            <Timeline steps={journeySteps} orientation="vertical" />
          )}
        </Panel>
      </div>
    </div>
  );
}

function ReferralRow({ referral }: { referral: RealReferral }) {
  const label = STATUS_LABEL[referral.status] ?? referral.status;
  return (
    <article className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[10px] font-semibold text-brand">
        {referral.referralId.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-navy">
          {referral.reason || 'Referral'}
        </p>
        {referral.clinicalSummary && (
          <p className="mt-0.5 truncate text-2xs text-ink-500">
            {referral.clinicalSummary}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-2xs text-ink-400">
          {formatLocalDateTime(referral.createdAt)}
        </span>
        <StatusBadge status={label} />
      </div>
    </article>
  );
}
