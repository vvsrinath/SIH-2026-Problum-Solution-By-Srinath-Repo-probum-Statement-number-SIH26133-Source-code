import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * Minimal patient application profile. We deliberately avoid collecting
 * sensitive identity data unless legitimately required for the service.
 */
const patientProfileSchema = new Schema(
  {
    patientId: { type: String, required: true, unique: true, index: true },
    internalUserId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, trim: true, maxlength: 120 },
    dateOfBirth: { type: Date },
    sex: { type: String, enum: ['M', 'F', 'OTHER', 'UNSPECIFIED'], default: 'UNSPECIFIED' },
    preferredLanguage: { type: String, default: 'en' },
    preferredConsultationMode: {
      type: String,
      enum: ['IN_PERSON', 'VIDEO', 'AUDIO'],
      default: 'IN_PERSON',
    },
    accessibilityPreferences: { type: [String], default: [] },
    emergencyContactName: { type: String, trim: true, maxlength: 120 },
    emergencyContactPhone: { type: String, trim: true, maxlength: 20 },
    addressRegion: { type: String, trim: true, maxlength: 120 },
    addressDistrict: { type: String, trim: true, maxlength: 120 },
    privacyPreferences: {
      shareAnonymizedForResearch: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

export type PatientProfileDoc = InferSchemaType<typeof patientProfileSchema>;

export const PatientProfile =
  model('PatientProfile', patientProfileSchema);
