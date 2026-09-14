/**
 * Storage bootstrap — call once at app startup.
 * Records schema version and starts the sync manager.
 */

import { recordSchemaVersion } from './migrations';
import { startSyncManager } from './sync/syncManager';

export function initHybridStorage(): void {
  // Best-effort; never blocks app startup.
  recordSchemaVersion().catch(() => undefined);
  startSyncManager();
}

export { clearLocalUserData, wipeLocalDatabase } from './cleanup';
export { collectAppDiagnostics } from './diagnostics';
