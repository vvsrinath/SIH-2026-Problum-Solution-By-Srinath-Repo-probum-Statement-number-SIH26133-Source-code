import { Router } from 'express';
import { submit, list, get, decide, exportData, exportFullData, eraseData } from './privacy.controller';
import { requireAuth } from '../../middleware/authentication';
import { requirePermission } from '../../middleware/authorization';
import { validate } from '../../middleware/validation';
import { privacyRequestCreateSchema, privacyRequestIdParamsSchema, privacyDecisionSchema } from './privacy.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { authLimiter } from '../../middleware/rateLimit';
import { PERMISSION } from '../../constants/roles';

const router = Router();

router.use(requireAuth);

router.post(
  '/requests',
  requirePermission(PERMISSION.PRIVACY_MANAGE_SELF),
  authLimiter,
  validate({ body: privacyRequestCreateSchema }),
  asyncHandler(submit),
);
router.get('/requests', requirePermission(PERMISSION.PRIVACY_MANAGE_SELF), asyncHandler(list));
router.get(
  '/requests/:id',
  requirePermission(PERMISSION.PRIVACY_MANAGE_SELF),
  validate({ params: privacyRequestIdParamsSchema }),
  asyncHandler(get),
);
router.patch(
  '/requests/:id/decide',
  requirePermission(PERMISSION.ADMIN_SYSTEM),
  validate({ params: privacyRequestIdParamsSchema, body: privacyDecisionSchema }),
  asyncHandler(decide),
);
router.post('/export', requirePermission(PERMISSION.PRIVACY_MANAGE_SELF), authLimiter, asyncHandler(exportData));
router.post('/export/full', requirePermission(PERMISSION.PRIVACY_MANAGE_SELF), authLimiter, asyncHandler(exportFullData));
router.post('/erase', requirePermission(PERMISSION.PRIVACY_MANAGE_SELF), authLimiter, asyncHandler(eraseData));

export default router;
