/**
 * Sync repository — the local sync queue and offline actions.
 * Every item carries an idempotency key so operations are never blindly
 * replayed (duplicate execution after reconnect could cause damage).
 */

import { db, isIdbAvailable } from '../db';
import type { SyncQueueItem, SyncItemStatus } from '../db';
import { randomId } from '../encryption/crypto';

export interface EnqueueOptions {
  type: string;
  entity: string;
  entityId?: string;
  payload: unknown;
  idempotencyKey?: string;
  ownerUserId?: string;
}

export async function enqueue(item: EnqueueOptions): Promise<SyncQueueItem | null> {
  if (!isIdbAvailable()) return null;
  const now = new Date().toISOString();
  const id = item.idempotencyKey || randomId('op');
  const record: SyncQueueItem = {
    id,
    type: item.type,
    entity: item.entity,
    entityId: item.entityId,
    payload: item.payload,
    createdAt: now,
    retryCount: 0,
    status: 'pending',
    idempotencyKey: id,
    lastError: undefined,
  };
  await db.syncQueue.put(record);

  await db.offlineActions.put({
    id,
    type: item.type,
    entity: item.entity,
    entityId: item.entityId,
    payload: item.payload,
    createdAt: now,
    status: 'pending',
    idempotencyKey: id,
  });

  return record;
}

export async function getPending(): Promise<SyncQueueItem[]> {
  if (!isIdbAvailable()) return [];
  return db.syncQueue.toCollection().filter((i) => i.status === 'pending').sortBy('createdAt');
}

export async function markProcessing(id: string): Promise<void> {
  if (!isIdbAvailable()) return;
  await db.syncQueue.update(id, { status: 'processing' });
}

export async function markDone(id: string): Promise<void> {
  if (!isIdbAvailable()) return;
  await db.syncQueue.update(id, { status: 'done' });
  await db.offlineActions.update(id, { status: 'done' });
}

export async function markFailed(id: string, error: string): Promise<void> {
  if (!isIdbAvailable()) return;
  const item = await db.syncQueue.get(id);
  const retryCount = (item?.retryCount ?? 0) + 1;
  const status: SyncItemStatus = retryCount >= 5 ? 'failed' : 'pending';
  await db.syncQueue.update(id, { retryCount, status, lastError: error });
  await db.offlineActions.update(id, { status });
}

export async function getQueueStats(): Promise<{ pending: number; failed: number; done: number }> {
  if (!isIdbAvailable()) return { pending: 0, failed: 0, done: 0 };
  const all = await db.syncQueue.toArray();
  return {
    pending: all.filter((i) => i.status === 'pending' || i.status === 'processing').length,
    failed: all.filter((i) => i.status === 'failed').length,
    done: all.filter((i) => i.status === 'done').length,
  };
}

export async function clearDoneItemsRetention(maxAgeDays = 30): Promise<void> {
  if (!isIdbAvailable()) return;
  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 3600 * 1000).toISOString();
  await db.syncQueue.where('status').equals('done').filter((i) => i.createdAt < cutoff).delete();
  await db.offlineActions.where('status').equals('done').filter((i) => i.createdAt < cutoff).delete();
}
