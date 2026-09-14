import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { connectTestDb, resetCollections } from './setup';
import { Idempotency } from '../src/database/models/Idempotency';
import { SyncState } from '../src/database/models/SyncState';
import { recordEntitySync } from '../src/modules/sync/sync.controller';

const USER_ID = 'test-hybrid-001';

beforeAll(async () => {
  await connectTestDb();
});

beforeEach(async () => {
  await resetCollections(['idempotencies', 'syncstates']);
});

describe('Idempotency model (dedupe + replay protection)', () => {
  it('rejects duplicate idempotency keys (unique index)', async () => {
    const doc = {
      idempotencyKey: 'op-abc-123',
      userId: USER_ID,
      method: 'POST',
      path: '/api/v1/appointments',
      requestHash: 'hash-1',
      statusCode: 201,
      responseBody: { bookingRef: 'B-1' },
    };
    await Idempotency.create(doc);

    await expect(Idempotency.create({ ...doc, idempotencyKey: 'op-abc-123' })).rejects.toThrow();
  });

  it('stores and retrieves a result for replay', async () => {
    const created = await Idempotency.create({
      idempotencyKey: 'op-key-456',
      userId: USER_ID,
      method: 'POST',
      path: '/api/v1/sync/actions',
      requestHash: 'hash-456',
      statusCode: 200,
      responseBody: { ok: true },
    });

    const found = await Idempotency.findOne({ idempotencyKey: 'op-key-456' }).lean();
    expect(found).toBeDefined();
    expect(found!.userId).toBe(USER_ID);
    expect(found!.statusCode).toBe(200);
    expect((found!.responseBody as any).ok).toBe(true);
    expect(created.idempotencyKey).toBe('op-key-456');
  });

  it('keys are unique per user request hash', async () => {
    await Idempotency.create({
      idempotencyKey: 'op-unique-1',
      userId: USER_ID,
      method: 'GET',
      path: '/api/v1/sync/state',
      requestHash: 'hash-x',
      statusCode: 200,
      responseBody: {},
    });
    const count = await Idempotency.countDocuments({ userId: USER_ID });
    expect(count).toBe(1);
  });
});

describe('SyncState model & recordEntitySync (watermarks)', () => {
  it('creates a watermark for a new entity', async () => {
    await recordEntitySync(USER_ID, 'appointments', 5);

    const state = await SyncState.findOne({ userId: USER_ID, entity: 'appointments' }).lean();
    expect(state).toBeDefined();
    expect(state!.lastSyncCount).toBe(5);
    expect(state!.lastSyncedAt).toBeInstanceOf(Date);
  });

  it('upserts (updates) an existing watermark instead of duplicating', async () => {
    await recordEntitySync(USER_ID, 'appointments', 5);
    await recordEntitySync(USER_ID, 'appointments', 12);

    const docs = await SyncState.find({ userId: USER_ID, entity: 'appointments' });
    expect(docs).toHaveLength(1);
    expect(docs[0].lastSyncCount).toBe(12);
  });

  it('keeps per-user, per-entity isolation', async () => {
    await recordEntitySync('user-a', 'appointments', 2);
    await recordEntitySync('user-b', 'appointments', 9);

    const a = await SyncState.findOne({ userId: 'user-a', entity: 'appointments' }).lean();
    const b = await SyncState.findOne({ userId: 'user-b', entity: 'appointments' }).lean();
    expect(a!.lastSyncCount).toBe(2);
    expect(b!.lastSyncCount).toBe(9);
  });
});
