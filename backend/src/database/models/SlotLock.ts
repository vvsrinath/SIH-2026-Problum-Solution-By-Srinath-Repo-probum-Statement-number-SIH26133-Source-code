import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * A digital "slot lock" used to enforce double-booking protection atomically.
 *
 * When a slot is reserved we insert a SlotLock document; the unique index on
 * `(doctorId, scheduledAt)` guarantees that two concurrent booking attempts
 * for the same doctor+time cannot both succeed — exactly one insert wins.
 *
 * The lock is created inside the same transaction as the Appointment so the
 * pair is atomic, and removed when an appointment leaves a slot-holding
 * status (CANCELLED / COMPLETED / NO_SHOW).
 */
const slotLockSchema = new Schema(
  {
    doctorId: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    appointmentId: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ['HELD', 'RELEASED'], default: 'HELD' },
    releasedAt: { type: Date },
  },
  { timestamps: true },
);

slotLockSchema.index({ doctorId: 1, scheduledAt: 1 }, { unique: true });
slotLockSchema.index({ doctorId: 1, scheduledAt: 1, status: 1 });

export type SlotLockDoc = InferSchemaType<typeof slotLockSchema>;

export const SlotLock =
  model('SlotLock', slotLockSchema);
