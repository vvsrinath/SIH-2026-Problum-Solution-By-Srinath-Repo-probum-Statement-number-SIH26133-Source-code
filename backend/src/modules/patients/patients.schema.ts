import { z } from 'zod';

export const updatePatientSchema = z
  .object({
    displayName: z.string().trim().min(1).max(120).optional(),
    dateOfBirth: z.string().datetime().optional(),
    sex: z.enum(['M', 'F', 'OTHER', 'UNSPECIFIED']).optional(),
    preferredLanguage: z.string().trim().min(2).max(10).optional(),
    preferredConsultationMode: z.enum(['IN_PERSON', 'VIDEO', 'AUDIO']).optional(),
    accessibilityPreferences: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
    emergencyContactName: z.string().trim().max(120).optional(),
    emergencyContactPhone: z.string().trim().max(20).optional(),
    addressRegion: z.string().trim().max(120).optional(),
    addressDistrict: z.string().trim().max(120).optional(),
  })
  .strict();

export const patientIdParamsSchema = z.object({ id: z.string().min(1) });

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
