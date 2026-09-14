import { Schema, model, models, type InferSchemaType } from 'mongoose';

export const CONSENT_PURPOSE = {
  HEALTHCARE_SERVICE: 'HEALTHCARE_SERVICE',
  OPTIONAL_RESEARCH: 'OPTIONAL_RESEARCH',
  OPTIONAL_ANALYTICS: 'OPTIONAL_ANALYTICS',
  NOTIFICATIONS: 'NOTIFICATIONS',
} as const;

export const CONSENT_STATUS = {
  GRANTED: 'GRANTED',
  WITHDRAWN: 'WITHDRAWN',
  EXPIRED: 'EXPIRED',
} as const;

const consentSchema = new Schema(
  {
    consentId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    purpose: { type: String, enum: Object.values(CONSENT_PURPOSE), required: true },
    version: { type: String, required: true },
    status: { type: String, enum: Object.values(CONSENT_STATUS), default: 'GRANTED', index: true },
    givenAt: { type: Date, default: Date.now },
    withdrawnAt: { type: Date },
    withdrawnReason: { type: String },
    source: { type: String, enum: ['PWA', 'ADMIN', 'IMPORT'], default: 'PWA' },
    text: { type: String }, // notice text associated with this consent version
  },
  { timestamps: true },
);
consentSchema.index({ userId: 1, purpose: 1, status: 1 });

export type ConsentDoc = InferSchemaType<typeof consentSchema>;

export const Consent =
  model('Consent', consentSchema);
