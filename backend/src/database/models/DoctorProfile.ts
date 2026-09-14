import { Schema, model, models, type InferSchemaType } from 'mongoose';

const doctorProfileSchema = new Schema(
  {
    doctorId: { type: String, required: true, unique: true, index: true },
    internalUserId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, trim: true, maxlength: 120 },
    specialization: { type: String, trim: true, maxlength: 160 },
    qualifications: { type: [String], default: [] },
    facilityId: { type: String, index: true },
    facilityName: { type: String, trim: true, maxlength: 160 },
    verificationStatus: {
      type: String,
      enum: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'],
      default: 'UNVERIFIED',
    },
    verificationMetadata: {
      // only minimal verification metadata, never full credential scans
      verifiedById: { type: String },
      verifiedAt: { type: Date },
    },
    consultationModes: {
      type: [String],
      enum: ['IN_PERSON', 'VIDEO', 'AUDIO'],
      default: ['IN_PERSON'],
    },
    consultationFee: { type: Number },
    languages: { type: [String], default: ['en'] },
    experienceYears: { type: Number },
    bio: { type: String, maxlength: 1000 },
  },
  { timestamps: true },
);

export type DoctorProfileDoc = InferSchemaType<typeof doctorProfileSchema>;

export const DoctorProfile =
  model('DoctorProfile', doctorProfileSchema);
