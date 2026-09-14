import { env } from '../../config/env';
import { UnavailableError } from '../../utils/errors';
import logger from '../../config/logger';

export interface AIChatInput {
  message: string;
  role?: string;
  language?: string;
  sessionId?: string;
}

export interface AIChatResult {
  reply: string;
  agent: string;
  sessionId: string;
  emergency: boolean;
}

/**
 * Client for the internal Python (FastAPI) AI service.
 *
 * Authentication: every call carries the shared `X-AI-Service-Secret`. We
 * NEVER expose this service to the public internet; it is reached only from
 * the Node backend over HTTPS/internal networking.
 *
 * On failure we raise an UnavailableError with a safe fallback rather than
 * leaking raw exceptions to the caller.
 */
export async function callAIChat(input: AIChatInput): Promise<AIChatResult> {
  if (!env.AI_SERVICE_URL || !env.AI_SERVICE_SECRET) {
    return {
      reply: 'AI assessment is temporarily unavailable. Please consult a healthcare professional.',
      agent: 'Triage',
      sessionId: input.sessionId || '',
      emergency: false,
    };
  }

  try {
    const res = await fetch(`${env.AI_SERVICE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Service-Secret': env.AI_SERVICE_SECRET,
      },
      body: JSON.stringify({
        message: input.message,
        role: input.role || 'patient',
        lang: input.language || 'en',
        session_id: input.sessionId || undefined,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (res.status === 503) {
      return {
        reply: 'AI assessment is temporarily unavailable. Please consult a healthcare professional.',
        agent: 'Triage',
        sessionId: input.sessionId || '',
        emergency: false,
      };
    }
    if (!res.ok) {
      throw new UnavailableError('AI assessment is temporarily unavailable', 'AI_SERVICE_UNAVAILABLE');
    }

    const data = (await res.json()) as AIChatResult;
    logger.info({ sessionId: data.sessionId }, 'AI chat completed');
    return data;
  } catch (err) {
    logger.warn({ err }, 'AI service call failed');
    throw new UnavailableError('AI assessment is temporarily unavailable. Please consult a healthcare professional.', 'AI_SERVICE_UNAVAILABLE');
  }
}

/** Emit a safe fallback reply (used when the AI service is not configured). */
export function unavailableReply(): AIChatResult {
  return {
    reply: 'AI assessment is temporarily unavailable. Please consult a healthcare professional.',
    agent: 'Triage',
    sessionId: '',
    emergency: false,
  };
}
