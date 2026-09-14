import { Router } from 'express';
import { submitActions, getSyncState } from './sync.controller';
import { requireAuth } from '../../middleware/authentication';
import { validate } from '../../middleware/validation';
import { syncActionsBodySchema } from './sync.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { authLimiter } from '../../middleware/rateLimit';

const router = Router();

router.use(requireAuth);

router.post('/actions', authLimiter, validate({ body: syncActionsBodySchema }), asyncHandler(submitActions));
router.get('/state', asyncHandler(getSyncState));

export default router;
