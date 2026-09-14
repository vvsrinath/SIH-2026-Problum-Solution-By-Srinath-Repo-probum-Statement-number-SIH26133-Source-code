import { Router } from 'express';
import { create, list, complete } from './followups.controller';
import { requireAuth } from '../../middleware/authentication';
import { requirePermission } from '../../middleware/authorization';
import { validate } from '../../middleware/validation';
import { followUpCreateSchema, followUpIdParamsSchema } from './followups.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { authLimiter } from '../../middleware/rateLimit';
import { PERMISSION } from '../../constants/roles';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  requirePermission(PERMISSION.FOLLOWUP_CREATE),
  authLimiter,
  validate({ body: followUpCreateSchema }),
  asyncHandler(create),
);
router.get('/', requirePermission(PERMISSION.FOLLOWUP_READ_SELF), asyncHandler(list));
router.post(
  '/:id/complete',
  requirePermission(PERMISSION.FOLLOWUP_COMPLETE_SELF),
  validate({ params: followUpIdParamsSchema }),
  asyncHandler(complete),
);

export default router;
