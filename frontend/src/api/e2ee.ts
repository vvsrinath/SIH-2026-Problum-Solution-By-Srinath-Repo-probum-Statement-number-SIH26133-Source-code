/**
 * E2EE Client-side Encryption — Swasthya Sathi
 *
 * Uses Web Crypto API (SubtleCrypto) for browser-native encryption.
 * Algorithm: ECDH P-256 key agreement + AES-GCM symmetric encryption.
 *
 * Trust model:
 *   - Private key never leaves the device
 *   - Server only stores public keys (see keyManagement.service.ts)
 *   - Messages encrypted client-side before Socket.IO relay
 *   - Server sees ONLY ciphertext blobs
 */

const ALGORITHM = {
  name: 'ECDH',
  namedCurve: 'P-256',
} as const;

const SYMMETRIC_ALGORITHM = {
  name: 'AES-GCM',
  length: 256,
} as const;

// ---------------------------------------------------------------------------
// Key Generation
// ---------------------------------------------------------------------------

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicKeyBase64: string;
  fingerprint: string;
}

/**
 * Generate a new ECDH key pair for E2EE.
 * Returns public key (shareable) and private key (device-only).
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(ALGORITHM, true, ['deriveKey', 'deriveBits']);

  // Export public key for sharing
  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const publicKeyBase64 = bufferToBase64(publicKeyBuffer);

  // Generate fingerprint
  const fingerprintBuffer = await crypto.subtle.digest('SHA-256', publicKeyBuffer);
  const fingerprint = bufferToHex(fingerprintBuffer);

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    publicKeyBase64,
    fingerprint,
  };
}

// ---------------------------------------------------------------------------
// Key Exchange
// ---------------------------------------------------------------------------

/**
 * Import a public key from base64 (received from server/peer).
 */
export async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  const buffer = base64ToBuffer(publicKeyBase64);
  return crypto.subtle.importKey('spki', buffer, ALGORITHM, true, []);
}

/**
 * Derive a shared AES key from our private key + peer's public key.
 */
export async function deriveSharedKey(
  privateKey: CryptoKey,
  peerPublicKey: CryptoKey,
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: peerPublicKey },
    privateKey,
    SYMMETRIC_ALGORITHM,
    false,
    ['encrypt', 'decrypt'],
  );
}

// ---------------------------------------------------------------------------
// Encryption / Decryption
// ---------------------------------------------------------------------------

export interface EncryptedPayload {
  ciphertext: string;  // base64
  iv: string;          // base64 (initialization vector)
  version: string;     // protocol version
}

/**
 * Encrypt a message for a specific peer.
 */
export async function encryptMessage(
  plaintext: string,
  sharedKey: CryptoKey,
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    encoded,
  );

  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv),
    version: '1.0',
  };
}

/**
 * Decrypt a message from a peer.
 */
export async function decryptMessage(
  payload: EncryptedPayload,
  sharedKey: CryptoKey,
): Promise<string> {
  const ciphertext = base64ToBuffer(payload.ciphertext);
  const iv = base64ToBuffer(payload.iv);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    sharedKey,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}

// ---------------------------------------------------------------------------
// Key Storage (IndexedDB)
// ---------------------------------------------------------------------------

const KEY_STORE = 'encryption-keys';
const DB_NAME = 'swasthya-sathi-keys';

/**
 * Store private key in IndexedDB (encrypted with user passphrase).
 */
export async function storePrivateKey(
  keyId: string,
  privateKey: CryptoKey,
  passphrase: string,
): Promise<void> {
  // Export private key
  const raw = await crypto.subtle.exportKey('pkcs8', privateKey);
  const base64 = bufferToBase64(raw);

  // Encrypt with passphrase-derived key
  const passphraseKey = await derivePassphraseKey(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    passphraseKey,
    new TextEncoder().encode(base64),
  );

  // Store in IndexedDB
  const db = await openDB();
  const tx = db.transaction(KEY_STORE, 'readwrite');
  tx.objectStore(KEY_STORE).put({
    keyId,
    encryptedPrivateKey: bufferToBase64(encrypted),
    iv: bufferToBase64(iv),
    storedAt: new Date().toISOString(),
  });
  await transactionDone(tx);
}

/**
 * Retrieve private key from IndexedDB (decrypted with user passphrase).
 */
export async function retrievePrivateKey(
  keyId: string,
  passphrase: string,
): Promise<CryptoKey | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(KEY_STORE, 'readonly');
    const record = await awaitRequest(tx.objectStore(KEY_STORE).get(keyId));
    if (!record) return null;

    const passphraseKey = await derivePassphraseKey(passphrase);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(base64ToBuffer(record.iv)) },
      passphraseKey,
      base64ToBuffer(record.encryptedPrivateKey),
    );

    const privateKeyBase64 = new TextDecoder().decode(decrypted);
    return crypto.subtle.importKey(
      'pkcs8',
      base64ToBuffer(privateKeyBase64),
      ALGORITHM,
      false,
      ['deriveKey', 'deriveBits'],
    );
  } catch {
    return null; // Wrong passphrase or corrupted data
  }
}

/**
 * Delete private key from IndexedDB (on logout/key revocation).
 */
export async function deletePrivateKey(keyId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(KEY_STORE, 'readwrite');
  tx.objectStore(KEY_STORE).delete(keyId);
  await transactionDone(tx);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function derivePassphraseKey(passphrase: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('swasthya-sathi-e2ee-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    SYMMETRIC_ALGORITHM,
    false,
    ['encrypt', 'decrypt'],
  );
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Simple IndexedDB wrapper
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(KEY_STORE, { keyPath: 'keyId' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function awaitRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
