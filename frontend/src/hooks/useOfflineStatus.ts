/**
 * useOfflineStatus — combined device + backend reachability.
 * navigator.onLine alone is not proof the backend is reachable.
 */

import { useEffect, useState } from 'react';
import {
  getBackendState,
  probeConnectivity,
  subscribeBackend,
} from '../storage/sync/connectivity';

export function useOfflineStatus() {
  const [deviceOnline, setDeviceOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [backendOnline, setBackendOnline] = useState(getBackendState() === 'online');

  useEffect(() => {
    const onOnline = () => {
      setDeviceOnline(true);
      probeConnectivity();
    };
    const onOffline = () => setDeviceOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const unsubscribe = subscribeBackend((state) => {
      setBackendOnline(state === 'online');
      if (state === 'online') onOnline();
    });

    probeConnectivity();

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      unsubscribe();
    };
  }, []);

  return {
    deviceOnline,
    backendOnline,
    fullyOnline: deviceOnline && backendOnline,
  };
}
