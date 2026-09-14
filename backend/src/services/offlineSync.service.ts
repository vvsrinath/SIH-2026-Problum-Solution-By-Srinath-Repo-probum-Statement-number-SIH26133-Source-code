/**
 * Offline Sync Strategy — Swasthya Sathi (SIH26133)
 *
 * Healthcare data must be accessible offline in rural areas with poor connectivity.
 * Strategy:
 *   - PWA service worker caches static assets (cache-first)
 *   - API responses cached in IndexedDB with timestamps
 *   - Mutations queued offline, synced when online
 *   - Conflict resolution: last-write-wins with server timestamp
 *   - E2EE messages stored encrypted in IndexedDB (server never sees plaintext)
 *
 * Sync priority (highest first):
 *   1. Emergency/safety data (triage results, emergency contacts)
 *   2. Active appointments and consultations
 *   3. Patient profile and health records
 *   4. Referrals and follow-ups
 *   5. Consent and privacy records
 *   6. Notifications
 */

// ---------------------------------------------------------------------------
// Sync configuration
// ---------------------------------------------------------------------------

export const SYNC_CONFIG = {
  /** Maximum age (ms) before a cached response is considered stale */
  STALE_THRESHOLD_MS: 5 * 60 * 1000, // 5 minutes

  /** Maximum number of offline mutations to queue */
  MAX_QUEUED_MUTATIONS: 100,

  /** Sync retry backoff (exponential, ms) */
  RETRY_BASE_MS: 1000,
  RETRY_MAX_MS: 30000,
  RETRY_MAX_ATTEMPTS: 5,

  /** IndexedDB database name */
  DB_NAME: 'swasthya-sathi-offline',

  /** Object stores */
  STORES: {
    CACHE: 'api-cache',          // cached API responses
    MUTATIONS: 'pending-mutations', // queued offline mutations
    KEYS: 'encryption-keys',     // E2EE key material
    MESSAGES: 'encrypted-messages', // encrypted message cache
    PROFILE: 'user-profile',     // user profile cache
  },
} as const;

// ---------------------------------------------------------------------------
// Sync priority levels
// ---------------------------------------------------------------------------

export const SYNC_PRIORITY = {
  EMERGENCY: 0,
  APPOINTMENTS: 1,
  HEALTH_RECORDS: 2,
  REFERRALS: 3,
  CONSENT: 4,
  NOTIFICATIONS: 5,
} as const;

/**
 * Map API paths to sync priorities.
 */
export function getSyncPriority(path: string): number {
  if (path.includes('/triage') || path.includes('/emergency')) return SYNC_PRIORITY.EMERGENCY;
  if (path.includes('/appointments') || path.includes('/consultations')) return SYNC_PRIORITY.APPOINTMENTS;
  if (path.includes('/patients') || path.includes('/doctors')) return SYNC_PRIORITY.HEALTH_RECORDS;
  if (path.includes('/referrals') || path.includes('/followups')) return SYNC_PRIORITY.REFERRALS;
  if (path.includes('/consent') || path.includes('/privacy')) return SYNC_PRIORITY.CONSENT;
  if (path.includes('/notifications')) return SYNC_PRIORITY.NOTIFICATIONS;
  return SYNC_PRIORITY.HEALTH_RECORDS;
}

// ---------------------------------------------------------------------------
// Conflict resolution
// ---------------------------------------------------------------------------

export interface SyncTimestamp {
  serverTime: string;   // ISO timestamp from server
  clientTime: string;   // ISO timestamp from client
  version: number;      // optimistic version number
}

/**
 * Resolve conflict between local and server versions.
 * Strategy: last-write-wins based on server timestamp.
 * For clinical data, server always wins (source of truth).
 */
export function resolveConflict<T extends { updatedAt?: string }>(
  local: T,
  server: T,
  isClinicalData: boolean = false,
): { winner: 'server' | 'local'; data: T } {
  if (isClinicalData) {
    // Clinical data: server always wins
    return { winner: 'server', data: server };
  }

  // Non-clinical: last-write-wins
  const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
  const serverTime = server.updatedAt ? new Date(server.updatedAt).getTime() : 0;

  if (serverTime >= localTime) {
    return { winner: 'server', data: server };
  }
  return { winner: 'local', data: local };
}

// ---------------------------------------------------------------------------
// Offline mutation queue
// ---------------------------------------------------------------------------

export interface OfflineMutation {
  id: string;
  method: string;
  path: string;
  body: unknown;
  headers: Record<string, string>;
  createdAt: string;
  retryCount: number;
  priority: number;
  synced: boolean;
}

/**
 * Create an offline mutation to be synced later.
 */
export function createMutation(input: {
  method: string;
  path: string;
  body: unknown;
  headers?: Record<string, string>;
}): OfflineMutation {
  return {
    id: `mut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    method: input.method.toUpperCase(),
    path: input.path,
    body: input.body,
    headers: input.headers || {},
    createdAt: new Date().toISOString(),
    retryCount: 0,
    priority: getSyncPriority(input.path),
    synced: false,
  };
}

/**
 * Calculate retry delay with exponential backoff.
 */
export function getRetryDelay(retryCount: number): number {
  const delay = SYNC_CONFIG.RETRY_BASE_MS * Math.pow(2, retryCount);
  return Math.min(delay, SYNC_CONFIG.RETRY_MAX_MS);
}

// ---------------------------------------------------------------------------
// Data to cache for offline access
// ---------------------------------------------------------------------------

export const OFFLINE_CACHE_PATHS = [
  '/api/v1/auth/me',
  '/api/v1/patients',
  '/api/v1/doctors',
  '/api/v1/appointments',
  '/api/v1/consent',
  '/api/v1/privacy/requests',
  '/api/v1/notifications',
  '/api/v1/triage',
] as const;

/**
 * Check if a path should be cached for offline use.
 */
export function shouldCacheOffline(path: string): boolean {
  return OFFLINE_CACHE_PATHS.some((p) => path.startsWith(p));
}

/**
 * Get the cache TTL for a path based on data sensitivity.
 */
export function getCacheTTL(path: string): number {
  // Emergency data: cache longer
  if (path.includes('/triage') || path.includes('/emergency')) return 60 * 60 * 1000; // 1 hour
  // Appointments: moderate TTL
  if (path.includes('/appointments')) return 15 * 60 * 1000; // 15 minutes
  // Profile data: longer TTL
  if (path.includes('/patients') || path.includes('/doctors')) return 30 * 60 * 1000; // 30 minutes
  // Default
  return 5 * 60 * 1000; // 5 minutes
}
