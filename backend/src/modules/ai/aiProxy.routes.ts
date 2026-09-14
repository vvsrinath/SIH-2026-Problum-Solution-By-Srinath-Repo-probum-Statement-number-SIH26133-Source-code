import { Router } from 'express';
import type { Request, Response } from 'express';
import { env } from '../../config/env';
import { sendError } from '../../utils/response';

const router = Router();

/**
 * Proxy POST /chat/stream to the AI service.
 * The AI service runs at AI_SERVICE_URL (default http://127.0.0.1:8100)
 * and expects POST /api/v1/chat with JSON body.
 */
router.post('/chat/stream', async (req: Request, res: Response) => {
  try {
    const aiUrl = `${env.AI_SERVICE_URL}/api/v1/chat`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (env.AI_SERVICE_SECRET) headers['X-AI-Service-Secret'] = env.AI_SERVICE_SECRET;

    const aiRes = await fetch(aiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text().catch(() => '');
      return sendError(res, aiRes.status as number, 'AI_SERVICE_ERROR', detail || `AI service replied ${aiRes.status}`);
    }

    // Stream the SSE response back to the client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (aiRes.body) {
      const reader = aiRes.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;
        if (chunk.value) res.write(decoder.decode(chunk.value, { stream: true }));
      }
    }
    res.end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI service unavailable';
    return sendError(res, 502, 'AI_SERVICE_UNAVAILABLE', msg);
  }
});

/**
 * Proxy POST /translate to the AI service.
 */
router.post('/translate', async (req: Request, res: Response) => {
  try {
    const aiUrl = `${env.AI_SERVICE_URL}/api/v1/translate`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (env.AI_SERVICE_SECRET) headers['X-AI-Service-Secret'] = env.AI_SERVICE_SECRET;

    const aiRes = await fetch(aiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text().catch(() => '');
      return sendError(res, aiRes.status as number, 'AI_SERVICE_ERROR', detail || `AI service replied ${aiRes.status}`);
    }

    const data = await aiRes.json();
    res.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI service unavailable';
    return sendError(res, 502, 'AI_SERVICE_UNAVAILABLE', msg);
  }
});

export default router;
