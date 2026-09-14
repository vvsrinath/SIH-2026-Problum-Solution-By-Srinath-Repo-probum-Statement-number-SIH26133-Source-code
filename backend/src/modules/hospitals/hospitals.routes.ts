import { Router } from 'express';
import { nearby } from './hospitals.controller';
import { requireAuth, requireRole } from '../../middleware/authentication';
import { validate } from '../../middleware/validation';
import { ROLE } from '../../constants/roles';
import { nearbyHospitalsQuerySchema } from '../../integrations/maps/types';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/nearby', requireAuth, requireRole(ROLE.PATIENT), validate({ query: nearbyHospitalsQuerySchema }), asyncHandler(nearby));

export default router;
