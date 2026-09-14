/**
 * Logout / user-isolation cleanup.
 *
 * Clears the signed-out user's sensitive local data so User B on the same
 * device cannot access User A's encrypted chat or drafts. MongoDB is
 * untouched here — the server remains authoritative for auth + data.
 */

import { db, isIdbAvailable } from './db';
import { clearUserChatData } from './repositories/chatRepository';
import { clearUserDrafts } from './repositories/draftRepository';
import { clearUserPreferences } from './repositories/preferencesRepository';
import { clearUserCaches } from './repositories/cacheRepository';
import { clearLocalKeys } from './encryption/keyManager';
import { clearAllProtectedKeys } from './encryption/protectedKeyStore';

export async function clearLocalUserData(userId: string): Promise<void> {
  if (!isIdbAvailable()) return;

  // Scoped per-user data.
  await clearUserChatData(userId);
  await clearUserDrafts(userId);
  await clearUserPreferences(userId);
  await db.pendingBooking.where('ownerUserId').equals(userId).delete();

  // Remove user's private key material + protected key blobs.
  await clearLocalKeys(userId);

  // Sensitive caches are not user-scoped by rows but are cached copies; clear
  // them entirely on logout to avoid cross-user leakage of cached searches.
  await clearUserCaches();
  await clearAllProtectedKeys();
}

/**
 * Full local wipe (e.g. admin-managed reset). Removes all local device data.
 * Use with care — it does NOT alter MongoDB.
 */
export async function wipeLocalDatabase(): Promise<void> {
  if (!isIdbAvailable()) return;
  await db.delete();
}
