import { Router } from 'express';
import { create, list, accept } from './referrals.controller';
import { requireAuth } from '../../middleware/authentication';
import { requirePermission } from '../../middleware/authorization';
import { validate } from '../../middleware/validation';
import { referralCreateSchema, referralIdParamsSchema } from './referrals.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { authLimiter } from '../../middleware/rateLimit';
import { PERMISSION } from '../../constants/roles';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  requirePermission(PERMISSION.REFERRAL_CREATE),
  authLimiter,
  validate({ body: referralCreateSchema }),
  asyncHandler(create),
);
router.get('/', requirePermission(PERMISSION.REFERRAL_READ_SELF), asyncHandler(list));
router.post(
  '/:id/accept',
  requirePermission(PERMISSION.REFERRAL_CREATE),
  validate({ params: referralIdParamsSchema }),
  asyncHandler(accept),
);

export default router;
