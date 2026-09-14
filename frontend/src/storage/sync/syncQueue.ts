/**
 * Sync queue orchestration.
 *
 * Drains local server-sync actions when the backend is reachable. Every item
 * already carries an idempotency key (its id) so nothing is blindly replayed.
 * Server-owned mutations (e.g. appointment creation) are performed against
 * their domain endpoint with the Idempotency-Key header, backed by the
 * backend idempotency middleware.
 */

import {
  getPending,
  markProcessing,
  markDone,
  markFailed,
  getQueueStats,
} from '../repositories/syncRepository';
import { checkBackendReachable } from './connectivity';
import type { SyncQueueItem } from '../db';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export interface SyncRunResult {
  processed: number;
  failed: number;
}

const OUTBOUND_MUTATIONS: Record<string, { method: string; path: (entityId?: string) => string }> = {
  appointmentCreate: { method: 'POST', path: () => '/api/v1/appointments' },
  referralCreate: { method: 'POST', path: () => '/api/v1/referrals' },
  consentGive: { method: 'POST', path: () => '/api/v1/consent' },
};

/**
 * Perform a single queued mutation against its domain endpoint with an
 * Idempotency-Key header. Throws so the queue marks it failed on error.
 */
async function executeMutation(item: SyncQueueItem): Promise<void> {
  const template = OUTBOUND_MUTATIONS[item.type];
  if (!template) {
    // Unknown type — acknowledge via the generic sync endpoint instead.
    await submitGenericAction(item);
    return;
  }

  const res = await fetch(`${API_BASE}${template.path(item.entityId)}`, {
    method: template.method,
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': item.idempotencyKey,
    },
    credentials: 'include',
    body: JSON.stringify(item.payload ?? {}),
  });

  // A 4xx/5xx that is not a retryable failure (e.g. conflict, validation).
  if (!res.ok) {
    if (res.status === 409 || res.status === 422 || res.status === 400) {
      // Non-retryable: mark as failed permanently.
      await markFailed(item.id, `${res.status}`);
      throw new Error(`non-retryable-${res.status}`);
    }
    throw new Error(`http-${res.status}`);
  }
}

async function submitGenericAction(item: SyncQueueItem): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/sync/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      actions: [
        {
          id: item.id,
          type: item.type,
          entity: item.entity,
          idempotencyKey: item.idempotencyKey,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`http-${res.status}`);
}

/**
 * Attempt to flush the whole pending queue once. Returns counts.
 */
export async function flushSyncQueue(): Promise<SyncRunResult> {
  const reachable = await checkBackendReachable();
  if (!reachable) return { processed: 0, failed: 0 };

  const pending = await getPending();
  let processed = 0;
  let failed = 0;

  for (const item of pending) {
    await markProcessing(item.id);
    try {
      await executeMutation(item);
      await markDone(item.id);
      processed += 1;
    } catch (err: any) {
      if (err?.message?.startsWith('non-retryable-')) {
        failed += 1;
      } else {
        await markFailed(item.id, err?.message ?? 'unknown');
        failed += 1;
      }
    }
  }

  return { processed, failed };
}

export async function getSyncStats() {
  return getQueueStats();
}
