import type { Request, Response } from 'express';
import { AuthError } from '../../utils/errors';
import { sendSuccess } from '../../utils/response';
import { queryAuditLog } from './audit.service';

export async function list(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const result = await queryAuditLog({
    limit: req.query.limit as unknown as number,
    offset: req.query.offset as unknown as number,
    actorUserId: typeof req.query.actorUserId === 'string' ? req.query.actorUserId : undefined,
    action: typeof req.query.action === 'string' ? req.query.action : undefined,
    result: typeof req.query.result === 'string' ? req.query.result : undefined,
  });
  return sendSuccess(res, result);
}
