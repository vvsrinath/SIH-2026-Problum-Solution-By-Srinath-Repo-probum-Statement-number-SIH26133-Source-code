/**
 * Dependency-free liveness endpoint served at `/api/v1/health`.
 *
 * Kept out of the Express bundle so uptime monitors get a fast, minimal
 * response even while the full app function is cold starting. Returns the
 * same envelope shape as the root health router.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';

export default function health(_req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      success: true,
      data: {
        status: 'ok',
        service: 'swasthya-sathi-backend',
        version: '1.0.0',
        environment: process.env.NODE_ENV ?? 'production',
      },
    }),
  );
  return res;
}