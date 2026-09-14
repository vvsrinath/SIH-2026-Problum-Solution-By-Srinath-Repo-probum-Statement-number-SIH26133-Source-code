/**
 * Safe storage diagnostics for developers/admins.
 * Exposes non-sensitive counts and availability — never data contents.
 */

import { db, isIdbAvailable } from './db';
import { getQueueStats } from './repositories/syncRepository';
import { getBackendState } from './sync/connectivity';
import { getRecordedSchemaVersion } from './migrations';

export interface StorageDiagnostics {
  idbAvailable: boolean;
  schemaVersion: number | null;
  storageUsageMb: number | null;
  counts: Record<string, number>;
  error: string | null;
}

export interface AppDiagnostics {
  storage: StorageDiagnostics;
  network: { online: boolean; backendState: string };
  socket: { connected: boolean };
  sync: { pending: number; failed: number; done: number };
}

export async function collectStorageDiagnostics(): Promise<StorageDiagnostics> {
  const result: StorageDiagnostics = {
    idbAvailable: isIdbAvailable(),
    schemaVersion: null,
    storageUsageMb: null,
    counts: {},
    error: null,
  };

  if (!isIdbAvailable()) return result;

  try {
    result.schemaVersion = await getRecordedSchemaVersion();

    const stores = [
      'chatMessages',
      'conversations',
      'drafts',
      'cachedFacilities',
      'cachedProviders',
      'cachedHealthcareData',
      'offlineActions',
      'syncQueue',
      'preferences',
      'localMetadata',
      'pendingBooking',
    ] as const;

    for (const store of stores) {
      const table = (db as any)[store];
      if (table) result.counts[store] = await table.count();
    }

    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      const bytes = Number(estimate.usage ?? 0);
      result.storageUsageMb = Math.round((bytes / (1024 * 1024)) * 100) / 100;
    }
  } catch (err: any) {
    result.error = err?.message ?? 'unknown';
  }

  return result;
}

export async function collectAppDiagnostics(): Promise<AppDiagnostics> {
  const [storage, syncStats] = await Promise.all([
    collectStorageDiagnostics(),
    getQueueStats(),
  ]);

  return {
    storage,
    network: {
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      backendState: getBackendState(),
    },
    socket: { connected: false }, // populated by socket layer when available
    sync: syncStats,
  };
}
