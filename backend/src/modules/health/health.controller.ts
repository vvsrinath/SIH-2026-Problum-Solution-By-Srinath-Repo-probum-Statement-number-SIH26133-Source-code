import type { Request, Response } from 'express';
import { Router } from 'express';
import { env } from '../../config/env';
import { isDatabaseConnected } from '../../config/database';
import { sendSuccess } from '../../utils/response';

/** Simple liveness — fine to expose publicly. */
export function getHealth(_req: Request, res: Response) {
  return sendSuccess(
    res,
    {
      status: 'ok',
      version: '1.0.0',
      environment: env.NODE_ENV,
    },
    200,
  );
}

/** Readiness — checks critical dependencies without leaking internals. */
export async function getReady(_req: Request, res: Response) {
  const dbOk = isDatabaseConnected();
  const checks = { database: dbOk };
  const ready = dbOk;
  return sendSuccess(res, { status: ready ? 'ready' : 'not_ready', checks }, ready ? 200 : 503);
}

const router = Router();
router.get('/health', getHealth);
router.get('/ready', getReady);

export default router;
