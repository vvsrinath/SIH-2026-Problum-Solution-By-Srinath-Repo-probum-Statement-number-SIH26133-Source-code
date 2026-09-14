import { useState } from 'react';
import { CheckIcon, Loader2Icon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { Tabs } from '../../components/common/Tabs';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchReferrals, acceptReferral } from '../../api/services';
import type { RealReferral } from '../../types';

const tabs = ['Incoming Referrals', 'All Referrals'];

export function DoctorReferrals() {
  const [tab, setTab] = useState(tabs[0]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const referrals = useAsync(() => fetchReferrals(), []);

  const referralList: RealReferral[] = referrals.data ?? [];

  const shown = tab === tabs[0]
    ? referralList.filter((referral) => referral.status === 'CREATED')
    : referralList;

  const handleAccept = async (referral: RealReferral) => {
    setActionError(null);
    setAcceptingId(referral.referralId);
    try {
      await acceptReferral(referral.referralId);
      referrals.reload();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not accept the referral. Please try again.',
      );
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">
            Referral Management
          </h1>
          <p className="mt-0.5 text-2xs text-ink-500">
            Track referrals shared with you and accept the ones awaiting your response.
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
        {referrals.loading && <LoadingState rows={3} label="Loading referrals" />}

        {!referrals.loading && referrals.error && (
          <ErrorState
            title="Failed to load referrals"
            detail={referrals.error.message}
            onRetry={referrals.reload}
          />
        )}

        {!referrals.loading && !referrals.error && shown.length === 0 && (
          <EmptyState
            title="Nothing here yet"
            description="Referrals will appear in this list as they are created."
          />
        )}

        {!referrals.loading && !referrals.error && shown.length > 0 && (
          <div className="space-y-2">
            {shown.map((referral) => (
              <ReferralRow
                key={referral.referralId}
                referral={referral}
                accepting={acceptingId === referral.referralId}
                disabled={acceptingId !== null}
                onAccept={() => handleAccept(referral)}
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
  accepting,
  disabled,
  onAccept,
}: {
  referral: RealReferral;
  accepting: boolean;
  disabled: boolean;
  onAccept: () => void;
}) {
  const statusLabel = referral.status === 'ACCEPTED' ? 'Accepted' : 'Pending';
  const tone = referral.status === 'ACCEPTED' ? 'success' : 'pending';
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
          {new Date(referral.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
        {referral.reason && (
          <p className="mt-1 truncate text-2xs text-ink-400">{referral.reason}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge status={statusLabel} tone={tone} />
        {referral.status === 'CREATED' && (
          <Button
            variant="secondary"
            size="sm"
            disabled={accepting || disabled}
            onClick={onAccept}
          >
            {accepting ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <CheckIcon className="h-3 w-3" />}
            Accept
          </Button>
        )}
      </div>
    </article>
  );
}
