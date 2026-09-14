import { Router } from 'express';
import {
  createAppointment,
  listAppointments,
  getAppointmentById,
  cancelAppointment,
  confirmAppointment,
  startAppointment,
  completeAppointment,
} from './appointments.controller';
import { requireAuth, requireRole } from '../../middleware/authentication';
import { validate } from '../../middleware/validation';
import { createAppointmentSchema, appointmentIdParamsSchema, listAppointmentsSchema, cancelAppointmentSchema } from './appointments.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { appointmentLimiter } from '../../middleware/rateLimit';
import { idempotent } from '../../middleware/idempotency';
import { ROLE } from '../../constants/roles';

const router = Router();

router.post('/', requireAuth, requireRole(ROLE.PATIENT), appointmentLimiter, idempotent(), validate({ body: createAppointmentSchema }), asyncHandler(createAppointment));
router.get('/', requireAuth, validate({ query: listAppointmentsSchema }), asyncHandler(listAppointments));
router.get('/:id', requireAuth, validate({ params: appointmentIdParamsSchema }), asyncHandler(getAppointmentById));
router.post('/:id/cancel', requireAuth, validate({ params: appointmentIdParamsSchema, body: cancelAppointmentSchema }), asyncHandler(cancelAppointment));
router.post('/:id/confirm', requireAuth, requireRole(ROLE.DOCTOR), validate({ params: appointmentIdParamsSchema }), asyncHandler(confirmAppointment));
router.post('/:id/start', requireAuth, requireRole(ROLE.DOCTOR), validate({ params: appointmentIdParamsSchema }), asyncHandler(startAppointment));
router.post('/:id/complete', requireAuth, requireRole(ROLE.DOCTOR), validate({ params: appointmentIdParamsSchema }), asyncHandler(completeAppointment));

export default router;
