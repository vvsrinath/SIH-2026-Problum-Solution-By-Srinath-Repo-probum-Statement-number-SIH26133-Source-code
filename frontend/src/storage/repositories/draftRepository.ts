/**
 * Draft repository — local drafts (chat, booking form, notes).
 * LOCAL_ONLY + NEVER_SYNC; scoped to the authenticated user.
 */

import { db, isIdbAvailable } from '../db';
import type { Draft } from '../schema';

export async function saveDraft(draft: Draft): Promise<void> {
  if (!isIdbAvailable()) return;
  await db.drafts.put({
    ...draft,
    id: draft.id,
    updatedAt: new Date().toISOString(),
  });
}

export async function getDraft(ownerUserId: string, kind: string): Promise<Draft | null> {
  if (!isIdbAvailable()) return null;
  const rec = await db.drafts.where('ownerUserId').equals(ownerUserId).and((d) => d.kind === kind).first();
  return rec ?? null;
}

export async function getDraftById(id: string): Promise<Draft | null> {
  if (!isIdbAvailable()) return null;
  return (await db.drafts.get(id)) ?? null;
}

export async function deleteDraft(id: string): Promise<void> {
  if (!isIdbAvailable()) return;
  await db.drafts.delete(id);
}

export async function clearUserDrafts(ownerUserId: string): Promise<void> {
  if (!isIdbAvailable()) return;
  await db.drafts.where('ownerUserId').equals(ownerUserId).delete();
}
