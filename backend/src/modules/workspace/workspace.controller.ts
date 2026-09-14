import type { Request, Response } from 'express';
import { AuthError } from '../../utils/errors';
import { sendSuccess, sendError } from '../../utils/response';
import {
  workerOverview,
  workerPatients,
  workerTriage,
  workerReferrals,
  workerFollowUps,
  phcOverview,
  phcQueue,
  phcPatients,
  phcReferrals,
  phcMedicines,
  phcDiagnostics,
  adminOverview,
  adminAnalytics,
  adminFacilities,
  adminReferralCases,
  adminReports,
  adminSettings,
  conversations,
  threads,
  appendMessage,
  prescriptions,
  reports,
  consultations,
} from './workspace.data';

/* Each handler returns the SAME shape the frontend service layer expects —
   the `request()` client unwraps `{ success, data }`, so `data` must be the
   collection/object the page renders directly. */

/* ------------------------------- worker ------------------------------- */

export async function getWorkerOverview(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, workerOverview);
}

export async function getWorkerPatients(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, workerPatients);
}

export async function getWorkerTriage(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, workerTriage);
}

export async function getWorkerReferrals(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, workerReferrals);
}

export async function getWorkerFollowUps(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, workerFollowUps);
}

/* ---------------------------------- PHC ---------------------------------- */

export async function getPhcOverview(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, phcOverview);
}

export async function getPhcQueue(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, phcQueue);
}

export async function getPhcPatients(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, phcPatients);
}

export async function getPhcReferrals(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, phcReferrals);
}

export async function getPhcMedicines(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, phcMedicines);
}

export async function getPhcDiagnostics(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, phcDiagnostics);
}

/* --------------------------------- admin --------------------------------- */

export async function getAdminOverview(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, adminOverview);
}

export async function getAdminAnalytics(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, adminAnalytics);
}

export async function getAdminFacilities(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, adminFacilities);
}

export async function getAdminReferralCases(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, adminReferralCases);
}

export async function getAdminReports(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, adminReports);
}

export async function getAdminSettings(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, adminSettings);
}

/* ------------------------------- messaging ------------------------------- */

export async function listConversations(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, conversations);
}

export async function getThread(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const id = req.params.id;
  const thread = threads[id];
  if (!thread) {
    return sendError(res, 404, 'NOT_FOUND', `Conversation ${id} not found`, req.requestId);
  }
  return sendSuccess(res, thread);
}

export async function sendMessage(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  const id = req.params.id;
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'message text is required', req.requestId);
  }
  if (!threads[id] && !conversations.some((c) => c.id === id)) {
    return sendError(res, 404, 'NOT_FOUND', `Conversation ${id} not found`, req.requestId);
  }
  const message = appendMessage(id, text);
  return sendSuccess(res, message, 201);
}

/* ------------------------------ prescriptions ------------------------------ */

export async function listPrescriptions(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, prescriptions);
}

export async function listReports(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, reports);
}

export async function listConsultations(req: Request, res: Response) {
  if (!req.auth) throw new AuthError();
  return sendSuccess(res, consultations);
}