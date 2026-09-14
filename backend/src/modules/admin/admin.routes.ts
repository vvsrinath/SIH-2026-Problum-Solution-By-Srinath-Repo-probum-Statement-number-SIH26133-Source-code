import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../../middleware/authentication';
import { requirePermission } from '../../middleware/authorization';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { AuthError } from '../../utils/errors';
import { enforceAllRetention, getRetentionStatus } from '../../services/retention.service';
import {
  detectIncident,
  assessIncident,
  containIncident,
  notifyIncident,
  remediateIncident,
  reviewIncident,
  getOpenIncidents,
  getIncident,
} from '../../services/breach.service';
import { PERMISSION } from '../../constants/roles';

const router = Router();
router.use(requireAuth);

// Retention management (admin only)
router.get(
  '/retention/status',
  requirePermission(PERMISSION.ADMIN_SYSTEM),
  asyncHandler(async (_req: Request, res: Response) => {
    const status = await getRetentionStatus();
    return sendSuccess(res, { status });
  }),
);

router.post(
  '/retention/enforce',
  requirePermission(PERMISSION.ADMIN_SYSTEM),
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await enforceAllRetention();
    return sendSuccess(res, result);
  }),
);

// Incident management (admin only)
router.get(
  '/incidents',
  requirePermission(PERMISSION.ADMIN_SYSTEM),
  asyncHandler(async (_req: Request, res: Response) => {
    const incidents = await getOpenIncidents();
    return sendSuccess(res, { incidents });
  }),
);

router.get(
  '/incidents/:id',
  requirePermission(PERMISSION.ADMIN_SYSTEM),
  asyncHandler(async (req: Request, res: Response) => {
    const incident = await getIncident(req.params.id);
    if (!incident) return sendSuccess(res, { incident: null }, 404);
    return sendSuccess(res, { incident });
  }),
);

router.post(
  '/incidents/detect',
  requirePermission(PERMISSION.ADMIN_SYSTEM),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw new AuthError();
    const incident = await detectIncident({
      ...req.body,
      detectedBy: req.auth.internalUserId,
    });
    return sendSuccess(res, { incident }, 201);
  }),
);

router.post(
  '/incidents/:id/assess',
  requirePermission(PERMISSION.ADMIN_SYSTEM),
  asyncHandler(async (req: Request, res: Response) => {
    const incident = await assessIncident(req.params.id, req.body);
    return sendSuccess(res, { incident });
  }),
);

router.post(
  '/incidents/:id/contain',
  requirePermission(PERMISSION.ADMIN_SYSTEM),
  asyncHandler(async (req: Request, res: Response) => {
    const incident = await containIncident(req.params.id, req.body.actions || []);
    return sendSuccess(res, { incident });
  }),
);

router.post(
  '/incidents/:id/notify',
  requirePermission(PERMISSION.ADMIN_SYSTEM),
  asyncHandler(async (req: Request, res: Response) => {
    const incident = await notifyIncident(req.params.id);
    return sendSuccess(res, { incident });
  }),
);

router.post(
  '/incidents/:id/remediate',
  requirePermission(PERMISSION.ADMIN_SYSTEM),
  asyncHandler(async (req: Request, res: Response) => {
    const incident = await remediateIncident(
      req.params.id,
      req.body.actions || [],
      req.body.rootCause || '',
    );
    return sendSuccess(res, { incident });
  }),
);

router.post(
  '/incidents/:id/review',
  requirePermission(PERMISSION.ADMIN_SYSTEM),
  asyncHandler(async (req: Request, res: Response) => {
    const incident = await reviewIncident(req.params.id, req.body.lessonsLearned || '');
    return sendSuccess(res, { incident });
  }),
);

export default router;
