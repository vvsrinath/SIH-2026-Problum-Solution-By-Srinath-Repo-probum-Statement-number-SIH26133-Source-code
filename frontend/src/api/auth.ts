import { request } from './client';
import { createMockSession, clearMockSession } from './mockAuth';

export type MockLoginRole = 'PATIENT' | 'DOCTOR' | 'HEALTH_WORKER' | 'ADMIN' | 'PHC';

export interface MockLoginInput {
  role: MockLoginRole;
  provider?: string;
  doctorVariant?: 'PRIMARY' | 'SECONDARY';
}

export interface MockLoginResult {
  user: { internalUserId: string; role: string };
}

/**
 * Demo mode login. Tries the backend's mock login first (sets the real `ssat`
 * session cookie when the hosted backend is up and has a Mongo connection),
 * then falls back to a local demo JWT so the app always works — including when
 * the backend is unreachable, mock auth is disabled, or the DB is not
 * configured. This is the demo's offline-first behaviour.
 */
export async function mockLogin(input: MockLoginInput): Promise<MockLoginResult> {
  try {
    return await request<MockLoginResult>('/api/v1/auth/mock-login', {
      method: 'POST',
      body: {
        role: input.role,
        provider: input.provider ?? 'mock',
        ...(input.doctorVariant ? { doctorVariant: input.doctorVariant } : {}),
      },
    });
  } catch {
    const session = await createMockSession(input.role, input.doctorVariant);
    return { user: { internalUserId: session.user.internalUserId, role: input.role } };
  }
}

/** End the server session and clear the ssat cookie. Clears the local demo session too. */
export async function logout(): Promise<{ success: true }> {
  try {
    await request('/api/v1/auth/logout', { method: 'POST' });
  } catch {
    clearMockSession();
    return { success: true };
  }
  clearMockSession();
  return { success: true };
}

/** Parse auth candidate list into distinct provider options for the login page. */
export function serverLoginOptions(): Promise<{
  authUrl: string;
  provider: string;
  configured: boolean;
}> {
  return request<{ authUrl: string; provider: string; configured: boolean }>(
    '/api/v1/auth/login?mock=1',
  ).catch(() => ({ authUrl: '', provider: 'mock', configured: false }));
}
