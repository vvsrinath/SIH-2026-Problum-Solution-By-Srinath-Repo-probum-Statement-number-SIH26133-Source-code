/**
 * Test setup — provides IndexedDB (fake-indexeddb) and Web Crypto in node.
 */

import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { beforeAll, afterAll, vi } from 'vitest';

// Dexie v4 requires a realish setImmediate/queueMicrotask in node; fine on node 20.

// Web Crypto: enable global crypto for encryption tests.
if (!globalThis.crypto?.subtle) {
  if (globalThis.crypto) {
    Object.defineProperty(globalThis.crypto, 'subtle', {
      value: (await import('node:crypto')).webcrypto.subtle,
    });
  } else {
    Object.defineProperty(globalThis, 'crypto', {
      value: (await import('node:crypto')).webcrypto,
    });
  }
}

// navigator access for connectivity tests.
if (!(globalThis as any).navigator) {
  (globalThis as any).navigator = { onLine: true };
}

beforeAll(() => {
  (globalThis as any).crypto ??= (globalThis as any).crypto;
});

afterAll(() => {
  vi.restoreAllMocks();
});
