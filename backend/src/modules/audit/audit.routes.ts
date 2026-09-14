import { Router } from 'express';
import { list } from './audit.controller';
import { requireAuth } from '../../middleware/authentication';
import { requirePermission } from '../../middleware/authorization';
import { validate } from '../../middleware/validation';
import { auditListQuerySchema } from './audit.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { PERMISSION } from '../../constants/roles';

const router = Router();

router.get(
  '/',
  requireAuth,
  requirePermission(PERMISSION.ADMIN_AUDIT),
  validate({ query: auditListQuerySchema }),
  asyncHandler(list),
);

export default router;
