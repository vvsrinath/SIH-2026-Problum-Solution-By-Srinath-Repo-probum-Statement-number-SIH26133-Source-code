import { DownloadIcon, ShareIcon, XIcon } from 'lucide-react';
import { Button } from '../common/Button';
import { usePwa } from '../../hooks/usePwa';
import { useDesktop } from '../../hooks/useDesktop';
import { useLanguage } from '../../context/LanguageContext';
import { DesktopAppBanner } from './DesktopAppBanner';

interface InstallAppBannerProps {
  onDismiss?: () => void;
}

export function InstallAppBanner({ onDismiss }: InstallAppBannerProps) {
  const { canInstall, install, isInstalled, isIOS, showInstall } = usePwa();
  const { isDesktop, isTablet } = useDesktop();
  const { t } = useLanguage();

  // Hidden once installed.
  if (isInstalled) return null;

  // Desktop computers: recommend installing the PWA as a native desktop app.
  if (isDesktop) {
    return (
      <DesktopAppBanner
        canInstall={canInstall}
        install={install}
        onDismiss={onDismiss}
      />
    );
  }

  // Phones/tablets keep the home-screen prompt.
  if (!showInstall) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 rounded-2xl border border-brand/25 bg-white p-3 shadow-pop md:bottom-6 md:left-auto md:right-6 md:max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand">
          {isIOS ? <ShareIcon className="h-4 w-4" /> : <DownloadIcon className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy">{t('pwa.installTitle')}</p>
          {canInstall ? (
            <>
              <p className="mt-1 text-xs leading-5 text-ink-500">
                {isTablet
                  ? 'Get faster access to healthcare services right on your tablet.'
                  : t('pwa.installDescription')}
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => void install()}>{t('pwa.installAction')}</Button>
                <Button variant="secondary" size="sm" onClick={onDismiss}>{t('pwa.dismissAction')}</Button>
              </div>
            </>
          ) : isIOS ? (
            <>
              <p className="mt-1 text-xs leading-5 text-ink-500">
                Tap <span className="font-medium text-navy">Share</span> ⤴, then
                choose <span className="font-medium text-navy">“Add to Home Screen”</span> to
                install the app{isTablet ? ' on your tablet' : ''}.
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" size="sm" onClick={onDismiss}>{t('pwa.dismissAction')}</Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-xs leading-5 text-ink-500">
                Add this app to your home screen for quick, app-like access.
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" size="sm" onClick={onDismiss}>{t('pwa.dismissAction')}</Button>
              </div>
            </>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            aria-label="Dismiss install prompt"
            onClick={onDismiss}
            className="rounded-full p-1.5 text-ink-400 hover:bg-line-soft hover:text-navy"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}