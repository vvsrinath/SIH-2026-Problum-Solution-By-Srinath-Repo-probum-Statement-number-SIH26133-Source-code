/**
 * IndexedDB schema migrations.
 *
 * Dexie version() blocks in db.ts already describe up-schemas. This module
 * documents migrations and provides safe helpers. We never blindly delete the
 * local database on application update — upgrades preserve data where possible
 * and only destructive migrations are used when a store is truly obsolete.
 */

import { db } from './db';
import { isIdbAvailable } from './db';

export interface MigrationRecord {
  from: number;
  to: number;
  description: string;
  destructive: boolean;
}

export const MIGRATIONS: MigrationRecord[] = [
  {
    from: 0,
    to: 1,
    description: 'Initial local schema for chat, caches, drafts, sync, preferences.',
    destructive: false,
  },
];

/**
 * Records the current DB schema version into local app metadata so we can show
 * storage diagnostics without leaking data.
 */
export async function recordSchemaVersion(): Promise<void> {
  if (!isIdbAvailable()) return;
  try {
    const existing = await db.localMetadata.get('schemaVersion');
    const next = { key: 'schemaVersion', ownerUserId: 'system', value: db.verno, updatedAt: new Date().toISOString() };
    if (existing) {
      await db.localMetadata.update('schemaVersion', { value: db.verno, updatedAt: next.updatedAt });
    } else {
      await db.localMetadata.add(next);
    }
  } catch {
    // best-effort; not fatal
  }
}

/**
 * Returns the currently recorded schema version (for diagnostics).
 */
export async function getRecordedSchemaVersion(): Promise<number | null> {
  if (!isIdbAvailable()) return null;
  try {
    const rec = await db.localMetadata.get('schemaVersion');
    return typeof rec?.value === 'number' ? rec.value : null;
  } catch {
    return null;
  }
}
