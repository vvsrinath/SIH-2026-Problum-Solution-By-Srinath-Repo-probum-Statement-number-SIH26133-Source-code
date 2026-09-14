import type { Request, Response } from 'express';
import { AuthError } from '../../utils/errors';
import { sendSuccess } from '../../utils/response';
import { listMyNotifications, markNotificationRead } from './notifications.service';

export async function list(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const result = await listMyNotifications(req.auth.internalUserId, {
    limit: req.query.limit as unknown as number,
    offset: req.query.offset as unknown as number,
    unreadOnly: Boolean(req.query.unreadOnly),
  });
  return sendSuccess(res, result);
}

export async function markRead(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const doc = await markNotificationRead(req.params.id, req.auth.internalUserId);
  return sendSuccess(res, { notification: doc });
}
