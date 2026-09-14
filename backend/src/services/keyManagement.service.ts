/**
 * E2EE Key Management — Swasthya Sathi (SIH26133)
 *
 * Client-side key lifecycle:
 *   1. GENERATE — user creates key pair on registration
 *   2. STORE    — private key encrypted with user passphrase, stored in IndexedDB
 *   3. EXCHANGE — public key shared via server (never private key)
 *   4. ROTATE   — periodic key rotation (90 days)
 *   5. RECOVER  — passphrase-based recovery (no server-side key escrow)
 *
 * Server role: stores ONLY public keys and key metadata. Never sees private
 * keys or decrypted message content. This is the E2EE trust boundary.
 */

import mongoose from 'mongoose';
import { Schema, model, type InferSchemaType } from 'mongoose';
import { newAwarenessId } from '../utils/id';
import { recordAudit } from '../services/audit.service';
import { createNotification } from '../services/notification.service';
import logger from '../config/logger';

// ---------------------------------------------------------------------------
// Key Metadata model — server stores ONLY this (no private key material)
// ---------------------------------------------------------------------------

export const KEY_STATUS = {
  ACTIVE: 'ACTIVE',
  ROTATED: 'ROTATED',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
} as const;

const userKeySchema = new Schema(
  {
    keyId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    publicKey: { type: String, required: true }, // base64-encoded public key
    algorithm: { type: String, default: 'ECDH-P256' },
    status: {
      type: String,
      enum: Object.values(KEY_STATUS),
      default: 'ACTIVE',
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
    rotatedAt: { type: Date },
    expiresAt: { type: Date, index: true },
    revokedAt: { type: Date },
    revocationReason: { type: String },
    fingerprint: { type: String }, // SHA-256 of public key
  },
  { timestamps: true },
);
userKeySchema.index({ userId: 1, status: 1 });

export type UserKeyDoc = InferSchemaType<typeof userKeySchema>;
export const UserKey = mongoose.models.UserKey || model('UserKey', userKeySchema);

// ---------------------------------------------------------------------------
// Key Management Service
// ---------------------------------------------------------------------------

const KEY_VALIDITY_DAYS = 90;

/**
 * Register a new public key after client-side generation.
 * The private key NEVER reaches the server.
 */
export async function registerKey(input: {
  userId: string;
  publicKey: string;
  algorithm?: string;
  fingerprint?: string;
}): Promise<UserKeyDoc> {
  // Revoke any existing active keys for this user
  await UserKey.updateMany(
    { userId: input.userId, status: 'ACTIVE' },
    { $set: { status: 'ROTATED', rotatedAt: new Date() } },
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + KEY_VALIDITY_DAYS);

  const key = await UserKey.create({
    keyId: newAwarenessId(),
    userId: input.userId,
    publicKey: input.publicKey,
    algorithm: input.algorithm || 'ECDH-P256',
    status: 'ACTIVE',
    expiresAt,
    fingerprint: input.fingerprint,
  });

  await recordAudit({
    actorUserId: input.userId,
    action: 'KEY.REGISTER',
    resourceType: 'userKey',
    resourceId: key.keyId,
    result: 'SUCCESS',
    details: { algorithm: key.algorithm, expiresAt: expiresAt.toISOString() },
  });

  logger.info({ userId: input.userId, keyId: key.keyId }, 'E2EE key registered');
  return key;
}

/**
 * Get the active public key for a user.
 * Returns ONLY the public key — private key is never on the server.
 */
export async function getActiveKey(userId: string): Promise<{ publicKey: string; keyId: string; algorithm: string } | null> {
  const key = (await UserKey.findOne({ userId, status: 'ACTIVE' })
    .select('publicKey keyId algorithm')
    .lean()
    .exec()) as { publicKey: string; keyId: string; algorithm: string } | null;
  if (!key) return null;
  return { publicKey: key.publicKey, keyId: key.keyId, algorithm: key.algorithm };
}

/**
 * Get the active public keys for multiple users (for group conversations).
 */
export async function getActiveKeys(userIds: string[]): Promise<Map<string, { publicKey: string; keyId: string }>> {
  const keys = await UserKey.find({ userId: { $in: userIds }, status: 'ACTIVE' })
    .select('userId publicKey keyId')
    .lean().exec();

  const map = new Map<string, { publicKey: string; keyId: string }>();
  for (const key of keys) {
    map.set(key.userId, { publicKey: key.publicKey, keyId: key.keyId });
  }
  return map;
}

/**
 * Revoke a key (e.g., on account compromise or user request).
 */
export async function revokeKey(
  keyId: string,
  userId: string,
  reason: string,
): Promise<boolean> {
  const result = await UserKey.findOneAndUpdate(
    { keyId, userId, status: 'ACTIVE' },
    { $set: { status: 'REVOKED', revokedAt: new Date(), revocationReason: reason } },
    { new: true },
  );

  if (result) {
    await recordAudit({
      actorUserId: userId,
      action: 'KEY.REVOKE',
      resourceType: 'userKey',
      resourceId: keyId,
      result: 'SUCCESS',
      details: { reason },
      severity: 'WARNING',
    });

    await createNotification({
      userId,
      type: 'GENERAL',
      title: 'Encryption key revoked',
      body: 'Your encryption key has been revoked. You will need to generate a new key pair.',
    });

    logger.warn({ keyId, userId, reason }, 'E2EE key revoked');
    return true;
  }
  return false;
}

/**
 * Check for expired keys and mark them.
 */
export async function enforceKeyExpiry(): Promise<number> {
  const result = await UserKey.updateMany(
    { status: 'ACTIVE', expiresAt: { $lt: new Date() } },
    { $set: { status: 'EXPIRED' } },
  );

  if (result.modifiedCount > 0) {
    logger.info({ expired: result.modifiedCount }, 'E2EE keys expired');
    await recordAudit({
      action: 'KEY.EXPIRY_ENFORCEMENT',
      resourceType: 'userKey',
      result: 'SUCCESS',
      details: { expiredCount: result.modifiedCount },
    });
  }

  return result.modifiedCount;
}

/**
 * Get key history for a user (audit trail).
 */
export async function getKeyHistory(userId: string) {
  return UserKey.find({ userId }).sort({ createdAt: -1 }).lean().exec();
}

/**
 * Verify a key fingerprint matches.
 */
export async function verifyFingerprint(keyId: string, fingerprint: string): Promise<boolean> {
  const key = (await UserKey.findOne({ keyId, status: 'ACTIVE' }).lean().exec()) as { fingerprint?: string } | null;
  if (!key) return false;
  return key.fingerprint === fingerprint;
}
