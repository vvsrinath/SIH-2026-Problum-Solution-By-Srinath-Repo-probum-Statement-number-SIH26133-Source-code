import type { Request, Response } from 'express';
import { AuthError } from '../../utils/errors';
import { sendSuccess } from '../../utils/response';
import { submitPrivacyRequest, listMyPrivacyRequests, getPrivacyRequest, decidePrivacyRequest, exportUserData, exportFullUserData, eraseAllUserData } from './privacy.service';

export async function submit(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const doc = await submitPrivacyRequest({
    userId: req.auth.internalUserId,
    type: req.body.type,
    describeData: req.body.describeData,
    correctionDetails: req.body.correctionDetails,
    rationale: req.body.rationale,
    ip: req.ip,
    requestId: req.requestId,
  });
  return sendSuccess(res, { request: doc }, 201);
}

export async function list(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const requests = await listMyPrivacyRequests(req.auth.internalUserId);
  return sendSuccess(res, { requests });
}

export async function get(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const doc = await getPrivacyRequest(req.params.id, req.auth.internalUserId);
  return sendSuccess(res, { request: doc });
}

export async function decide(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const doc = await decidePrivacyRequest(
    req.params.id,
    req.auth.internalUserId,
    req.body.status,
    req.body.decisionNote,
    req.ip,
    req.requestId,
  );
  return sendSuccess(res, { request: doc });
}

export async function exportData(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const data = await exportUserData(req.auth.internalUserId);
  return sendSuccess(res, { data });
}

export async function exportFullData(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const data = await exportFullUserData(req.auth.internalUserId);
  return sendSuccess(res, { data });
}

export async function eraseData(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const result = await eraseAllUserData(req.auth.internalUserId);
  return sendSuccess(res, result);
}
