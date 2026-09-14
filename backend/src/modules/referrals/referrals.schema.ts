import { z } from 'zod';

export const referralCreateSchema = z
  .object({
    patientUserId: z.string().min(1),
    toFacilityId: z.string().trim().min(1).optional(),
    toDoctorUserId: z.string().trim().min(1).optional(),
    reason: z.string().trim().max(3000).optional(),
    clinicalSummary: z.string().trim().max(3000).optional(),
  })
  .strict();

export const referralIdParamsSchema = z.object({ id: z.string().min(1) });
