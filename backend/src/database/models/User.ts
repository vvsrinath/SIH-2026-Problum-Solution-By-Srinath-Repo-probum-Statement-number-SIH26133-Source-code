import { Schema, model, models, type InferSchemaType } from 'mongoose';
import { ROLE, type Role } from '../../constants/roles';

/**
 * The User is a minimal identity record.
 * - `internalUserId` is the immutable identifier returned to the frontend.
 * - Identity attributes sourced from MeriPehchaan are minimized: we store only
 *   the provider + an external reference, never unnecessary identity data.
 */
const userSchema = new Schema(
  {
    internalUserId: { type: String, required: true, unique: true, index: true },
    externalIdentityProvider: { type: String, enum: ['mock', 'meripehchaan'], required: true },
    externalIdentityReference: { type: String, unique: true, sparse: true, index: true },
    role: { type: String, enum: Object.values(ROLE), required: true, index: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'DISABLED', 'PENDING_VERIFICATION'],
      default: 'ACTIVE',
      index: true,
    },
    lastLoginAt: { type: Date },
    consentVersionAccepted: { type: String },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;

export const User = model('User', userSchema);
export type { Role };
