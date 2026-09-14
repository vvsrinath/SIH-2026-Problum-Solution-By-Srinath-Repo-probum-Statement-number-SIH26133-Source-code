/**
 * Protected key store — keeps per-user encryption-key blobs in IndexedDB,
 * scoped by ownerUserId. Blobs are already encrypted (AES-GCM) before storage.
 * Keyed so User B on the same device cannot access User A's material.
 */

import { db } from '../db';
import { isIdbAvailable } from '../db';
import type { EncryptedBlob } from './messageEncryption';

const store = () => db.cachedHealthcareData;

export async function writeProtectedKey(ownerUserId: string, blob: EncryptedBlob): Promise<void> {
  if (!isIdbAvailable()) return;
  const id = `protected-key-${ownerUserId}`;
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
  await store().put({
    id,
    category: 'protected-key',
    title: '',
    body: blob,
    ownerUserId,
    createdAt: now,
    updatedAt: now,
    expiresAt: expires,
    version: 1,
  });
}

export async function seekProtectedKey(ownerUserId: string): Promise<EncryptedBlob | null> {
  if (!isIdbAvailable()) return null;
  const rec = await store().get(`protected-key-${ownerUserId}`);
  return rec ? (rec.body as EncryptedBlob) : null;
}

export async function removeProtectedKey(ownerUserId: string): Promise<void> {
  if (!isIdbAvailable()) return;
  await store().delete(`protected-key-${ownerUserId}`);
}

/** Clear all protected keys for every user (full local wipe on demand). */
export async function clearAllProtectedKeys(): Promise<void> {
  if (!isIdbAvailable()) return;
  await store().where('category').equals('protected-key').delete();
}
