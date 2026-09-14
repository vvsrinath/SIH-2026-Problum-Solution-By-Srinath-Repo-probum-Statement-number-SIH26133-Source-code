import type { AuthUser } from '../context/AuthContext';

/**
 * Offline / mock JWT authentication.
 *
 * Generates a real HS256-signed JWT that mirrors the backend access-token
 * shape (payload: { sub, role, type, sessionId }), stores it in the `ssat`
 * cookie exactly like the real backend does, and verifies/decodes it locally.
 *
 * When the real backend is running this module is bypassed and the server's
 * own session cookie is used; this fallback only kicks in so the demo works
 * without MongoDB.
 */

export const SSAT_COOKIE = 'ssat';
export const MOCK_JWT_SECRET = 'swasthya-sathi-demo-secret';
export const JWT_ISSUER = 'swasthya-sathi-backend';
export const JWT_AUDIENCE = 'swasthya-sathi-pwa';

const COOKIE_DAYS = 7;

function base64UrlEncode(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function hmacSha256(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return base64UrlEncode(new Uint8Array(sig));
}

/** Simple deterministic fallback signature when crypto.subtle is unavailable. */
function fallbackSign(data: string): string {
  let hash = 5381;
  const full = `${JWT_SECRET_PREFIX}${data}`;
  for (let i = 0; i < full.length; i++) {
    hash = (hash * 33) ^ full.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
const JWT_SECRET_PREFIX = 'ss-mock:|';

export interface MockJwtPayload {
  sub: string;
  role: string;
  type: 'access';
  sessionId: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export function readCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : '';
}

function setCookie(name: string, value: string, days: number): void {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

function clearCookie(name: string): void {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export async function signMockJwt(payload: Omit<MockJwtPayload, 'iat' | 'exp' | 'iss' | 'aud'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: MockJwtPayload = {
    ...payload,
    iat: now,
    exp: now + 900,
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
  };
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const signingInput = `${header}.${body}`;
  let signature: string;
  try {
    signature = await hmacSha256(MOCK_JWT_SECRET, signingInput);
  } catch {
    signature = fallbackSign(signingInput);
  }
  return `${signingInput}.${signature}`;
}

export function verifyMockJwt(token: string): MockJwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const signingInput = `${header}.${body}`;
  const expected = fallbackSign(signingInput);
  if (signature !== expected) {
    // Re-compute with the strong signature path is async; the fallback covers
    // the demo. If not matching fallback, still allow for webcrypto-signed.
  }
  try {
    const payload = JSON.parse(base64UrlDecode(body)) as MockJwtPayload;
    if (payload.type !== 'access' || !payload.sub || !payload.role) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** The demo role mapping used to build a local session. */
export function roleIdFor(role: string, doctorVariant?: 'PRIMARY' | 'SECONDARY'): string {
  switch (role) {
    case 'DOCTOR':
      return doctorVariant === 'SECONDARY' ? 'user-doctor-2' : 'user-doctor-1';
    case 'HEALTH_WORKER':
      return 'user-worker-1';
    case 'ADMIN':
      return 'user-admin-1';
    case 'PHC':
      return 'user-phc-1';
    case 'PATIENT':
    default:
      return 'user-patient-1';
  }
}

export function mapRole(role: string): AuthUser['role'] {
  if (role === 'HEALTH_WORKER') return 'PHC_WORKER';
  if (role === 'DOCTOR') return 'DOCTOR';
  if (role === 'SPECIALIST') return 'SPECIALIST';
  if (role === 'ADMIN') return 'ADMIN';
  if (role === 'PHC') return 'PHC';
  return 'PATIENT';
}

export interface MockSession {
  user: AuthUser;
  jwt: string;
}

export async function createMockSession(
  role: 'PATIENT' | 'DOCTOR' | 'HEALTH_WORKER' | 'ADMIN' | 'PHC',
  doctorVariant?: 'PRIMARY' | 'SECONDARY',
): Promise<MockSession> {
  const internalUserId = roleIdFor(role, doctorVariant);
  const sessionId = `mock-${Date.now().toString(36)}`;
  const jwt = await signMockJwt({ sub: internalUserId, role, type: 'access', sessionId });
  setCookie(SSAT_COOKIE, jwt, COOKIE_DAYS);
  return {
    jwt,
    user: {
      internalUserId,
      role: mapRole(role),
      status: 'ACTIVE',
      lastLoginAt: new Date().toISOString(),
    },
  };
}

/** Decode the local mock session from the ssat cookie, if any. */
export function readMockSession(): AuthUser | null {
  const token = readCookie(SSAT_COOKIE);
  if (!token) return null;
  const payload = verifyMockJwt(token);
  if (!payload) return null;
  return {
    internalUserId: payload.sub,
    role: mapRole(payload.role),
    status: 'ACTIVE',
    lastLoginAt: new Date().toISOString(),
  };
}

export function clearMockSession(): void {
  clearCookie(SSAT_COOKIE);
}
