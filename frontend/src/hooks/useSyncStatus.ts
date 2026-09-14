/**
 * useSyncStatus — observe sync queue + connectivity state.
 */

import { useEffect, useState } from 'react';
import { subscribeSync, triggerSync, type SyncSnapshot } from '../storage/sync/syncManager';

export function useSyncStatus() {
  const [snapshot, setSnapshot] = useState<SyncSnapshot>({
    pending: 0,
    failed: 0,
    done: 0,
    lastSyncAt: null,
    backendState: 'unknown',
  });

  useEffect(() => {
    const unsubscribe = subscribeSync(setSnapshot);
    return unsubscribe;
  }, []);

  return {
    snapshot,
    retry: triggerSync,
  };
}
