import { Schema, model, models, type InferSchemaType } from 'mongoose';

const consultationSchema = new Schema(
  {
    consultationId: { type: String, required: true, unique: true, index: true },
    appointmentId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true, index: true },
    provider: { type: String, enum: ['BHARATVC', 'IN_PERSON'], required: true },
    providerReference: { type: String },
    status: {
      type: String,
      enum: ['SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED'],
      default: 'SCHEDULED',
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true },
);

export type ConsultationDoc = InferSchemaType<typeof consultationSchema>;

export const Consultation =
  model('Consultation', consultationSchema);
