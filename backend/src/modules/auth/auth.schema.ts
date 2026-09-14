import { z } from 'zod';

export const mockLoginSchema = z.object({
  role: z.enum(['PATIENT', 'DOCTOR', 'HEALTH_WORKER', 'ADMIN']).default('PATIENT'),
  doctorVariant: z.enum(['PRIMARY', 'SECONDARY']).optional(),
});

export const callbackQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});

export type MockLoginInput = z.infer<typeof mockLoginSchema>;
export type CallbackQuery = z.infer<typeof callbackQuerySchema>;
