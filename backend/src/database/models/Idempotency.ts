import mongoose from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const { Schema, model, models } = mongoose;

/**
 * Idempotency record — used to make offline-replay operations safe.
 * A client-provided Idempotency-Key maps to the server result so a duplicate
 * submission (e.g. after a network blip) never mutates state twice.
 */
const idempotencySchema = new Schema(
  {
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    requestHash: { type: String, required: true },
    statusCode: { type: Number, required: true },
    responseBody: { type: Schema.Types.Mixed, default: undefined },
    createdAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

export type IdempotencyDoc = InferSchemaType<typeof idempotencySchema>;

export const Idempotency = models.Idempotency || model('Idempotency', idempotencySchema);
