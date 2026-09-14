import type { Role } from '../../constants/roles';

/** Normalized external identity returned by any authentication provider. */
export interface ExternalIdentity {
  /** Immutable reference to the user at the provider (e.g. MeriPehchaan id). */
  externalIdentityReference: string;
  /** Verified identity attributes — minimized. MeriPehchaan-style attributes. */
  claims: {
    /** e.g. Aadhaar-masked / name — only what the flow requires */
    name?: string;
    mobile?: string;
    email?: string;
  };
}

export interface AuthCallbackInput {
  /** raw authorization code or token returned by the provider callback */
  code?: string;
  state?: string;
}

export interface AuthProviderResult {
  identity: ExternalIdentity;
  /** Deterministic role mapping is done server-side; the provider may only
   *  influence it via verified claims. Never trust a client-supplied role. */
}

/**
 * Provider abstraction so the backend is not coupled to a specific identity
 * provider. All providers must honour the same contract.
 */
export interface AuthProvider {
  readonly name: 'mock' | 'meripehchaan';

  /** Build the authorization URL to send the PWA to. */
  buildAuthUrl(state: string, redirectUri?: string): string;

  /** Exchange the callback payload for a verified identity. */
  handleCallback(input: AuthCallbackInput): Promise<ExternalIdentity>;

  /** Optional: exchange/refresh a token. Default no-op. */
  refreshSession?(refreshToken: string): Promise<ExternalIdentity>;

  /** True when this provider can actually be used (credentials configured). */
  isConfigured(): boolean;
}

/** Server-side role decision. Each provider maps verified identity to a role. */
export interface RoleDecision {
  role: Role;
}

export type { Role };
