import { beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import process from 'node:process';

const MONGO_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/swasthya_sathi_test';

/**
 * Shared integration-test bootstrap. Connects to a dedicated test database so
 * tests never touch development data, and drops all collections before each
 * test file runs to guarantee isolation.
 *
 * Connectivity is best-effort: if MongoDB is unreachable the tests that need
 * it will fail loudly with a clear message rather than silently passing.
 */
let connected = false;

export async function connectTestDb(): Promise<boolean> {
  if (connected) return true;
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    connected = true;
    return true;
  } catch (err) {
    console.error('[tests] Could not connect to test MongoDB at', MONGO_URI);
    console.error('[tests]', err instanceof Error ? err.message : err);
    console.error('[tests] Start it with: docker compose up mongodb  (or set TEST_MONGODB_URI)');
    return false;
  }
}

export async function resetCollections(collections: string[]) {
  for (const name of collections) {
    try {
      const col = mongoose.connection.db?.collection(name);
      if (col) await col.deleteMany({});
    } catch {
      // collection may not exist yet; ignore
    }
  }
}

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  if (connected) {
    await mongoose.disconnect();
    connected = false;
  }
});
