import { Schema, model, models, type InferSchemaType } from 'mongoose';

export const PRIVACY_REQUEST_TYPE = {
  ACCESS: 'ACCESS',
  CORRECTION: 'CORRECTION',
  DELETION: 'DELETION',
  GRIEVANCE: 'GRIEVANCE',
} as const;

export const PRIVACY_REQUEST_STATUS = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
} as const;

const privacyRequestSchema = new Schema(
  {
    privacyRequestId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: Object.values(PRIVACY_REQUEST_TYPE), required: true },
    status: { type: String, enum: Object.values(PRIVACY_REQUEST_STATUS), default: 'SUBMITTED', index: true },
    describeData: { type: String, maxlength: 3000 },
    correctionDetails: { type: String, maxlength: 3000 },
    rationale: { type: String, maxlength: 3000 },
    notes: { type: String, maxlength: 3000 },
    reviewerUserId: { type: String },
    decidedAt: { type: Date },
    decisionNote: { type: String, maxlength: 3000 },
  },
  { timestamps: true },
);
privacyRequestSchema.index({ userId: 1, createdAt: -1 });

export type PrivacyRequestDoc = InferSchemaType<typeof privacyRequestSchema>;

export const PrivacyRequest =
  model('PrivacyRequest', privacyRequestSchema);
