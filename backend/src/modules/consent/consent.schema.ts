import { z } from 'zod';
import { CONSENT_PURPOSE, CONSENT_STATUS } from '../../database/models/Consent';

export const consentGiveSchema = z
  .object({
    purpose: z.enum(Object.values(CONSENT_PURPOSE) as [string, ...string[]]),
    version: z.string().trim().min(1).max(40),
    text: z.string().trim().max(5000).optional(),
  })
  .strict();

export const consentIdParamsSchema = z.object({ id: z.string().min(1) });

export const CONSENT_STATUS_VALUES = Object.values(CONSENT_STATUS) as [string, ...string[]];
