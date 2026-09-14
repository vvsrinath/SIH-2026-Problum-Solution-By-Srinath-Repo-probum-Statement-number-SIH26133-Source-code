import { Schema, model, models, type InferSchemaType } from 'mongoose';

const followUpSchema = new Schema(
  {
    followUpId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true, index: true },
    appointmentId: { type: String, index: true },
    scheduledAt: { type: Date, index: true },
    reason: { type: String, maxlength: 2000 },
    instructions: { type: String, maxlength: 2000 },
    status: {
      type: String,
      enum: ['PENDING', 'SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    createdByUserId: { type: String },
    createdByRole: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true },
);
followUpSchema.index({ patientId: 1, status: 1 });

export type FollowUpDoc = InferSchemaType<typeof followUpSchema>;

export const FollowUp =
  model('FollowUp', followUpSchema);
