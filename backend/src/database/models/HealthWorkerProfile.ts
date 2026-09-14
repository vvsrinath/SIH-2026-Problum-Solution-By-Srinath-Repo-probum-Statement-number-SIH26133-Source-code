import { Schema, model, models, type InferSchemaType } from 'mongoose';

const healthWorkerProfileSchema = new Schema(
  {
    healthWorkerId: { type: String, required: true, unique: true, index: true },
    internalUserId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, trim: true, maxlength: 120 },
    designation: { type: String, trim: true, maxlength: 120 },
    facilityId: { type: String, index: true },
    facilityName: { type: String, trim: true, maxlength: 160 },
    assignedRegion: { type: String, trim: true, maxlength: 160 },
    active: { type: Boolean, default: true },
    languages: { type: [String], default: ['en'] },
  },
  { timestamps: true },
);

export type HealthWorkerProfileDoc = InferSchemaType<typeof healthWorkerProfileSchema>;

export const HealthWorkerProfile =
  model('HealthWorkerProfile', healthWorkerProfileSchema);
