# Hybrid Data Architecture

Swasthya Sathi uses a **hybrid data architecture**: MongoDB remains the
authoritative source of truth for all shared/across-device data, while
IndexedDB (via Dexie) stores local, offline, cached, and encrypted device-only
data. The two layers work together to provide an offline-first experience
without sacrificing server-side authority or consistency.

This document defines responsibilities, source-of-truth rules, offline/sync
behavior, conflict resolution, security, and the operational guarantees of the
hybrid layer.

---

## 1. Why hybrid?

- **Offline resilience** — patients in low-connectivity regions can still draft
  bookings, referrals, consent and chat messages; actions are queued and synced
  when the backend is reachable.
- **Fast local reads** — cached facilities/providers load instantly instead of
  waiting on the network.
- **Privacy** — chat and curated local data are encrypted at rest on the device
  (AES-GCM-256) and never leave the device as plaintext.
- **Multi-device consistency** — every authoritative write still goes through
  MongoDB, so the server is the single source of truth across devices.

---

## 2. Source-of-truth rules

| Data | Authoritative store | Local store | Sync policy |
|------|--------------------|-------------|-------------|
| User accounts / auth | MongoDB | n/a | SERVER_ONLY |
| Appointments | MongoDB | pending bookings (draft) | SERVER_SYNC |
| Referrals | MongoDB | offline actions | SERVER_SYNC |
| Consent records | MongoDB | offline actions | SERVER_SYNC |
| Facilities / providers catalog | MongoDB | cache w/ TTL | CACHE_REFRESH |
| Chat (E2EE) | MongoDB (ciphertext relay) | encrypted local history | NEVER_SYNC (history) |
| Form drafts | n/a | local | NEVER_SYNC |
| Preferences | local | local | NEVER_SYNC |
| Sync state / watermarks | MongoDB (`SyncState`) | local | SERVER_SYNC |

Rules:

- **MongoDB wins for shared state.** A facility's current availability, an
  appointment's status, a consent grant — all resolved from the server.
- **Local cache is never authoritative.** `cachedFacilities`/`cachedProviders`
  are TTL-guarded (default 15 min) and flagged stale; the UI must indicate
  stale data and fall back to a fresh fetch when reachable.
- **Preference fallback (SCP-77 failover):** if the server preference service
  is unavailable, the device preference (`preferences` store) is used as a
  local fallback. Server remains preferred when reachable.

---

## 3. Stores (Dexie `swasthya_sathi_local`, v1)

| Store | Purpose | At-rest |
|-------|---------|---------|
| `chatMessages` | Peer chat history | Encrypted |
| `conversations` | Conversation metadata | Encrypted/IDs |
| `drafts` | In-progress forms / chat | Encrypted/plain JSON |
| `cachedFacilities` | Facility catalog cache | Plain (non-sensitive) |
| `cachedProviders` | Provider catalog cache | Plain (non-sensitive) |
| `cachedHealthcareData` | Misc data incl. protected keys | Encrypted keys |
| `offlineActions` | Outbound ops awaiting sync | Plain metadata |
| `syncQueue` | Sync-queue state machine | Plain metadata |
| `preferences` | User preferences | Plain |
| `localMetadata` | Schema/version bookkeeping | Plain |
| `pendingBooking` | In-progress booking draft | Encrypted/plain |

Each row carries an `ownerUserId` so multiple users on one device stay
isolated.

---

## 4. Offline-first flow

1. App boots → `initHybridStorage()` records the schema version and starts the
   sync manager.
2. `useOfflineStatus` combines `navigator.onLine` **and backend reachability**
   (`GET /health`), because the device being "online" does not mean the SPA
   backend is reachable.
3. When a user performs a server-owned mutation while offline, the action is
   written to `syncQueue`/`offlineActions` with an idempotency key.
4. On reconnect, the sync manager flushes: each queued mutation is sent to its
   domain endpoint with the `Idempotency-Key` header, backed by the backend
   idempotency middleware.
5. Reads fall back to local cache when offline, clearly flagged as stale.

---

## 5. Idempotency & deduplication

Every queued operation has a unique `idempotencyKey` (its local id). This is
the single-most important safety property:

- The **backend** `idempotent()` middleware records every in-flight/processed
  request in the `Idempotency` collection (24h TTL). A replayed key returns the
  stored response instead of duplicating the mutation.
- The **frontend** never blindly re-sends without knowing the outcome.

This means a flaky reconnect cannot double-book an appointment or double-grant
consent.

---

## 6. Sync queue behavior

- `enqueue()` writes to `syncQueue` and `offlineActions` together.
- `flushSyncQueue()` drains `pending` items only when the backend is reachable.
- Statuses: `pending → processing → done | failed`.
- Failures: transient errors return to `pending` (retry on next flush).
  Non-retryable server responses (`400/409/422`) are marked `failed`
  permanently and surfaced to the user.
