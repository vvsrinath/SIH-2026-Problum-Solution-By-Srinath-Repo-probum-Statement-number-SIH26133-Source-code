import { Router } from 'express';
import { startConsultation, getConsultation, endConsultation } from './consultations.controller';
import { requireAuth, requireRole } from '../../middleware/authentication';
import { ROLE } from '../../constants/roles';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.post('/:appointmentId/start', requireAuth, requireRole(ROLE.PATIENT, ROLE.DOCTOR), asyncHandler(startConsultation));
router.get('/:id', requireAuth, asyncHandler(getConsultation));
router.post('/:id/end', requireAuth, requireRole(ROLE.PATIENT, ROLE.DOCTOR), asyncHandler(endConsultation));

export default router;
