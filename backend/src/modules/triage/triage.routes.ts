import { Router } from 'express';
import { assess, getTriage } from './triage.controller';
import { requireAuth, requireRole } from '../../middleware/authentication';
import { validate } from '../../middleware/validation';
import { triageAssessSchema, triageIdParamsSchema } from './triage.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { aiLimiter } from '../../middleware/rateLimit';
import { ROLE } from '../../constants/roles';

const router = Router();

router.post('/assess', requireAuth, requireRole(ROLE.PATIENT), aiLimiter, validate({ body: triageAssessSchema }), asyncHandler(assess));
router.get('/:id', requireAuth, requireRole(ROLE.PATIENT), validate({ params: triageIdParamsSchema }), asyncHandler(getTriage));

export default router;
