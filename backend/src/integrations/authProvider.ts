import { env } from '../config/env';
import { MockAuthProvider, mockRoleDecision } from './mock/mock.provider';
import { MeriPehchaanProvider } from './meripehchaan/meripehchaan.provider';
import type { AuthProvider, RoleDecision, ExternalIdentity } from '../modules/auth/auth.types';

let _provider: AuthProvider | null = null;

/** Return the configured provider singleton. */
export function getAuthProvider(): AuthProvider {
  if (_provider) return _provider;
  _provider = env.AUTH_PROVIDER === 'meripehchaan' ? new MeriPehchaanProvider() : new MockAuthProvider();
  return _provider;
}

/**
 * Server-side role decision. MeriPehchaan returns a verified identity but we
 * decide the role here; in a full deployment this would consult a verified
 * registry (e.g. doctor verification) — never the client.
 */
export function decideRole(identity: ExternalIdentity): RoleDecision {
  const provider = getAuthProvider();
  if (provider.name === 'mock') {
    return mockRoleDecision(identity as ExternalIdentity & { _mockRole?: 'PATIENT' | 'DOCTOR' | 'HEALTH_WORKER' | 'ADMIN' });
  }
  // MeriPehchaan: default to PATIENT until a verified role registry exists.
  return { role: 'PATIENT' };
}
