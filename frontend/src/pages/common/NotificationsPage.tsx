import { BellIcon } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchNotifications, markNotificationRead, formatLocalDateTime } from '../../api/services';
import type { NotificationItem } from '../../types';
import { cn } from '../../utils/cn';

const TYPE_LABEL: Record<NotificationItem['type'], string> = {
  APPOINTMENT: 'Appointment',
  REFERRAL: 'Referral',
  FOLLOWUP: 'Follow-up',
  CONSENT: 'Consent',
  PRIVACY: 'Privacy',
  GENERAL: 'General',
};

const TYPE_TONE: Record<NotificationItem['type'], 'success' | 'info' | 'pending' | 'neutral' | 'danger'> = {
  APPOINTMENT: 'info',
  REFERRAL: 'pending',
  FOLLOWUP: 'success',
  CONSENT: 'info',
  PRIVACY: 'danger',
  GENERAL: 'neutral',
};

export function NotificationsPage() {
  const { data, loading, error, reload } = useAsync(() => fetchNotifications(), []);

  const items: NotificationItem[] = data?.items ?? [];
  const unreadCount = data?.unread ?? 0;

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    reload();
  }

  return (
    <div className="space-y-3 pb-24 md:pb-0">
      <div className="rounded-2xl border border-line bg-gradient-to-br from-brand-tint2 via-white to-emerald-50 p-3 shadow-card sm:p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.12em] text-brand">Swasthya Sathi</p>
            <h1 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-navy sm:text-xl md:text-2xl">
              Notifications
            </h1>
          </div>
          {unreadCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-500 px-2.5 py-0.5 text-2xs font-semibold text-white">
              {unreadCount} unread
            </span>
          )}
          <div className="flex-shrink-0 rounded-full border border-line bg-white p-1.5 text-ink-500">
            <BellIcon className="h-4 w-4" />
          </div>
        </div>
      </div>

      {error ? (
        <ErrorState
          title="Couldn't load notifications"
          detail="Some data failed to load. Please try again."
          onRetry={reload}
        />
      ) : loading ? (
        <LoadingState rows={5} />
      ) : items.length === 0 ? (
        <EmptyState
          title="You're all caught up"
          description="No notifications to display. Alerts about appointments, referral responses and follow-up reminders will appear here."
          icon={<BellIcon className="h-4 w-4" />}
        />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <button
              key={n.notificationId}
              type="button"
              onClick={() => {
                if (!n.read) handleMarkRead(n.notificationId);
              }}
              className={cn(
                'w-full rounded-card border px-3 py-3 text-left shadow-sm transition-colors hover:border-brand/30 sm:px-4 sm:py-4',
                n.read
                  ? 'border-line bg-white'
                  : 'border-l-4 border-l-brand border-t-brand-tint border-r-brand-tint border-b-brand-tint bg-brand-tint2/30',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn('text-xs sm:text-sm', n.read ? 'font-medium text-navy' : 'font-semibold text-navy')}>
                      {n.title}
                    </p>
                    <StatusBadge status={TYPE_LABEL[n.type]} tone={TYPE_TONE[n.type]} />
                  </div>
                  <p className="mt-1 text-2xs leading-5 text-ink-500">{n.body}</p>
                </div>
                <span className="shrink-0 text-2xs text-ink-400">
                  {formatLocalDateTime(n.createdAt)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
