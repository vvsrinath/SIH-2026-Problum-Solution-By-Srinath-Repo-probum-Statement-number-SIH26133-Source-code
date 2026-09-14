/**
 * Message encryption / decryption for local encrypted storage.
 *
 * Content is encrypted with AES-GCM before it touches IndexedDB. The server
 * (and any chat relay) only ever observes ciphertext — never plaintext.
 */

import {
  bufferToBase64,
  base64ToBuffer,
  toBase64url,
  fromBase64url,
  randomId,
} from './crypto';

const AES = { name: 'AES-GCM', length: 256 } as const;

export interface EncryptedBlob {
  ciphertext: string; // base64
  iv: string; // base64
  algorithm: 'AES-GCM-256';
  version: string;
}

export async function encryptWithKey(plaintext: string, key: CryptoKey): Promise<EncryptedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv),
    algorithm: 'AES-GCM-256',
    version: '1.0',
  };
}

export async function decryptWithKey(blob: EncryptedBlob, key: CryptoKey): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(base64ToBuffer(blob.iv)) },
    key,
    base64ToBuffer(blob.ciphertext),
  );
  return new TextDecoder().decode(decrypted);
}

/**
 * Derive a per-user local storage key from a passphrase (PBKDF2).
 * The private key is additionally protected with this before persistence,
 * and encrypted IndexedDB rows are protected with device/user keys.
 */
export async function deriveStorageKey(
  passphrase: string,
  saltInput: string,
): Promise<CryptoKey> {
  const salt = new TextEncoder().encode(saltInput);
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    AES,
    false,
    ['encrypt', 'decrypt'],
  );
}

export { randomId, toBase64url, fromBase64url };
