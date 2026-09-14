import { Router } from 'express';
import { grant, list, withdraw, summary, check } from './consent.controller';
import { requireAuth } from '../../middleware/authentication';
import { requirePermission } from '../../middleware/authorization';
import { validate } from '../../middleware/validation';
import { consentGiveSchema, consentIdParamsSchema } from './consent.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { authLimiter } from '../../middleware/rateLimit';
import { PERMISSION } from '../../constants/roles';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  requirePermission(PERMISSION.CONSENT_MANAGE_SELF),
  authLimiter,
  validate({ body: consentGiveSchema }),
  asyncHandler(grant),
);
router.get('/', requirePermission(PERMISSION.CONSENT_MANAGE_SELF), asyncHandler(list));
router.get('/summary', requirePermission(PERMISSION.CONSENT_MANAGE_SELF), asyncHandler(summary));
router.get('/check', requirePermission(PERMISSION.CONSENT_MANAGE_SELF), asyncHandler(check));
router.post(
  '/:id/withdraw',
  requirePermission(PERMISSION.CONSENT_MANAGE_SELF),
  validate({ params: consentIdParamsSchema }),
  asyncHandler(withdraw),
);

export default router;
