import { randomBytes } from 'node:crypto';
import { nanoid } from 'nanoid';

const ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';

export const ID_CHARS = ALPHABET;

function prefixed(prefix: string, size = 12): string {
  return `${prefix}_${nanoid(size)}`;
}

/** Human-friendly internal-user id (never the Mongo _id). */
export function newUserId(): string {
  return prefixed('usr');
}

/** Immutable external identity reference recorded after MeriPehchaan auth. */
export function newExternalReference(): string {
  return prefixed('ext');
}

export function newPatientId(): string {
  return prefixed('pat');
}

export function newDoctorId(): string {
  return prefixed('doc');
}

export function newHealthWorkerId(): string {
  return prefixed('hw');
}

export function newAppointmentId(): string {
  return prefixed('apt');
}

export function newConsultationId(): string {
  return prefixed('con');
}

export function newReferralId(): string {
  return prefixed('ref');
}

export function newFollowUpId(): string {
  return prefixed('fup');
}

export function newConsentId(): string {
  return prefixed('cns');
}

export function newTriageId(): string {
  return prefixed('trg');
}

export function newPrivacyRequestId(): string {
  return prefixed('prv');
}

export function newNotificationId(): string {
  return prefixed('ntf');
}

export function newAwarenessId(): string {
  return prefixed('inc');
}

/** A random unguessable token (sessions, one-time values). */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export { nanoid };
export const ID_SIZES = { standard: 12, long: 18 } as const;
