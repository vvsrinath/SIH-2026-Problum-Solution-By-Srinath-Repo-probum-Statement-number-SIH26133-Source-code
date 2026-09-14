import { describe, it, expect } from 'vitest';
import {
  encryptWithKey,
  decryptWithKey,
  deriveStorageKey,
} from './messageEncryption';

describe('Message encryption (AES-GCM-256)', () => {
  it('encrypts to a non-plaintext blob and decrypts back', async () => {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );

    const plain = 'Sensitive medical chat: heterotaxy syndrome';
    const blob = await encryptWithKey(plain, key);

    expect(blob.ciphertext).not.toContain('heterotaxy');
    expect(blob.ciphertext).not.toBe(plain);
    expect(blob.algorithm).toBe('AES-GCM-256');

    const decrypted = await decryptWithKey(blob, key);
    expect(decrypted).toBe(plain);
  });

  it('refuses to decrypt with the wrong key', async () => {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
    const wrong = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );

    const blob = await encryptWithKey('secret', key);
    await expect(decryptWithKey(blob, wrong)).rejects.toThrow();
  });

  it('derives a deterministic storage key from passphrase + salt', async () => {
    const k1 = await deriveStorageKey('correct horse battery', 'salt-one');
    const k2 = await deriveStorageKey('correct horse battery', 'salt-one');
    const k3 = await deriveStorageKey('correct horse battery', 'salt-two');
    expect(k1).toBeDefined();

    // Same passphrase + same salt => key1 decrypts what key2 encrypted.
    const a = await encryptWithKey('same', k1);
    expect(await decryptWithKey(a, k2)).toBe('same');

    // Different salt => different key => a message encrypted with k1 does NOT
    // decrypt with k3.
    const c = await encryptWithKey('same', k1);
    await expect(decryptWithKey(c, k3)).rejects.toThrow();
  });
});
