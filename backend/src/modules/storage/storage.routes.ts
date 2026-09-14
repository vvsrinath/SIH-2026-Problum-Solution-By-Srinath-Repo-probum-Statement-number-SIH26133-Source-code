import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../../middleware/authentication';
import { requirePermission } from '../../middleware/authorization';
import { validate } from '../../middleware/validation';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { AuthError, NotFoundError } from '../../utils/errors';
import { createGovDriveAdapter } from '../../integrations/govdrive/govdrive.provider';
import { PatientProfile } from '../../database/models/PatientProfile';
import { DoctorProfile } from '../../database/models/DoctorProfile';
import { recordAudit } from '../../services/audit.service';
import { PERMISSION } from '../../constants/roles';
import { z } from 'zod';

const router = Router();
router.use(requireAuth);

const uploadSchema = z
  .object({
    context: z.string().min(1).max(200),
    filename: z.string().min(1).max(255),
    mime: z.string().min(1).max(100),
    ciphertext: z.string().min(1),
    nonce: z.string().min(1),
  })
  .strict();

const refParamsSchema = z.object({ refId: z.string().min(1) });

/**
 * POST /storage/upload — Upload encrypted document to GovDrive
 */
router.post(
  '/upload',
  requirePermission(PERMISSION.PROFILE_UPDATE_SELF),
  validate({ body: uploadSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw new AuthError();

    const ownerId = await getOwnerId(req.auth.internalUserId, req.auth.role);
    const adapter = createGovDriveAdapter();

    const result = await adapter.put({
      ownerId,
      context: req.body.context,
      filename: req.body.filename,
      mime: req.body.mime,
      ciphertext: Buffer.from(req.body.ciphertext, 'base64'),
      nonce: req.body.nonce,
    });

    await recordAudit({
      actorUserId: req.auth.internalUserId,
      action: 'STORAGE.UPLOAD',
      resourceType: 'document',
      resourceId: result.refId,
      result: 'SUCCESS',
      requestId: req.requestId,
      details: { context: req.body.context, filename: req.body.filename, mime: req.body.mime },
    });

    return sendSuccess(res, { refId: result.refId }, 201);
  }),
);

/**
 * GET /storage/:refId — Download encrypted document from GovDrive
 */
router.get(
  '/:refId',
  requirePermission(PERMISSION.PROFILE_READ_SELF),
  validate({ params: refParamsSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw new AuthError();

    const ownerId = await getOwnerId(req.auth.internalUserId, req.auth.role);
    const adapter = createGovDriveAdapter();

    const doc = await adapter.get(ownerId, req.params.refId);

    await recordAudit({
      actorUserId: req.auth.internalUserId,
      action: 'STORAGE.DOWNLOAD',
      resourceType: 'document',
      resourceId: req.params.refId,
      result: 'SUCCESS',
      requestId: req.requestId,
    });

    return sendSuccess(res, {
      refId: req.params.refId,
      ciphertext: doc.ciphertext.toString('base64'),
      mime: doc.mime,
      nonce: doc.nonce,
    });
  }),
);

/**
 * DELETE /storage/:refId — Delete encrypted document from GovDrive
 */
router.delete(
  '/:refId',
  requirePermission(PERMISSION.PROFILE_UPDATE_SELF),
  validate({ params: refParamsSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw new AuthError();

    const ownerId = await getOwnerId(req.auth.internalUserId, req.auth.role);
    const adapter = createGovDriveAdapter();

    await adapter.delete(ownerId, req.params.refId);

    await recordAudit({
      actorUserId: req.auth.internalUserId,
      action: 'STORAGE.DELETE',
      resourceType: 'document',
      resourceId: req.params.refId,
      result: 'SUCCESS',
      requestId: req.requestId,
    });

    return sendSuccess(res, { deleted: true });
  }),
);

/**
 * GET /storage — List all encrypted documents for the user
 */
router.get(
  '/',
  requirePermission(PERMISSION.PROFILE_READ_SELF),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw new AuthError();

    const ownerId = await getOwnerId(req.auth.internalUserId, req.auth.role);
    const adapter = createGovDriveAdapter();

    const files = await adapter.list(ownerId);

    return sendSuccess(res, { files });
  }),
);

async function getOwnerId(internalUserId: string, role: string): Promise<string> {
  if (role === 'PATIENT') {
    const profile = await PatientProfile.findOne({ internalUserId }).lean();
    return profile?.patientId || internalUserId;
  }
  if (role === 'DOCTOR') {
    const profile = await DoctorProfile.findOne({ internalUserId }).lean();
    return profile?.doctorId || internalUserId;
  }
  return internalUserId;
}

export default router;
