import { Router } from 'express';
import { getMyHealthWorkerProfile } from './healthWorkers.controller';
import { requireAuth, requireRole } from '../../middleware/authentication';
import { ROLE } from '../../constants/roles';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/me', requireAuth, requireRole(ROLE.HEALTH_WORKER), asyncHandler(getMyHealthWorkerProfile));

export default router;
