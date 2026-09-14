/**
 * Client-side key lifecycle.
 *
 *   Identity -> Key generation -> Key protection -> Message encryption
 *     -> IndexedDB encrypted storage -> Message decryption
 *
 * Private keys never leave the device. They are encrypted with a passphrase-
 * derived key before persistence and never stored in plain localStorage.
 *
 * Multi-device E2EE (Device A/B hoisting the same identity keys) is NOT
 * implemented yet; this module is where device-registration/provisioning would
 * plug in. Keys are per-device unless explicitly provisioned elsewhere.
 */

import { generateKeyPair, storePrivateKey, retrievePrivateKey, deletePrivateKey } from '../../api/e2ee';
import { seekProtectedKey, writeProtectedKey, removeProtectedKey } from './protectedKeyStore';
import type { EncryptedBlob } from './messageEncryption';

export interface LocalKeyRecord {
  keyId: string;
  ownerUserId: string;
  createdAt: string;
  /** Base64 SPKI public key — safe to share. */
  publicKeyBase64: string;
  fingerprint: string;
  /** What protects the private key (wire to passphrase-protected persistence). */
  protection: 'passphrase';
}

export interface KeyHandle {
  publicKeyBase64: string;
  fingerprint: string;
}

/**
 * Ensure the user has a local key pair. Loads existing (passphrase-protected)
 * key, or generates and persists a new one.
 */
export async function ensureLocalKeys(
  userId: string,
  passphrase: string,
): Promise<KeyHandle | null> {
  try {
    const existing = await retrievePrivateKey(`key-${userId}`, passphrase);
    if (existing) {
      const publicKeyBuffer = await crypto.subtle.exportKey('spki', existing);
      const publicKeyBase64 = bufferToBase64(publicKeyBuffer);
      const fingerprintBuffer = await crypto.subtle.digest('SHA-256', publicKeyBuffer);
      const fingerprint = bufferToHex(fingerprintBuffer);
      return { publicKeyBase64, fingerprint };
    }

    const pair = await generateKeyPair();
    await storePrivateKey(`key-${userId}`, pair.privateKey, passphrase);
    return { publicKeyBase64: pair.publicKeyBase64, fingerprint: pair.fingerprint };
  } catch {
    return null;
  }
}

/**
 * Store a random per-device value protecting the passphrase-derived storage key.
 * (Kept separate from ECDH private keys; see protectedKeyStore.)
 */
export async function saveProtectedEncryptionKey(
  ownerUserId: string,
  blob: EncryptedBlob,
): Promise<void> {
  await writeProtectedKey(ownerUserId, blob);
}

export async function loadProtectedEncryptionKey(
  ownerUserId: string,
): Promise<EncryptedBlob | null> {
  return seekProtectedKey(ownerUserId);
}

export async function clearLocalKeys(userId: string): Promise<void> {
  await deletePrivateKey(`key-${userId}`);
  await removeProtectedKey(userId);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
