import { z } from 'zod';

export const triageAssessSchema = z.object({
  symptoms: z.string().trim().min(5).max(1500),
  duration: z.string().trim().max(120).optional(),
  ageGroup: z.enum(['ADULT', 'CHILD', 'INFANT', 'UNSPECIFIED']).default('UNSPECIFIED'),
  language: z.string().trim().min(2).max(10).default('en'),
  context: z.string().trim().max(500).optional(),
});

export const triageIdParamsSchema = z.object({ id: z.string().min(1) });

export type TriageAssessInput = z.infer<typeof triageAssessSchema>;
