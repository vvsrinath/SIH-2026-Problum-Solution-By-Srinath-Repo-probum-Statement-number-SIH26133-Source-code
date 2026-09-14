import { Router } from 'express';
import {
  getMyPatientProfile,
  patchMyPatientProfile,
  readSelfPermission,
  updateSelfPermission,
} from './patients.controller';
import { requireAuth } from '../../middleware/authentication';
import { validate } from '../../middleware/validation';
import { updatePatientSchema } from './patients.schema';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/me', requireAuth, readSelfPermission, asyncHandler(getMyPatientProfile));
router.patch('/me', requireAuth, updateSelfPermission, validate({ body: updatePatientSchema }), asyncHandler(patchMyPatientProfile));

export default router;
