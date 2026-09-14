/**
 * Schema & classification for the hybrid data architecture.
 *
 * Every local data model has an explicit authority + sync classification.
 *
 * Rule (preserved throughout the codebase):
 *   MongoDB stores authoritative shared application state; IndexedDB stores
 *   local, offline-safe, cached and encrypted device data.
 */

export type Authority =
  | 'SERVER_AUTHORITATIVE' // MongoDB is the single source of truth
  | 'LOCAL_ONLY' // never leaves the device
  | 'CACHE' // read-only copy, refreshable from server
  | 'SYNCABLE' // authored locally, reconciled to server with policy
  | 'ENCRYPTED_LOCAL'; // local but always encrypted at rest

export type SyncPolicy =
  | 'NEVER_SYNC'
  | 'CACHE_REFRESH'
  | 'SERVER_SYNC'
  | 'SERVER_ONLY';

/** Manual, explicit classification of every persisted local model. */
export const DATA_CLASSIFICATION: Record<string, { authority: Authority; sync: SyncPolicy }> = {
  chatMessages: { authority: 'ENCRYPTED_LOCAL', sync: 'NEVER_SYNC' },
  conversations: { authority: 'ENCRYPTED_LOCAL', sync: 'NEVER_SYNC' },
  drafts: { authority: 'LOCAL_ONLY', sync: 'NEVER_SYNC' },
  cachedFacilities: { authority: 'CACHE', sync: 'CACHE_REFRESH' },
  cachedProviders: { authority: 'CACHE', sync: 'CACHE_REFRESH' },
  cachedHealthcareData: { authority: 'CACHE', sync: 'CACHE_REFRESH' },
  offlineActions: { authority: 'SYNCABLE', sync: 'SERVER_SYNC' },
  syncQueue: { authority: 'SYNCABLE', sync: 'SERVER_SYNC' },
  preferences: { authority: 'LOCAL_ONLY', sync: 'NEVER_SYNC' },
  localMetadata: { authority: 'LOCAL_ONLY', sync: 'NEVER_SYNC' },
  pendingBooking: { authority: 'LOCAL_ONLY', sync: 'NEVER_SYNC' },
};

export function getLocalClassification(store: string) {
  return DATA_CLASSIFICATION[store] ?? { authority: 'LOCAL_ONLY' as Authority, sync: 'NEVER_SYNC' as SyncPolicy };
}

// ---------------------------------------------------------------------------
// Entity types
// ---------------------------------------------------------------------------

export interface CachedEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  version: number;
}

export interface CachedFacility extends CachedEntity {
  facilityId: string;
  name: string;
  type: string;
  /** Minimum location information required for the UI (region/district). */
  region?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
}

export interface CachedProvider extends CachedEntity {
  providerId: string;
  name: string;
  specialization: string;
  facilityName?: string;
}

export interface Draft {
  id: string;
  ownerUserId: string;
  kind: string; // 'chat' | 'booking' | 'note'
  payload: unknown;
  updatedAt: string;
  createdAt: string;
}

export interface StoredPreference {
  key: string;
  ownerUserId: string;
  value: unknown;
  updatedAt: string;
}

export interface ChatMessageLocal {
  id: string;
  ownerUserId: string;
  conversationId: string;
  senderId: string;
  ciphertext: string;
  iv: string;
  protocolVersion: string;
  timestamp: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  localId: string;
}

export interface ConversationLocal {
  id: string;
  ownerUserId: string;
  peerUserId: string;
  peerRole?: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface LocalMetadata {
  key: string;
  ownerUserId: string;
  value: unknown;
  updatedAt: string;
}

export interface PendingBooking {
  id: string;
  ownerUserId: string;
  doctorId: string;
  scheduledAt: string;
  consultationType: string;
  reason: string;
  createdAt: string;
}
