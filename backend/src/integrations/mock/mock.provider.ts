import type { AuthProvider, ExternalIdentity, RoleDecision } from '../../modules/auth/auth.types';

/** Role available in mock mode (based on a state/role payload). */
export type MockRole = 'PATIENT' | 'DOCTOR' | 'HEALTH_WORKER' | 'ADMIN';

/**
 * Demo authentication provider.
 *
 * Security: only active when AUTH_PROVIDER=mock (enforced per-route for mock
 * login, and for the long-running server entry, startup additionally fails
 * fast in production — see config/env.ts). It issues a deterministic demo
 * identity so the UI and workflows can be exercised without a real
 * MeriPehchaan account, both locally and on the hosted demo deployment.
 */
export class MockAuthProvider implements AuthProvider {
  readonly name = 'mock' as const;

  isConfigured(): boolean {
    return true;
  }

  buildAuthUrl(state: string): string {
    // In mock mode there is no external redirect; the "auth url" encodes the
    // intent. The controller can short-circuit and issue the session directly.
    return `mock://callback?state=${encodeURIComponent(state)}`;
  }

  async handleCallback(input: { code?: string; state?: string }): Promise<ExternalIdentity> {
    let role: MockRole = 'PATIENT';
    if (input.state) {
      try {
        const parsed = new URLSearchParams(input.state);
        const r = parsed.get('role');
        if (r && ['PATIENT', 'DOCTOR', 'HEALTH_WORKER', 'ADMIN'].includes(r)) role = r as MockRole;
      } catch {
        /* ignore malformed state */
      }
    }

    const base = `mock-${role.toLowerCase()}`;
    return {
      externalIdentityReference: `mock-ref-${base}`,
      claims: {
        name: `Demo ${role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}`,
        mobile: '9000000000',
      },
      // non-standard: expose the chosen role for dev role selection
      ...({ _mockRole: role } as object),
    } as ExternalIdentity & { _mockRole: MockRole };
  }

  // noop — mock has no refresh
  async refreshSession(_token: string): Promise<ExternalIdentity> {
    throw new Error('Mock provider does not support token refresh');
  }
}

/** Map a mock identity to a role — dev only. */
export function mockRoleDecision(identity: ExternalIdentity & { _mockRole?: MockRole }): RoleDecision {
  const role = identity._mockRole ?? 'PATIENT';
  return { role };
}
