/**
 * Preferences repository — local UI preferences.
 * LOCAL_ONLY + NEVER_SYNC; scoped to the authenticated user.
 */

import { db, isIdbAvailable } from '../db';
import type { StoredPreference } from '../schema';

export async function setPreference(key: string, ownerUserId: string, value: unknown): Promise<void> {
  if (!isIdbAvailable()) return;
  const existing = await db.preferences.get(key);
  const next: StoredPreference = {
    key,
    ownerUserId,
    value,
    updatedAt: new Date().toISOString(),
  };
  if (existing) {
    await db.preferences.update(key, { value, ownerUserId, updatedAt: next.updatedAt });
  } else {
    await db.preferences.add(next);
  }
}

export async function getPreference(key: string): Promise<StoredPreference | null> {
  if (!isIdbAvailable()) return null;
  return (await db.preferences.get(key)) ?? null;
}

export async function clearUserPreferences(ownerUserId: string): Promise<void> {
  if (!isIdbAvailable()) return;
  await db.preferences.where('ownerUserId').equals(ownerUserId).delete();
}
