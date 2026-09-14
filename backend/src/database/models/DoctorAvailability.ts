import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * Recurring weekly availability plus exceptions/blocked slots.
 * All times stored as minutes-since-midnight in the doctor's timezone,
 * with an explicit IANA timezone string so we never assume the server tz.
 */
const availabilitySchema = new Schema(
  {
    doctorId: { type: String, required: true, index: true },
    dayOfWeek: { type: Number, min: 0, max: 6, required: true }, // 0=Sunday
    startMinute: { type: Number, min: 0, max: 1439, required: true },
    endMinute: { type: Number, min: 1, max: 1440, required: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    active: { type: Boolean, default: true },
    consultationDurationMinutes: { type: Number, default: 15, min: 5, max: 120 },
  },
  { timestamps: true },
);

availabilitySchema.index({ doctorId: 1, dayOfWeek: 1, startMinute: 1 });

/** One-off exceptions: a date that is unavailable or specially available. */
const availabilityExceptionSchema = new Schema({
  doctorId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  reason: { type: String, enum: ['BLOCKED', 'HOLIDAY', 'SPECIAL_OPEN'], default: 'BLOCKED' },
  startMinute: { type: Number },
  endMinute: { type: Number },
});
availabilityExceptionSchema.index({ doctorId: 1, date: 1 }, { unique: true });

export type DoctorAvailabilityDoc = InferSchemaType<typeof availabilitySchema>;
export type AvailabilityExceptionDoc = InferSchemaType<typeof availabilityExceptionSchema>;

export const DoctorAvailability =
  model('DoctorAvailability', availabilitySchema);

export const AvailabilityException =
  model('AvailabilityException', availabilityExceptionSchema);
