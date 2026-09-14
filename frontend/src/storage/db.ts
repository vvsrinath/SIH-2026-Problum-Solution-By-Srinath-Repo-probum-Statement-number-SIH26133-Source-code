/**
 * IndexedDB database layer (Dexie).
 *
 * Database: swasthya_sathi_local
 *
 * Responsibilities (see docs/HYBRID_DATA_ARCHITECTURE.md):
 *   - Encrypted chat history (ciphertext at rest, never plaintext)
 *   - Local drafts
 *   - Read-only caches (facilities, providers, healthcare info)
 *   - PWA offline state
 *   - Pending booking state
 *   - UI preferences
 *   - Sync queue / offline actions
 *
 * MongoDB remains the authoritative server database for shared state.
 */

import Dexie, { type EntityTable } from 'dexie';
import {
  type CachedFacility,
  type CachedProvider,
  type Draft,
  type StoredPreference,
  type ChatMessageLocal,
  type ConversationLocal,
  type LocalMetadata,
  type PendingBooking,
} from './schema';

export type SyncItemStatus = 'pending' | 'processing' | 'failed' | 'done';

export interface SyncQueueItem {
  /** Client-generated idempotency key (unique per operation). */
  id: string;
  type: string;
  entity: string;
  entityId?: string;
  payload: unknown;
  createdAt: string;
  retryCount: number;
  status: SyncItemStatus;
  idempotencyKey: string;
  lastError?: string;
}

export interface OfflineAction {
  id: string;
  type: string;
  entity: string;
  entityId?: string;
  payload: unknown;
  createdAt: string;
  status: SyncItemStatus;
  idempotencyKey: string;
}

export interface CachedHealthcareData {
  id: string;
  category: string;
  title: string;
  body: unknown;
  ownerUserId?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  version: number;
}

class SwasthyaSathiLocalDB extends Dexie {
  chatMessages!: EntityTable<ChatMessageLocal, 'id'>;
  conversations!: EntityTable<ConversationLocal, 'id'>;
  drafts!: EntityTable<Draft, 'id'>;
  cachedFacilities!: EntityTable<CachedFacility, 'id'>;
  cachedProviders!: EntityTable<CachedProvider, 'id'>;
  cachedHealthcareData!: EntityTable<CachedHealthcareData, 'id'>;
  offlineActions!: EntityTable<OfflineAction, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;
  preferences!: EntityTable<StoredPreference, 'key'>;
  localMetadata!: EntityTable<LocalMetadata, 'key'>;
  pendingBooking!: EntityTable<PendingBooking, 'id'>;

  constructor() {
    super('swasthya_sathi_local');
    this.version(1).stores({
      chatMessages: 'id, conversationId, ownerUserId, timestamp, status',
      conversations: 'id, ownerUserId, peerUserId',
      drafts: 'id, ownerUserId, kind',
      cachedFacilities:
        'id, facilityId, name, type, region, updatedAt, expiresAt',
      cachedProviders: 'id, providerId, name, specialization, updatedAt, expiresAt',
      cachedHealthcareData: 'id, category, updatedAt, expiresAt',
      offlineActions: 'id, type, entity, status, createdAt',
      syncQueue: 'id, type, entity, status, createdAt, retryCount',
      preferences: 'key, ownerUserId',
      localMetadata: 'key, ownerUserId',
      pendingBooking: 'id, ownerUserId, doctorId',
    });
  }
}

export const db = new SwasthyaSathiLocalDB();

/** Best-effort availability flag (private-mode / quota may break access). */
export let idbAvailable = true;

export function setIdbAvailability(available: boolean) {
  idbAvailable = available;
}

export function isIdbAvailable(): boolean {
  return typeof indexedDB !== 'undefined' && idbAvailable;
}
