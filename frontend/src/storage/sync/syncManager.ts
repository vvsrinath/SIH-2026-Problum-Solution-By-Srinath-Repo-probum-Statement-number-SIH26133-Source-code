/**
 * Sync manager — top-level coordinator.
 *
 * Subscribes to connectivity state and flushes the sync queue when the backend
 * becomes reachable. Exposes a manual trigger and observable stats for the UI.
 */

import { probeConnectivity, getBackendState, subscribeBackend } from './connectivity';
import { flushSyncQueue, getSyncStats } from './syncQueue';

export interface SyncSnapshot {
  pending: number;
  failed: number;
  done: number;
  lastSyncAt: string | null;
  backendState: string;
}

let lastSyncAt: string | null = null;
let flushing = false;
const globalListeners = new Set<(s: SyncSnapshot) => void>();
let started = false;

export function subscribeSync(listener: (s: SyncSnapshot) => void): () => void {
  globalListeners.add(listener);
  return () => globalListeners.delete(listener);
}

async function broadcast() {
  const stats = await getSyncStats();
  const snapshot: SyncSnapshot = {
    ...stats,
    lastSyncAt,
    backendState: getBackendState(),
  };
  globalListeners.forEach((l) => l(snapshot));
}

async function runFlush() {
  if (flushing) return;
  flushing = true;
  try {
    const result = await flushSyncQueue();
    if (result.processed > 0 || result.failed > 0) {
      lastSyncAt = new Date().toISOString();
    }
  } finally {
    flushing = false;
    await broadcast();
  }
}

/**
 * Start the sync manager (subscribe to connectivity, probe once). Safe to call
 * multiple times — guarded internally.
 */
export function startSyncManager(): void {
  if (started) return;
  started = true;

  subscribeBackend((state) => {
    if (state === 'online') {
      runFlush();
    }
  });

  // Probe initial state; flush if already online.
  probeConnectivity().then((online) => {
    if (online) runFlush();
  });

  // Periodic safety net every 30s while open.
  setInterval(runFlush, 30000);
}

/** Manually trigger a flush (e.g. from a "Retry" button). */
export function triggerSync(): Promise<void> {
  return runFlush();
}

export { getSyncStats };
