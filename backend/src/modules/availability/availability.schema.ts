import { z } from 'zod';

export const upsertAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
  timezone: z.string().default('Asia/Kolkata'),
  active: z.boolean().default(true),
  consultationDurationMinutes: z.number().int().min(5).max(120).default(15),
});

export const setExceptionSchema = z.object({
  date: z.string().datetime(),
  reason: z.enum(['BLOCKED', 'HOLIDAY', 'SPECIAL_OPEN']).default('BLOCKED'),
  startMinute: z.number().int().min(0).max(1439).optional(),
  endMinute: z.number().int().min(1).max(1440).optional(),
});

export const availabilityIdParamsSchema = z.object({ id: z.string().min(1) });

export type UpsertAvailabilityInput = z.infer<typeof upsertAvailabilitySchema>;
export type SetExceptionInput = z.infer<typeof setExceptionSchema>;
