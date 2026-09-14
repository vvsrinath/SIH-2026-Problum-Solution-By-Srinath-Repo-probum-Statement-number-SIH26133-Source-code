import { useState } from 'react';
import { Panel } from '../../components/common/Panel';
import { Tabs } from '../../components/common/Tabs';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchReferrals, acceptReferral, formatLocalDateTime } from '../../api/services';
import type { RealReferral } from '../../types';

const tabs = ['Received Referrals', 'Onward Referrals'];

export function SpecialistReferrals() {
  const [tab, setTab] = useState(tabs[0]);
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const referrals = useAsync(() => fetchReferrals(), []);

  const referralList: RealReferral[] = referrals.data ?? [];

  const inbound = referralList.filter((r) => r.status === 'CREATED' || r.status === 'ACCEPTED');
  const onward = referralList.filter(() => tab === 'Onward Referrals');

  const displayed = tab === 'Received Referrals' ? inbound : onward;

  const accept = async (id: string) => {
    setActionError(null);
    setActingId(id);
    try {
      await acceptReferral(id);
      referrals.reload();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not accept the referral. Please try again.',
      );
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">
            Referrals
          </h1>
          <p className="mt-0.5 text-2xs text-ink-500">
            Referrals sent to you by treating doctors.
          </p>
        </div>
        <Tabs tabs={tabs} active={tab} onChange={(next) => { setTab(next); setActionError(null); }} />
      </div>

      {actionError && (
        <div role="alert" className="rounded-card border border-red-200 bg-red-50 px-3 py-2.5 text-2xs text-red-700">
          {actionError}
        </div>
      )}

      <Panel>
        {referrals.loading && <LoadingState rows={4} label="Loading referrals" />}

        {!referrals.loading && referrals.error && (
          <ErrorState
            title="Failed to load referrals"
            detail={referrals.error.message}
            onRetry={referrals.reload}
          />
        )}

        {!referrals.loading && !referrals.error && displayed.length === 0 && (
          <EmptyState
            title="No referrals"
            description="Referrals sent to you will appear here."
          />
        )}

        {!referrals.loading && !referrals.error && displayed.length > 0 && (
          <div className="space-y-2">
            {displayed.map((referral) => (
              <ReferralRow
                key={referral.referralId}
                referral={referral}
                busy={actingId !== null}
                onAccept={accept}
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function ReferralRow({
  referral,
  busy,
  onAccept,
}: {
  referral: RealReferral;
  busy: boolean;
  onAccept: (id: string) => void;
}) {
  const statusLabel = referral.status === 'ACCEPTED' ? 'Accepted' : 'Pending';
  const tone = referral.status === 'ACCEPTED' ? 'success' : 'pending';
  const when = new Date(referral.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const isPending = referral.status === 'CREATED';

  return (
    <article className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[10px] font-semibold text-brand">
        {referral.patientId.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-navy">
          Patient {referral.patientId}
        </p>
        <p className="mt-0.5 truncate text-2xs text-ink-500">
          {referral.reason ?? formatLocalDateTime(referral.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-2xs text-ink-400">{when}</span>
        {isPending ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => onAccept(referral.referralId)}
          >
            Accept
          </Button>
        ) : (
          <StatusBadge status={statusLabel} tone={tone} />
        )}
      </div>
    </article>
  );
}
