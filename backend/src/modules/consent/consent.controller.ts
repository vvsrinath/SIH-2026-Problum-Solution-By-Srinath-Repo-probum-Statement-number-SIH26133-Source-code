import type { Request, Response } from 'express';
import { AuthError } from '../../utils/errors';
import { sendSuccess } from '../../utils/response';
import { giveConsent, listMyConsents, withdrawConsent, getConsentSummary, isConsentValid } from './consent.service';

export async function grant(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const consent = await giveConsent({
    userId: req.auth.internalUserId,
    purpose: req.body.purpose,
    version: req.body.version,
    text: req.body.text,
    source: 'PWA',
    requestId: req.requestId,
    ip: req.ip,
  });
  return sendSuccess(res, { consent }, 201);
}

export async function list(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const consents = await listMyConsents(req.auth.internalUserId);
  return sendSuccess(res, { consents });
}

export async function withdraw(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const consent = await withdrawConsent(req.params.id, req.auth.internalUserId, req.ip, req.requestId);
  return sendSuccess(res, { consent });
}

export async function summary(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const summaryData = await getConsentSummary(req.auth.internalUserId);
  return sendSuccess(res, { summary: summaryData });
}

export async function check(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const purpose = (req.query as { purpose?: string }).purpose || '';
  const valid = await isConsentValid(req.auth.internalUserId, purpose);
  return sendSuccess(res, { valid, purpose });
}
