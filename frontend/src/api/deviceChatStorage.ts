/**
 * Device Chat Storage — IndexedDB encrypted local storage
 *
 * Stores E2EE messages locally for offline access.
 * Messages remain encrypted at rest — decryption only happens on display.
 *
 * Stores:
 *   - encrypted-messages: ciphertext blobs indexed by conversationId
 *   - pending-outbound: messages queued for sending when online
 *   - sync-state: last sync timestamp per conversation
 */

const DB_NAME = 'swasthya-sathi-chat';
const DB_VERSION = 1;

const STORES = {
  MESSAGES: 'encrypted-messages',
  PENDING: 'pending-outbound',
  SYNC: 'sync-state',
} as const;

// ---------------------------------------------------------------------------
// Message types
// ---------------------------------------------------------------------------

export interface StoredMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  ciphertext: string;   // encrypted content (never plaintext at rest)
  iv: string;
  timestamp: string;
  protocolVersion: string;
  status: 'pending' | 'sent' | 'delivered' | 'read';
  createdAt: string;
}

export interface PendingOutbound {
  id: string;
  conversationId: string;
  ciphertext: string;
  iv: string;
  messageId: string;
  createdAt: string;
  retryCount: number;
}

export interface SyncState {
  conversationId: string;
  lastSyncAt: string;
  lastMessageId: string;
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        const msgStore = db.createObjectStore(STORES.MESSAGES, { keyPath: 'messageId' });
        msgStore.createIndex('conversationId', 'conversationId', { unique: false });
        msgStore.createIndex('conversationId_timestamp', ['conversationId', 'timestamp']);
      }
      if (!db.objectStoreNames.contains(STORES.PENDING)) {
        db.createObjectStore(STORES.PENDING, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SYNC)) {
        db.createObjectStore(STORES.SYNC, { keyPath: 'conversationId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ---------------------------------------------------------------------------
// Message operations
// ---------------------------------------------------------------------------

/**
 * Store an encrypted message locally.
 */
export async function storeMessage(message: StoredMessage): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORES.MESSAGES, 'readwrite');
  tx.objectStore(STORES.MESSAGES).put(message);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get messages for a conversation (decryption happens on display).
 */
export async function getMessages(
  conversationId: string,
  limit = 50,
  before?: string,
): Promise<StoredMessage[]> {
  const db = await openDB();
  const tx = db.transaction(STORES.MESSAGES, 'readonly');
  const store = tx.objectStore(STORES.MESSAGES);
  const index = store.index('conversationId_timestamp');

  const range = before
    ? IDBKeyRange.upperBound([conversationId, before], true)
    : IDBKeyRange.upperBound([conversationId, '\uffff']);

  return new Promise((resolve) => {
    const messages: StoredMessage[] = [];
    const request = index.openCursor(range, 'prev');
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor && messages.length < limit) {
        messages.push(cursor.value as StoredMessage);
        cursor.continue();
      } else {
        resolve(messages.reverse());
      }
    };
    request.onerror = () => resolve([]);
  });
}

/**
 * Get unread message count for a conversation.
 */
export async function getUnreadCount(conversationId: string, userId: string): Promise<number> {
  const messages = await getMessages(conversationId, 1000);
  return messages.filter((m) => m.senderId !== userId && m.status !== 'read').length;
}

/**
 * Update message status (sent → delivered → read).
 */
export async function updateMessageStatus(
  messageId: string,
  status: StoredMessage['status'],
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORES.MESSAGES, 'readwrite');
  const store = tx.objectStore(STORES.MESSAGES);
  const getReq = store.get(messageId);
  getReq.onsuccess = () => {
    const msg = getReq.result as StoredMessage | undefined;
    if (msg) {
      msg.status = status;
      store.put(msg);
    }
  };
}

// ---------------------------------------------------------------------------
// Pending outbound queue
// ---------------------------------------------------------------------------

/**
 * Queue a message for sending when online.
 */
export async function queueOutbound(message: PendingOutbound): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORES.PENDING, 'readwrite');
  tx.objectStore(STORES.PENDING).put(message);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get all pending outbound messages.
 */
export async function getPendingOutbound(): Promise<PendingOutbound[]> {
  const db = await openDB();
  const tx = db.transaction(STORES.PENDING, 'readonly');
  return new Promise((resolve) => {
    const request = tx.objectStore(STORES.PENDING).getAll();
    request.onsuccess = () => resolve(request.result as PendingOutbound[]);
    request.onerror = () => resolve([]);
  });
}

/**
 * Remove a pending outbound message (after successful send).
 */
export async function removePendingOutbound(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORES.PENDING, 'readwrite');
  tx.objectStore(STORES.PENDING).delete(id);
}

// ---------------------------------------------------------------------------
// Sync state
// ---------------------------------------------------------------------------

/**
 * Get last sync time for a conversation.
 */
export async function getLastSyncTime(conversationId: string): Promise<string | null> {
  const db = await openDB();
  const tx = db.transaction(STORES.SYNC, 'readonly');
  return new Promise((resolve) => {
    const request = tx.objectStore(STORES.SYNC).get(conversationId);
    request.onsuccess = () => {
      const state = request.result as SyncState | undefined;
      resolve(state?.lastSyncAt || null);
    };
    request.onerror = () => resolve(null);
  });
}

/**
 * Update sync state for a conversation.
 */
export async function updateSyncState(state: SyncState): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORES.SYNC, 'readwrite');
  tx.objectStore(STORES.SYNC).put(state);
}

/**
 * Clear all local chat data (on logout or key revocation).
 */
export async function clearAllChatData(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([STORES.MESSAGES, STORES.PENDING, STORES.SYNC], 'readwrite');
  tx.objectStore(STORES.MESSAGES).clear();
  tx.objectStore(STORES.PENDING).clear();
  tx.objectStore(STORES.SYNC).clear();
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
