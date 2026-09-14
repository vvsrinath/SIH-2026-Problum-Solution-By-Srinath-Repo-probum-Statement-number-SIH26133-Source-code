import { useEffect, useMemo, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePwa() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isTouch, setIsTouch] = useState(false);

  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => setIsInstalled(true);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone;
    setIsInstalled(Boolean(standalone));

    // Phone/tablet detection: a coarse pointer means a touch device.
    const coarse = window.matchMedia('(pointer: coarse)');
    const updateTouch = () => setIsTouch(coarse.matches);
    updateTouch();
    coarse.addEventListener('change', updateTouch);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
      coarse.removeEventListener('change', updateTouch);
    };
  }, []);

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ reports as Mac but is touch-capable
    (navigator.platform === 'MacIntel' && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints > 1);

  const canInstall = useMemo(
    () => Boolean(deferredPrompt) && !isInstalled && !isStandalone,
    [deferredPrompt, isInstalled, isStandalone],
  );

  // Never encourage install when already running as the PWA, or not on a touch device.
  const showInstall = isTouch && !isInstalled && !isStandalone;

  const install = async () => {
    if (!deferredPrompt || isStandalone || isInstalled) return false;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return choice.outcome === 'accepted';
  };

  return { canInstall, install, isInstalled, isOnline, isTouch, isIOS, showInstall };
}
