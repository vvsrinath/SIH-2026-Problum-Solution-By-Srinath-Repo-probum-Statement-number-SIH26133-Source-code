import { Schema, model, models, type InferSchemaType } from 'mongoose';

export const APPOINTMENT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  BOOKED: 'BOOKED',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export const CONSULTATION_TYPE = {
  IN_PERSON: 'IN_PERSON',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
} as const;

const appointmentSchema = new Schema(
  {
    appointmentId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true, index: true },
    facilityId: { type: String, index: true },
    scheduledAt: { type: Date, required: true, index: true }, // UTC
    durationMinutes: { type: Number, required: true },
    consultationType: {
      type: String,
      enum: Object.values(CONSULTATION_TYPE),
      required: true,
      default: CONSULTATION_TYPE.IN_PERSON,
    },
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: APPOINTMENT_STATUS.BOOKED,
      index: true,
    },
    consultationId: { type: String },
    reason: { type: String, maxlength: 2000 },
    cancelledBy: { type: String },
    cancelledReason: { type: String },
    cancelledAt: { type: Date },
    bookedByUserId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

appointmentSchema.index({ doctorId: 1, scheduledAt: 1 });
appointmentSchema.index({ patientId: 1, scheduledAt: 1 });
appointmentSchema.index({ patientId: 1, status: 1 });

export type AppointmentDoc = InferSchemaType<typeof appointmentSchema>;

export const Appointment =
  model('Appointment', appointmentSchema);
