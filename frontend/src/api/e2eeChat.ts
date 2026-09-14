/**
 * E2EE Chat Integration — Swasthya Sathi
 *
 * Connects the crypto primitives (e2ee.ts) with the Socket.IO messaging flow.
 * Handles key generation on registration, key exchange, and message encrypt/decrypt.
 *
 * Flow:
 *   1. User registers → generateKeyPair() → register public key with server
 *   2. Join conversation → fetch peer public keys → derive shared keys
 *   3. Send message → encrypt(plaintext, sharedKey) → emit ciphertext via Socket.IO
 *   4. Receive message → decrypt(ciphertext, sharedKey) → display plaintext
 */

import {
  generateKeyPair,
  importPublicKey,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
  storePrivateKey,
  retrievePrivateKey,
  deletePrivateKey,
  type KeyPair,
  type EncryptedPayload,
} from './e2ee';
import {
  storeMessage,
  getMessages,
  updateMessageStatus,
  queueOutbound,
  clearAllChatData,
  type StoredMessage,
} from './deviceChatStorage';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// ---------------------------------------------------------------------------
// Key Management
// ---------------------------------------------------------------------------

let currentKeyPair: KeyPair | null = null;
const sharedKeys = new Map<string, CryptoKey>(); // peerUserId → sharedKey

/**
 * Initialize E2EE for the current user.
 * Called after login — loads or generates key pair.
 */
export async function initializeE2EE(
  userId: string,
  passphrase: string,
): Promise<{ publicKey: string; fingerprint: string } | null> {
  try {
    // Try to load existing private key from IndexedDB
    const existingKey = await retrievePrivateKey(`key-${userId}`, passphrase);

    if (existingKey) {
      // Export public key for registration
      const publicKeyBuffer = await crypto.subtle.exportKey('spki', existingKey);
      const publicKeyBase64 = bufferToBase64(publicKeyBuffer);
      const fingerprintBuffer = await crypto.subtle.digest('SHA-256', publicKeyBuffer);
      const fingerprint = bufferToHex(fingerprintBuffer);

      currentKeyPair = {
        publicKey: existingKey,
        privateKey: existingKey, // Same key for ECDH
        publicKeyBase64,
        fingerprint,
      };

      return { publicKey: publicKeyBase64, fingerprint };
    }

    // Generate new key pair
    const keyPair = await generateKeyPair();
    currentKeyPair = keyPair;

    // Store private key encrypted with passphrase
    await storePrivateKey(`key-${userId}`, keyPair.privateKey, passphrase);

    // Register public key with server
    await registerPublicKey(userId, keyPair.publicKeyBase64, keyPair.fingerprint);

    return { publicKey: keyPair.publicKeyBase64, fingerprint: keyPair.fingerprint };
  } catch (err) {
    console.error('E2EE initialization failed:', err);
    return null;
  }
}

/**
 * Register public key with the server.
 */
async function registerPublicKey(_userId: string, publicKey: string, fingerprint: string) {
  const res = await fetch(`${API_BASE}/api/v1/admin/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ publicKey, fingerprint, algorithm: 'ECDH-P256' }),
  });
  if (!res.ok) throw new Error('Failed to register public key');
}

/**
 * Get a peer's public key from the server and derive shared key.
 */
async function getSharedKeyForPeer(peerUserId: string): Promise<CryptoKey | null> {
  if (sharedKeys.has(peerUserId)) return sharedKeys.get(peerUserId)!;
  if (!currentKeyPair) return null;

  try {
    const res = await fetch(`${API_BASE}/api/v1/admin/keys/${peerUserId}`, {
      credentials: 'include',
    });
    if (!res.ok) return null;

    const data = await res.json() as { publicKey: string };
    const peerPublicKey = await importPublicKey(data.publicKey);
    const sharedKey = await deriveSharedKey(currentKeyPair.privateKey, peerPublicKey);
    sharedKeys.set(peerUserId, sharedKey);
    return sharedKey;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Message Encryption / Decryption
// ---------------------------------------------------------------------------

/**
 * Encrypt and send a message.
 */
export async function sendEncryptedMessage(
  conversationId: string,
  peerUserId: string,
  plaintext: string,
  messageId: string,
): Promise<boolean> {
  const sharedKey = await getSharedKeyForPeer(peerUserId);
  if (!sharedKey) {
    // Queue for later if peer key not available
    await queueOutbound({
      id: `pending-${messageId}`,
      conversationId,
      ciphertext: plaintext, // Will be encrypted when peer comes online
      iv: '',
      messageId,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    });
    return false;
  }

  const encrypted = await encryptMessage(plaintext, sharedKey);

  // Store encrypted message locally
  await storeMessage({
    messageId,
    conversationId,
    senderId: 'self',
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    timestamp: new Date().toISOString(),
    protocolVersion: encrypted.version,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  return true;
}

/**
 * Decrypt a received message.
 */
export async function receiveEncryptedMessage(
  message: {
    messageId: string;
    conversationId: string;
    senderId: string;
    ciphertext: string;
    iv: string;
    timestamp: string;
    protocolVersion: string;
  },
): Promise<string | null> {
  const sharedKey = await getSharedKeyForPeer(message.senderId);
  if (!sharedKey) return null;

  try {
    const payload: EncryptedPayload = {
      ciphertext: message.ciphertext,
      iv: message.iv,
      version: message.protocolVersion,
    };
    const plaintext = await decryptMessage(payload, sharedKey);

    // Store decrypted message locally
    await storeMessage({
      messageId: message.messageId,
      conversationId: message.conversationId,
      senderId: message.senderId,
      ciphertext: message.ciphertext,
      iv: message.iv,
      timestamp: message.timestamp,
      protocolVersion: message.protocolVersion,
      status: 'delivered',
      createdAt: new Date().toISOString(),
    });

    return plaintext;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Conversation History
// ---------------------------------------------------------------------------

/**
 * Get conversation history (from local IndexedDB, not server).
 */
export async function getConversationHistory(
  conversationId: string,
  limit?: number,
): Promise<StoredMessage[]> {
  return getMessages(conversationId, limit);
}

/**
 * Mark messages as read.
 */
export async function markMessagesRead(
  _conversationId: string,
  messageIds: string[],
): Promise<void> {
  for (const id of messageIds) {
    await updateMessageStatus(id, 'read');
  }
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

/**
 * Clear all E2EE data (on logout or key revocation).
 */
export async function clearE2EEData(userId: string): Promise<void> {
  currentKeyPair = null;
  sharedKeys.clear();
  await deletePrivateKey(`key-${userId}`);
  await clearAllChatData();
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
