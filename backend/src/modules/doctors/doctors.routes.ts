import { Router } from 'express';
import { handleListDoctors, handleGetDoctor, handleGetDoctorAvailability } from './doctors.controller';
import { requireAuth } from '../../middleware/authentication';
import { validate } from '../../middleware/validation';
import { listDoctorsSchema, doctorIdParamsSchema } from './doctors.schema';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Public-safe directory search — requires an authenticated session (any role).
router.get('/', requireAuth, validate({ query: listDoctorsSchema }), asyncHandler(handleListDoctors));
router.get('/:id', requireAuth, validate({ params: doctorIdParamsSchema }), asyncHandler(handleGetDoctor));
router.get('/:id/availability', requireAuth, validate({ params: doctorIdParamsSchema }), asyncHandler(handleGetDoctorAvailability));

export default router;
