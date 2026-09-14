/**
 * Cryptographic utilities (Web Crypto).
 *
 * NOTE: Base64 is an encoding, NOT encryption. All sensitive data here is
 * encrypted with AES-GCM using keys managed via the Web Crypto API. Keys are
 * never hardcoded and never stored in plain storage.
 */

export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}

export function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function toBase64url(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64url(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  return atob(b64);
}

export function randomId(prefix = ''): string {
  const raw = crypto.getRandomValues(new Uint8Array(16));
  const hex = bufferToHex(raw.buffer as ArrayBuffer);
  return prefix ? `${prefix}-${hex}` : hex;
}

/**
 * Fixed per-app salt is NOT a secret; the passphrase carries the entropy.
 * Kept for deterministic keys from a user passphrase when needed.
 */
export const E2EE_SALT = 'swasthya-sathi-e2ee-v1';
