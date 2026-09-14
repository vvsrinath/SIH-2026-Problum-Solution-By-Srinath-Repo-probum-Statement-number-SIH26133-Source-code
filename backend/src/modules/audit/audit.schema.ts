import { z } from 'zod';

export const auditListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  actorUserId: z.string().trim().optional(),
  action: z.string().trim().optional(),
  result: z.enum(['SUCCESS', 'FAILURE', 'DENIED']).optional(),
});
