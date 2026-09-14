/**
 * Sync module.
 *
 * Minimal, purpose-built endpoints for the offline sync manager. It does NOT
 * mirror IndexedDB and does NOT create a "/sync-everything" endpoint. Domain
 * mutations (appointments, referrals, consent) still flow through their own
 * APIs with their own idempotency support.
 *
 *  - POST /sync/actions  stages offline-authored server-owned actions so the
 *    client can confirm delivery + get an idempotent ack; the client then
 *    performs the real mutation via the domain endpoint.
 *  - GET  /sync/state    returns non-sensitive per-entity last-synced
 *    watermarks for the authenticated user.
 */

import type { Request, Response } from 'express';
import { AuthError } from '../../utils/errors';
import { sendSuccess } from '../../utils/response';
import { recordAudit } from '../../services/audit.service';
import { SyncState } from '../../database/models/SyncState';

export async function submitActions(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const actions = (req.body?.actions ?? []) as Array<{
    id: string;
    type: string;
    entity: string;
    idempotencyKey?: string;
  }>;

  const results = [];
  for (const action of actions) {
    results.push({
      id: action.id,
      type: action.type,
      entity: action.entity,
      idempotencyKey: action.idempotencyKey || action.id,
      status: 'accepted' as const,
    });
  }

  await recordAudit({
    actorUserId: req.auth.internalUserId,
    action: 'SYNC.ACTIONS_SUBMITTED',
    resourceType: 'sync',
    resourceId: req.auth.internalUserId,
    result: 'SUCCESS',
    requestId: req.requestId,
    ip: req.ip,
    details: { count: actions.length },
  });

  return sendSuccess(res, { results });
}

export async function getSyncState(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const states = await SyncState.find({ userId: req.auth.internalUserId })
    .sort({ entity: 1 })
    .lean();

  const state: Record<string, { lastSyncedAt: string | null; count: number }> = {};
  for (const s of states) {
    state[s.entity] = {
      lastSyncedAt: s.lastSyncedAt?.toISOString() ?? null,
      count: s.lastSyncCount ?? 0,
    };
  }

  return sendSuccess(res, { state, currentTime: new Date().toISOString() });
}

/**
 * Record a sync watermark for an entity (called by the client after a
 * successful offline push of that entity type).
 */
export async function recordEntitySync(userId: string, entity: string, count: number) {
  await SyncState.findOneAndUpdate(
    { userId, entity },
    {
      $set: { lastSyncedAt: new Date(), lastSyncCount: count },
      $setOnInsert: { userId, entity },
    },
    { upsert: true, setDefaultsOnInsert: true },
  ).lean();
}
