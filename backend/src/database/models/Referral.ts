import { Schema, model, models, type InferSchemaType } from 'mongoose';

const referralSchema = new Schema(
  {
    referralId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    fromDoctorId: { type: String, required: true, index: true },
    toFacilityId: { type: String, index: true },
    toDoctorId: { type: String, index: true },
    reason: { type: String, maxlength: 3000 },
    clinicalSummary: { type: String, maxlength: 3000 },
    status: {
      type: String,
      enum: ['CREATED', 'SENT', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'CREATED',
      index: true,
    },
    createdByUserId: { type: String },
    acceptedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);
referralSchema.index({ patientId: 1, status: 1 });

export type ReferralDoc = InferSchemaType<typeof referralSchema>;

export const Referral =
  model('Referral', referralSchema);
