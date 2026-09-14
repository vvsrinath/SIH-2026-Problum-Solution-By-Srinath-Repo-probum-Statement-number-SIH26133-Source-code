import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../../middleware/authentication';
import { requirePermission } from '../../middleware/authorization';
import { validate } from '../../middleware/validation';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { AuthError } from '../../utils/errors';
import {
  registerKey,
  getActiveKey,
  getActiveKeys,
  revokeKey,
  getKeyHistory,
} from '../../services/keyManagement.service';
import { PERMISSION } from '../../constants/roles';
import { z } from 'zod';

const router = Router();
router.use(requireAuth);

const registerKeySchema = z
  .object({
    publicKey: z.string().min(1),
    algorithm: z.string().default('ECDH-P256'),
    fingerprint: z.string().optional(),
  })
  .strict();

const revokeKeySchema = z
  .object({
    reason: z.string().min(1).max(500),
  })
  .strict();

const userIdParamsSchema = z.object({ userId: z.string().min(1) });

/**
 * POST /keys — Register a new public key
 */
router.post(
  '/',
  requirePermission(PERMISSION.PROFILE_UPDATE_SELF),
  validate({ body: registerKeySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw new AuthError();

    const key = await registerKey({
      userId: req.auth.internalUserId,
      publicKey: req.body.publicKey,
      algorithm: req.body.algorithm,
      fingerprint: req.body.fingerprint,
    });

    return sendSuccess(res, { keyId: key.keyId, status: key.status }, 201);
  }),
);

/**
 * GET /keys/me — Get my active public key
 */
router.get(
  '/me',
  requirePermission(PERMISSION.PROFILE_READ_SELF),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw new AuthError();
    const key = await getActiveKey(req.auth.internalUserId);
    return sendSuccess(res, { key });
  }),
);

/**
 * GET /keys/:userId — Get another user's active public key
 */
router.get(
  '/:userId',
  requirePermission(PERMISSION.PROFILE_READ_SELF),
  validate({ params: userIdParamsSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const key = await getActiveKey(req.params.userId);
    return sendSuccess(res, { key });
  }),
);

/**
 * POST /keys/batch — Get active keys for multiple users
 */
router.post(
  '/batch',
  requirePermission(PERMISSION.PROFILE_READ_SELF),
  asyncHandler(async (req: Request, res: Response) => {
    const userIds = (req.body as { userIds?: string[] }).userIds || [];
    const keys = await getActiveKeys(userIds);
    const result: Record<string, { publicKey: string; keyId: string }> = {};
    keys.forEach((val, key) => {
      result[key] = val;
    });
    return sendSuccess(res, { keys: result });
  }),
);

/**
 * POST /keys/:keyId/revoke — Revoke a key
 */
router.post(
  '/:keyId/revoke',
  requirePermission(PERMISSION.PROFILE_UPDATE_SELF),
  validate({ body: revokeKeySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw new AuthError();
    const revoked = await revokeKey(req.params.keyId, req.auth.internalUserId, req.body.reason);
    return sendSuccess(res, { revoked });
  }),
);

/**
 * GET /keys/history — Get key history
 */
router.get(
  '/history/all',
  requirePermission(PERMISSION.PROFILE_READ_SELF),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw new AuthError();
    const history = await getKeyHistory(req.auth.internalUserId);
    return sendSuccess(res, { history });
  }),
);

export default router;
