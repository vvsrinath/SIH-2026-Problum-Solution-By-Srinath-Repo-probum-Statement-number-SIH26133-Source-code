import { Router } from 'express';
import {
  listMyAvailability,
  upsertAvailability,
  removeAvailability,
  setException,
  ensureDoctorRole,
} from './availability.controller';
import { requireAuth } from '../../middleware/authentication';
import { validate } from '../../middleware/validation';
import { upsertAvailabilitySchema, setExceptionSchema, availabilityIdParamsSchema } from './availability.schema';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', requireAuth, ensureDoctorRole, asyncHandler(listMyAvailability));
router.post('/', requireAuth, ensureDoctorRole, validate({ body: upsertAvailabilitySchema }), asyncHandler(upsertAvailability));
router.delete('/:id', requireAuth, ensureDoctorRole, validate({ params: availabilityIdParamsSchema }), asyncHandler(removeAvailability));
router.post('/exceptions', requireAuth, ensureDoctorRole, validate({ body: setExceptionSchema }), asyncHandler(setException));

export default router;
