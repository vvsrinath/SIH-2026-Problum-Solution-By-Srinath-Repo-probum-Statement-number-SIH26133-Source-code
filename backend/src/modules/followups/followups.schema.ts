import { z } from 'zod';

export const followUpCreateSchema = z
  .object({
    patientUserId: z.string().min(1),
    appointmentId: z.string().trim().min(1).optional(),
    scheduledAt: z.string().datetime().optional(),
    reason: z.string().trim().max(2000).optional(),
    instructions: z.string().trim().max(2000).optional(),
  })
  .strict();

export const followUpIdParamsSchema = z.object({ id: z.string().min(1) });
