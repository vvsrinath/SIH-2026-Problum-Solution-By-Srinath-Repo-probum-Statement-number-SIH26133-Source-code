import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * Structured AI triage assessment. We store only the necessary structured
 * result (risk level, conditions, actions) — NOT raw symptom conversation.
 * Raw symptom text is deliberately not retained by default.
 */
const triageAssessmentSchema = new Schema(
  {
    triageId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    language: { type: String, default: 'en' },
    ageGroup: { type: String, enum: ['ADULT', 'CHILD', 'INFANT', 'UNSPECIFIED'], default: 'UNSPECIFIED' },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MODERATE', 'HIGH', 'URGENT', 'UNKNOWN'],
      index: true,
    },
    possibleConditions: { type: [String], default: [] },
    missingInformation: { type: [String], default: [] },
    recommendedAction: { type: String },
    modelVersion: { type: String },
    disclaimer: { type: String },
    source: { type: String, enum: ['AI', 'MANUAL_FALLBACK'], default: 'AI' },
    rawSymptomsStored: { type: Boolean, default: false },
  },
  { timestamps: true },
);
triageAssessmentSchema.index({ patientId: 1, createdAt: -1 });

export type TriageAssessmentDoc = InferSchemaType<typeof triageAssessmentSchema>;

export const TriageAssessment =
  model('TriageAssessment', triageAssessmentSchema);
