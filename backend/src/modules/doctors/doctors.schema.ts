import { z } from 'zod';

export const listDoctorsSchema = z.object({
  specialization: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const doctorIdParamsSchema = z.object({ id: z.string().min(1) });

export type ListDoctorsQuery = z.infer<typeof listDoctorsSchema>;
