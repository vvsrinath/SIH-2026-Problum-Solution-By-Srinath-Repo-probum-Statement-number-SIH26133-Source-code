import { env } from '../../config/env';
import { UnavailableError } from '../../utils/errors';
import type { AuthProvider, ExternalIdentity } from '../../modules/auth/auth.types';

/**
 * MeriPehchaan identity-provider adapter.
 *
 * Implements an OAuth2 authorization-code flow against the configured
 * MeriPehchaan endpoints. Endpoint URLs are NOT invented here: they come from
 * environment configuration (MERIPEHCHAAN_AUTH_URL / _TOKEN_URL /
 * _USERINFO_URL) which must match the official MeriPehchaan documentation.
 *
 * When official credentials/endpoints are absent the provider reports
 * `isConfigured() === false` and routes fail gracefully instead of crashing.
 */
export class MeriPehchaanProvider implements AuthProvider {
  readonly name = 'meripehchaan' as const;

  isConfigured(): boolean {
    return Boolean(
      env.MERIPEHCHAAN_CLIENT_ID &&
        env.MERIPEHCHAAN_CLIENT_SECRET &&
        env.MERIPEHCHAAN_AUTH_URL &&
        env.MERIPEHCHAAN_TOKEN_URL &&
        env.MERIPEHCHAAN_USERINFO_URL,
    );
  }

  private requireConfigured() {
    if (!this.isConfigured()) {
      throw new UnavailableError('MeriPehchaan integration is not configured', 'INTEGRATION_UNAVAILABLE');
    }
  }

  buildAuthUrl(state: string, redirectUri?: string): string {
    this.requireConfigured();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.MERIPEHCHAAN_CLIENT_ID!,
      redirect_uri: redirectUri || env.MERIPEHCHAAN_REDIRECT_URI || '',
      state,
      scope: 'openid',
    });
    return `${env.MERIPEHCHAAN_AUTH_URL}?${params.toString()}`;
  }

  async handleCallback(input: { code?: string; state?: string }): Promise<ExternalIdentity> {
    this.requireConfigured();

    if (!input.code) throw new UnavailableError('No authorization code returned', 'AUTH_CODE_MISSING');

    // 1) Exchange code for tokens
    const tokenRes = await fetch(env.MERIPEHCHAAN_TOKEN_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: input.code,
        client_id: env.MERIPEHCHAAN_CLIENT_ID!,
        client_secret: env.MERIPEHCHAAN_CLIENT_SECRET!,
        redirect_uri: env.MERIPEHCHAAN_REDIRECT_URI || '',
        state: input.state || '',
      }).toString(),
    });

    if (!tokenRes.ok) {
      throw new UnavailableError('MeriPehchaan token exchange failed', 'MERIPEHCHAAN_TOKEN_ERROR');
    }
    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) throw new UnavailableError('No access token returned', 'MERIPEHCHAAN_TOKEN_ERROR');

    // 2) Fetch userinfo
    const userRes = await fetch(env.MERIPEHCHAAN_USERINFO_URL!, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) throw new UnavailableError('MeriPehchaan userinfo failed', 'MERIPEHCHAAN_USERINFO_ERROR');
    const user = (await userRes.json()) as { sub?: string; userId?: string; name?: string; mobile?: string; email?: string };

    const externalIdentityReference = user.sub || user.userId || '';
    if (!externalIdentityReference) {
      throw new UnavailableError('MeriPehchaan identity reference missing', 'MERIPEHCHAAN_USERINFO_ERROR');
    }

    return {
      externalIdentityReference,
      claims: {
        name: user.name,
        mobile: user.mobile,
        email: user.email,
      },
    };
  }

  async refreshSession(refreshToken: string): Promise<ExternalIdentity> {
    this.requireConfigured();

    // Exchange refresh token for new access token
    const tokenRes = await fetch(env.MERIPEHCHAAN_TOKEN_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: env.MERIPEHCHAAN_CLIENT_ID!,
        client_secret: env.MERIPEHCHAAN_CLIENT_SECRET!,
      }).toString(),
      signal: AbortSignal.timeout(15000),
    });

    if (!tokenRes.ok) {
      throw new UnavailableError('MeriPehchaan token refresh failed', 'MERIPEHCHAAN_REFRESH_ERROR');
    }

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      refresh_token?: string;
    };

    if (!tokenData.access_token) {
      throw new UnavailableError('No access token in refresh response', 'MERIPEHCHAAN_REFRESH_ERROR');
    }

    // Fetch updated userinfo
    const userRes = await fetch(env.MERIPEHCHAAN_USERINFO_URL!, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!userRes.ok) {
      throw new UnavailableError('MeriPehchaan userinfo failed after refresh', 'MERIPEHCHAAN_USERINFO_ERROR');
    }

    const user = (await userRes.json()) as {
      sub?: string;
      userId?: string;
      name?: string;
      mobile?: string;
      email?: string;
    };

    const externalIdentityReference = user.sub || user.userId || '';
    if (!externalIdentityReference) {
      throw new UnavailableError('MeriPehchaan identity reference missing', 'MERIPEHCHAAN_USERINFO_ERROR');
    }

    return {
      externalIdentityReference,
      claims: {
        name: user.name,
        mobile: user.mobile,
        email: user.email,
      },
    };
  }
}
