import { z } from 'zod';

export const createAppointmentSchema = z.object({
  doctorId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  consultationType: z.enum(['IN_PERSON', 'VIDEO', 'AUDIO']).default('IN_PERSON'),
  reason: z.string().trim().max(2000).optional(),
});

export const appointmentIdParamsSchema = z.object({ id: z.string().min(1) });

export const listAppointmentsSchema = z.object({
  status: z.enum(['BOOKED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