- Per-item max 5 retries before `failed`.
- Periodic flush every 30s as a safety net; also flushed immediately on
  reconnect/online.

---

## 7. Conflict resolution

`conflictResolver.ts` provides modes:

| Mode | Winner |
|------|--------|
| `SERVER_WINS` | Server copy (default for shared state) |
| `CLIENT_WINS` | Local copy |
| `MERGE` | Merge by field strategy |
| `LATEST_WINS` | Newest `updatedAt` |

Default for appointments/shared state is `SERVER_WINS`. Timestamped subfields
use `LATEST_WINS`. Pick a mode per entity type; do not mix silently.

---

## 8. End-to-end encryption (E2EE)

- Key pairs derived/generated with the existing `api/e2ee.ts` primitives
  (ECDH P-256 + AES-GCM, PBKDF2 passphrase).
- `keyManager.ensureLocalKeys()` reuses the existing key store; private keys
  are additionally protected by a passphrase-derived AES key before
  persistence.
- `protectedKeyStore` stores protected key blobs in `cachedHealthcareData`
  (`ownerUserId`-scoped).
- Chat rows (`chatMessages`) hold **ciphertext only**; decryption happens at
  display time. Plaintext is never written to IndexedDB.
- **Multi-device E2EE is explicitly out of scope** in this release (see
  `keyManager.ts`).

---

## 9. Offline chat

- Pending outgoing messages are stored encrypted with
  `status: 'pending'`/`delivered: false`.
- On reconnect the pending relay is delivered and delivery state updated.
- History remains available locally (encrypted) even when fully offline.

---

## 10. Appointment consistency

- Online: `POST /api/v1/appointments` (with `idempotent()` middleware) returns
  the authoritative result; `SlotLock` holds the slot.
- Offline: the booking is drafted in `pendingBooking`, queued, and submitted on
  reconnect with SlotLock re-validated **server-side at submission time**. The
  user is told the booking is "pending sync" and is not shown as confirmed until
  the server confirms it.

---

## 11. Auth & user isolation

- A user's local data (`chatMessages`, `drafts`, `preferences`, `pendingBooking`)
  is `ownerUserId`-scoped.
- Cached catalog data is not row-scoped but is cleared on logout.
- On logout, `clearLocalUserData(userId)` removes the user's scoped rows,
  private key material, and cached searches — so User B cannot see User A's
  encrypted history on a shared device.
- MongoDB is **not** touched on logout here; server remains authoritative.

---

## 12. Diagnostics & observability

`storage/diagnostics.ts` exposes `collectAppDiagnostics()`:
- storage availability, schema version, per-store counts, storage usage (MB)
- network online/backend state
- sync queue stats

No data contents are exposed — only counts and state.

---

## 13. Security

- No secrets hardcoded; keys live in Web Crypto, never plain storage.
- Chat ciphertext at rest; decryption only on display.
- Idempotency keys prevent duplicate side effects.
- Activity still logged via `audit.service.ts` `recordAudit` on the server.

---

## 14. Failure handling

- IndexedDB unavailable → graceful fallback (`isIdbAvailable()` false): app
  functions online-only, no data loss in MongoDB.
- Backend unreachable → mutations queue locally; no data is lost and no
  duplicate side effects occur thanks to idempotency.
- Cache expired → UI flags stale, initiates fresh server fetch.

---

## 15. Testing

- Frontend: Vitest + `fake-indexeddb` for
  `db` creation/migration/CRUD, sync queue/retry/idempotency/conflict,
  chat encryption/decryption/offline/user-isolation, logout cleanup.
- Backend: `Idempotency` and `SyncState` model tests; `POST /api/v1/sync/actions`
  and `GET /api/v1/sync/state` integration tests against the test Mongo
  (`TEST_MONGODB_URI`).

---

## 16. Key file map

```
frontend/src/storage/
  schema.ts           entity types + SYNC/AUTHORITY policy enums
  db.ts               Dexie class + stores + availability guard
  migrations.ts       schema version bookkeeping
  encryption/         crypto, message encryption, key manager, protected keys
  repositories/       chat, cache, draft, preferences, sync queue
  sync/               connectivity, conflict resolver, sync queue, sync manager
  cleanup.ts          per-user logout cleanup + full wipe
  diagnostics.ts      safe observability
  index.ts            bootstrap (initHybridStorage) + public surface
frontend/src/hooks/
  useOfflineStatus.ts combined device+backend reachability
  useLocalChat.ts     encrypted local chat access
  useDraft.ts         local drafts
  useCachedFacilities.ts cached catalog w/ TTL
  useSyncStatus.ts    queue + connectivity status
backend/src/
  middleware/idempotency.ts
  database/models/Idempotency.ts
  database/models/SyncState.ts
  modules/sync/       sync.schema / controller / routes
```
