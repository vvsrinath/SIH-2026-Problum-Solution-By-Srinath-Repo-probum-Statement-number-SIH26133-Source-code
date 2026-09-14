import { env } from '../../config/env';
import { UnavailableError } from '../../utils/errors';

/** A provider-neutral video consultation interface. */
export interface VideoProvider {
  createSession(opts: { appointmentId: string; participantIds: string[] }): Promise<{ providerReference: string }>;
  getSession(opts: { providerReference: string }): Promise<{ status: string }>;
  authorizeParticipant(opts: {
    providerReference: string;
    participantId: string;
  }): Promise<{ authorized: boolean; shortLivedToken?: string }>;
  getJoinInformation(opts: { providerReference: string; participantId: string }): Promise<{ joinUrl: string }>;
  endSession(opts: { providerReference: string }): Promise<void>;
  isConfigured(): boolean;
}

/**
 * BharatVC video provider adapter.
 *
 * Only implemented against officially documented/authorized BharatVC
 * endpoints. Without official integration credentials the adapter reports
 * `isConfigured() === false` and every method throws a controlled
 * `INTEGRATION_UNAVAILABLE` so the appointment remains valid and the caller
 * sees a friendly "teleconsultation temporarily unavailable" response.
 */
export class BharatVCProvider implements VideoProvider {
  isConfigured(): boolean {
    return Boolean(env.BHARATVC_BASE_URL && env.BHARATVC_CLIENT_ID && env.BHARATVC_CLIENT_SECRET);
  }

  private requireConfigured() {
    if (!this.isConfigured()) {
      throw new UnavailableError('Teleconsultation service temporarily unavailable', 'INTEGRATION_UNAVAILABLE');
    }
  }

  async createSession(opts: { appointmentId: string; participantIds: string[] }): Promise<{ providerReference: string }> {
    this.requireConfigured();
    const res = await fetch(`${env.BHARATVC_BASE_URL}/sessions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ appointmentId: opts.appointmentId, participants: opts.participantIds }),
    });
    if (!res.ok) throw new UnavailableError('Teleconsultation service temporarily unavailable', 'INTEGRATION_UNAVAILABLE');
    const data = (await res.json()) as { id?: string; sessionId?: string };
    return { providerReference: data.id || data.sessionId || '' };
  }

  async getSession(opts: { providerReference: string }): Promise<{ status: string }> {
    this.requireConfigured();
    const res = await fetch(`${env.BHARATVC_BASE_URL}/sessions/${opts.providerReference}`, { headers: this.headers() });
    if (!res.ok) throw new UnavailableError('Teleconsultation service temporarily unavailable', 'INTEGRATION_UNAVAILABLE');
    const data = (await res.json()) as { status?: string };
    return { status: data.status || 'UNKNOWN' };
  }

  async authorizeParticipant(opts: { providerReference: string; participantId: string }) {
    this.requireConfigured();
    const res = await fetch(
      `${env.BHARATVC_BASE_URL}/sessions/${opts.providerReference}/participants/${opts.participantId}/authorize`,
      { method: 'POST', headers: this.headers() },
    );
    if (!res.ok) throw new UnavailableError('Teleconsultation service temporarily unavailable', 'INTEGRATION_UNAVAILABLE');
    const data = (await res.json()) as { authorized?: boolean; token?: string };
    return { authorized: Boolean(data.authorized), shortLivedToken: data.token };
  }

  async getJoinInformation(opts: { providerReference: string; participantId: string }) {
    this.requireConfigured();
    const res = await fetch(
      `${env.BHARATVC_BASE_URL}/sessions/${opts.providerReference}/participants/${opts.participantId}/join`,
      { headers: this.headers() },
    );
    if (!res.ok) throw new UnavailableError('Teleconsultation service temporarily unavailable', 'INTEGRATION_UNAVAILABLE');
    const data = (await res.json()) as { url?: string; joinUrl?: string };
    return { joinUrl: data.joinUrl || data.url || '' };
  }

  async endSession(opts: { providerReference: string }): Promise<void> {
    this.requireConfigured();
    await fetch(`${env.BHARATVC_BASE_URL}/sessions/${opts.providerReference}/end`, {
      method: 'POST',
      headers: this.headers(),
    });
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${env.BHARATVC_CLIENT_ID}:${env.BHARATVC_CLIENT_SECRET!}`).toString('base64')}`,
    };
  }
}

export const bharatVCProvider = new BharatVCProvider();
