import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * Server-side session used for revocation and audit. The access token carried
 * by the client is stateless (JWT) but references this session so logout and
 * revocation are enforceable. The session stores no plaintext secrets.
 */
const sessionSchema = new Schema(
  {
    sessionTokenHash: { type: String, required: true, unique: true, index: true },
    internalUserId: { type: String, required: true, index: true },
    role: { type: String, required: true, index: true },
    userAgent: { type: String },
    ip: { type: String },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date },
    revokedReason: { type: String, enum: ['LOGOUT', 'ADMIN_REVOKE', 'SECURITY', 'EXPIRED'] },
  },
  { timestamps: true },
);

sessionSchema.index({ internalUserId: 1, revokedAt: 1 });

export type SessionDoc = InferSchemaType<typeof sessionSchema>;

export const Session =
  model('Session', sessionSchema);
