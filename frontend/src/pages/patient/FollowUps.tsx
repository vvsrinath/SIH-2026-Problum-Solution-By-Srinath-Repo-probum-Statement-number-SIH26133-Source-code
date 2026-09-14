import { useState } from 'react';
import { BellRingIcon, CalendarCheckIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { fetchFollowUps, completeFollowUp, formatLocalDateTime } from '../../api/services';
import { useAsync } from '../../hooks/useAsync';
import type { FollowUpStatus } from '../../types';

const STATUS_LABEL: Record<FollowUpStatus, string> = {
  SCHEDULED: 'Scheduled',
  PENDING: 'Pending',
  COMPLETED: 'Completed',
};

export function FollowUps() {
  const { data: followUps, loading, error, reload } = useAsync(() => fetchFollowUps(), []);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleComplete = async (id: string) => {
    if (completingId) return;
    setCompletingId(id);
    setActionError(null);
    try {
      await completeFollowUp(id);
      reload();
    } catch {
      setActionError('Could not mark this follow-up as complete. Please try again.');
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">
          Follow-ups
        </h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Reminders for reviews and report check-ins after a consultation.
        </p>
      </div>

      <Panel title="Scheduled follow-ups" subtitle="Reminders from your consultations.">
        {loading && <LoadingState rows={3} label="Loading follow-ups" />}

        {!loading && error && (
          <ErrorState
            title="Failed to load follow-ups"
            detail={error.message}
            onRetry={reload}
          />
        )}

        {!loading && !error && followUps && followUps.length === 0 && (
          <EmptyState
            title="No follow-ups yet"
            description="When a follow-up check-in is scheduled after your consultation, it will appear here."
          />
        )}

        {!loading && !error && followUps && followUps.length > 0 && (
          <ul className="space-y-2">
            {followUps.map((item) => (
              <li
                key={item.followUpId}
                className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-brand-tint text-brand">
                  {item.status === 'COMPLETED' ? (
                    <CalendarCheckIcon className="h-4 w-4" />
                  ) : (
                    <BellRingIcon className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-navy">
                    {item.reason || 'Follow-up'}
                  </span>
                  <span className="block truncate text-2xs text-ink-500">
                    {item.scheduledAt
                      ? `Due ${formatLocalDateTime(item.scheduledAt)}`
                      : 'No date set'}
                    {item.instructions ? ` · ${item.instructions}` : ''}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {item.status !== 'COMPLETED' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={completingId === item.followUpId}
                      onClick={() => handleComplete(item.followUpId)}>
                      {completingId === item.followUpId ? 'Completing…' : 'Mark complete'}
                    </Button>
                  )}
                  <StatusBadge
                    status={STATUS_LABEL[item.status] ?? item.status}
                    tone={item.status === 'SCHEDULED' ? 'info' : undefined}
                  />
                </span>
              </li>
            ))}
          </ul>
        )}

        {actionError && (
          <p role="alert" className="mt-3 text-2xs text-red-600">
            {actionError}
          </p>
        )}
      </Panel>

      <div className="flex items-center justify-between rounded-card border border-line bg-white px-4 py-3">
        <p className="text-2xs text-ink-500">
          Need to see a doctor sooner? Book an earlier appointment.
        </p>
        <Button variant="secondary" to="/patient/appointments">
          Book appointment
        </Button>
      </div>
    </div>
  );
}
