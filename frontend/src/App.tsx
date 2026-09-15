import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { AppRoutes } from './routes/AppRoutes';
import { useScrollToTop } from './hooks/useScrollToTop';
import { InstallAppBanner } from './components/pwa/InstallAppBanner';
import { NativeTitleBar } from './components/pwa/NativeTitleBar';
import { OfflineStatus } from './components/pwa/OfflineStatus';
import { usePwa } from './hooks/usePwa';
import { ChatWidget } from './components/chat/ChatWidget';
import { initHybridStorage } from './storage';

initHybridStorage();

const INSTALL_DISMISS_KEY = 'ss:pwa:install-dismissed';

function AppShell() {
  useScrollToTop();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(INSTALL_DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const { isInstalled } = usePwa();

  // Never surface a download/install prompt while running inside the PWA.
  const showInstallBanner = !dismissed && !isInstalled;

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[80] -translate-y-20 rounded-chip border border-line bg-white px-3 py-2 text-xs font-medium text-navy shadow-card transition-transform focus:-translate-y-0"
      >
        Skip to content
      </a>
      <NativeTitleBar />
      <OfflineStatus />
      <AppRoutes />
      <ChatWidget />
      {showInstallBanner && (
        <InstallAppBanner
          onDismiss={() => {
            try {
              localStorage.setItem(INSTALL_DISMISS_KEY, '1');
            } catch {
              /* ignore */
            }
            setDismissed(true);
          }}
        />
      )}
    </>
  );
}

export function App() {
  // GitHub Pages serves project sites under /<repo>/. Use a basename there so
  // react-router matches; anywhere else (Vercel, Docker, domain root) stays '/'.
  const basename =
    window.location.hostname.endsWith('github.io') && window.location.pathname.length > 1
      ? window.location.pathname.split('/').slice(0, 2).join('/') || '/'
      : '/';

  return (
    <BrowserRouter basename={basename}>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <AppShell />
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
