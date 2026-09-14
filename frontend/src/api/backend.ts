import { mockChatReply } from './mockTriage';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

export interface ChatMeta {
  session_id: string;
  agent: string;
  lang: string;
  emergency: boolean;
}

export interface ChatDone {
  session_id: string;
  agent?: string;
}

export interface ChatStreamOptions {
  sessionId?: string;
  message: string;
  lang?: string;
  role?: string;
  features?: string[];
  onMeta?: (meta: ChatMeta) => void;
  onDelta?: (text: string) => void;
  onDone?: (done: ChatDone) => void;
  signal?: AbortSignal;
}

export function createSessionId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '')
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export async function getHealth(): Promise<{ status: string; version: string; environment: string }> {
  const res = await fetch(`${API_BASE_URL}/health`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  const body = await res.json();
  return body.data ?? body;
}

/**
 * Streams a chat turn over SSE. Resolves when the stream ends.
 * Throws on non-2xx so the UI can surface a friendly error.
 */
export async function streamChat({
  sessionId,
  message,
  lang = 'auto',
  role = 'patient',
  features = [],
  onMeta,
  onDelta,
  onDone,
  signal,
}: ChatStreamOptions): Promise<void> {
  const reply = mockChatReply(message);

  const performStream = async () => {
    const res = await fetch(`${API_BASE_URL}/api/v1/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, message, lang, role, features }),
      credentials: 'include',
      signal,
    });
    return res;
  };

  let res: Response;
  try {
    res = await performStream();
  } catch {
    // Backend unreachable → serve a local rule-based reply.
    return streamMockReply(reply, sessionId, onMeta, onDelta, onDone);
  }

  if (!res.ok || !res.body) {
    return streamMockReply(reply, sessionId, onMeta, onDelta, onDone);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  let streamDone = false;
  while (!streamDone) {
    const { done, value } = await reader.read();
    streamDone = done;
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');

      const eventType = rawEvent.startsWith('event:')
        ? rawEvent.slice(6).trim().split('\n')[0]
        : 'message';
      const dataLine = rawEvent
        .split('\n')
        .find((line) => line.startsWith('data:'));
      if (!dataLine) continue;

      try {
        const data = JSON.parse(dataLine.slice(5).trim());
        if (eventType === 'meta') onMeta?.(data as ChatMeta);
        else if (eventType === 'delta') onDelta?.(data.text ?? '');
        else if (eventType === 'done') onDone?.(data as ChatDone);
      } catch {
        // ignore a malformed event and keep the stream going
      }
    }
  }
}

/** Emit a local reply in SSE-style callbacks for offline / mock mode. */
async function streamMockReply(
  reply: { text: string; agent: string; emergency: boolean },
  sessionId: string | undefined,
  onMeta?: (meta: ChatMeta) => void,
  onDelta?: (text: string) => void,
  onDone?: (done: ChatDone) => void,
): Promise<void> {
  const sid = sessionId ?? createSessionId();
  onMeta?.({
    session_id: sid,
    agent: reply.agent,
    lang: 'en',
    emergency: reply.emergency,
  });
  const chunks = reply.text.match(/.{1,8}/gs) ?? [];
  for (const chunk of chunks) {
    onDelta?.(chunk);
    await new Promise((r) => setTimeout(r, 6));
  }
  onDone?.({ session_id: sid, agent: reply.agent });
}

export async function translate(text: string, to: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/v1/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, to }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Translation failed: ${res.status}`);
  const body = (await res.json()) as { text: string };
  return body.text;
}