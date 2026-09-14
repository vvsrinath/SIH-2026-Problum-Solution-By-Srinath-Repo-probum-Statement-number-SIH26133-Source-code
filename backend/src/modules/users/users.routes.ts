import { Router } from 'express';
import { getMe, patchMe, requireSelfUpdatePermission } from './users.controller';
import { requireAuth } from '../../middleware/authentication';
import { validate } from '../../middleware/validation';
import { updateSelfSchema } from './users.schema';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/me', requireAuth, asyncHandler(getMe));
router.patch('/me', requireAuth, requireSelfUpdatePermission, validate({ body: updateSelfSchema }), asyncHandler(patchMe));

export default router;
