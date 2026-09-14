import { WifiOffIcon, WifiIcon } from 'lucide-react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import { useLanguage } from '../../context/LanguageContext';

export function OfflineStatus() {
  const { deviceOnline, backendOnline } = useOfflineStatus();
  const { snapshot } = useSyncStatus();
  const { t } = useLanguage();

  const offline = !deviceOnline || !backendOnline;
  const syncing = snapshot.pending > 0;

  if (!offline && !syncing) return null;

  const offlineLabel = t('pwa.offline') || 'Limited Connection';
  const syncingLabel = t('pwa.syncing') || 'Syncing…';

  return (
    <div
      className={
        offline
          ? 'border-b border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900'
          : 'border-b border-sky-200 bg-sky-50 px-3 py-2 text-center text-xs text-sky-900'
      }
    >
      <div className="flex items-center justify-center gap-2">
        {offline ? (
          <WifiOffIcon className="h-3.5 w-3.5" />
        ) : (
          <WifiIcon className="h-3.5 w-3.5" />
        )}
        <span className="font-medium">{offline ? offlineLabel : syncingLabel}</span>
      </div>
      <p className="mt-0.5 text-[11px] opacity-80">
        {offline
          ? t('pwa.offlineMessage') || 'You are currently offline. Some actions are saved locally.'
          : snapshot.pending > 0
            ? `${snapshot.pending} change(s) waiting to sync.`
            : 'Waiting for connection.'}
      </p>
    </div>
  );
}

export function OnlineStatus() {
  const { deviceOnline, backendOnline } = useOfflineStatus();
  const { t } = useLanguage();

  if (deviceOnline && backendOnline) return null;

  return (
    <div className="border-b border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs text-emerald-900">
      <div className="flex items-center justify-center gap-2">
        <WifiIcon className="h-3.5 w-3.5" />
        <span className="font-medium">{t('pwa.online') || 'Connection restored'}</span>
      </div>
    </div>
  );
}
