import mongoose from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const { Schema, model, models } = mongoose;

/**
 * Sync state — minimal per-user sync metadata exposed to clients for the
 * offline sync manager (per-entity last-synced watermark). Stores no sensitive
 * data, only an "as of" timestamp per collection.
 */
const syncStateSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    entity: { type: String, required: true },
    lastSyncedAt: { type: Date, default: Date.now },
    lastSyncCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

syncStateSchema.index({ userId: 1, entity: 1 }, { unique: true });

export type SyncStateDoc = InferSchemaType<typeof syncStateSchema>;

export const SyncState = models.SyncState || model('SyncState', syncStateSchema);
