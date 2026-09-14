import { z } from 'zod';
import { PRIVACY_REQUEST_TYPE, PRIVACY_REQUEST_STATUS } from '../../database/models/PrivacyRequest';

export const privacyRequestCreateSchema = z
  .object({
    type: z.enum(Object.values(PRIVACY_REQUEST_TYPE) as [string, ...string[]]),
    describeData: z.string().trim().max(3000).optional(),
    correctionDetails: z.string().trim().max(3000).optional(),
    rationale: z.string().trim().max(3000).optional(),
  })
  .strict();

export const privacyRequestIdParamsSchema = z.object({ id: z.string().min(1) });

export const privacyDecisionSchema = z
  .object({
    status: z.enum(['APPROVED', 'REJECTED'] as [string, ...string[]]),
    decisionNote: z.string().trim().max(3000).optional(),
  })
  .strict();
