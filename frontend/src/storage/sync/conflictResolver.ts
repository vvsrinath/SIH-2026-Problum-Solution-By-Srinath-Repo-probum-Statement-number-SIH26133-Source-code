/**
 * Conflict resolution policies.
 *
 * The server remains authoritative for server-owned entities (appointment,
 * slot, referral, provider availability). Local-only entities (drafts, UI
 * preferences) are client-authoritative. Selected non-sensitive caches can
 * merge.
 */

export type ConflictMode =
  | 'SERVER_WINS' // authoritative server entity
  | 'CLIENT_WINS' // local-only entity
  | 'MERGE' // selected non-sensitive cached data
  | 'LATEST_WINS';

interface Policy {
  mode: ConflictMode;
}

const SERVER_AUTHORITATIVE = ['appointment', 'slot', 'referral', 'availability', 'consent'];
const CLIENT_AUTHORITATIVE = ['draft', 'preference', 'pendingBooking'];
const MERGEABLE = ['cachedFacility', 'cachedProvider'];

export function resolveConflictPolicy(entity: string): Policy {
  if (SERVER_AUTHORITATIVE.includes(entity)) return { mode: 'SERVER_WINS' };
  if (CLIENT_AUTHORITATIVE.includes(entity)) return { mode: 'CLIENT_WINS' };
  if (MERGEABLE.includes(entity)) return { mode: 'MERGE' };
  return { mode: 'SERVER_WINS' }; // safe default
}

/**
 * Given a locally-held value and the server's authoritative value, returns
 * which value should be kept.
 */
export function resolveConflict<T>(entity: string, local: T, server: T): { winner: T; source: 'local' | 'server' } {
  const { mode } = resolveConflictPolicy(entity);
  switch (mode) {
    case 'CLIENT_WINS':
      return { winner: local, source: 'local' };
    case 'SERVER_WINS':
    case 'MERGE':
    default:
      return { winner: server, source: 'server' };
  }
}

/**
 * File / record-sync conflict: prefer the later updatedAt unless the entity
 * is server-authoritative, in which case server wins regardless.
 */
export function resolveTimestampedConflict<T extends { updatedAt?: string }>(
  entity: string,
  local: T,
  server: T,
): { winner: T; source: 'local' | 'server' } {
  const { mode } = resolveConflictPolicy(entity);
  if (mode === 'SERVER_WINS') return { winner: server, source: 'server' };
  if (mode === 'CLIENT_WINS') return { winner: local, source: 'local' };
  const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
  const serverTime = server.updatedAt ? new Date(server.updatedAt).getTime() : 0;
  return localTime >= serverTime
    ? { winner: local, source: 'local' }
    : { winner: server, source: 'server' };
}
