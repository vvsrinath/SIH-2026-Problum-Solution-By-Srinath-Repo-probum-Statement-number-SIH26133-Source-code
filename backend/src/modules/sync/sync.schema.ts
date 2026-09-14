import { z } from 'zod';

export const syncActionSchema = z.object({
  id: z.string().min(1).max(128),
  type: z.string().min(1).max(64),
  entity: z.string().min(1).max(64),
  idempotencyKey: z.string().min(1).max(128).optional(),
  payload: z.unknown().optional(),
});

export const syncActionsBodySchema = z.object({
  actions: z.array(syncActionSchema).max(200),
});
