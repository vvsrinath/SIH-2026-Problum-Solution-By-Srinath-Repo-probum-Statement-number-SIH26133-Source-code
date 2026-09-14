/**
 * Data Classification System — Swasthya Sathi (SIH26133)
 *
 * Every piece of data in the system is classified into one of four levels.
 * Classification drives retention, encryption, access control, and audit policy.
 *
 * Levels (ascending sensitivity):
 *   PUBLIC      → non-sensitive, no access restrictions
 *   INTERNAL    → system operational data, authenticated access only
 *   PERSONAL    → PII (name, contact, demographics), DPDP "personal data"
 *   HEALTH      → medical records, symptoms, diagnoses, PHI — highest protection
 */

export const DATA_CLASSIFICATION = {
  PUBLIC: 'PUBLIC',
  INTERNAL: 'INTERNAL',
  PERSONAL: 'PERSONAL',
  HEALTH: 'HEALTH',
} as const;

export type DataClassification = (typeof DATA_CLASSIFICATION)[keyof typeof DATA_CLASSIFICATION];

/**
 * Maps each collection/field group to its classification level.
 * This is the authoritative source for how data is handled.
 */
export const COLLECTION_CLASSIFICATION: Record<string, DataClassification> = {
  // User identity — PERSONAL (name, contact)
  users: 'PERSONAL',
  sessions: 'INTERNAL',

  // Clinical profiles — HEALTH
  patientprofiles: 'HEALTH',
  doctorprofiles: 'PERSONAL',
  healthworkerprofiles: 'PERSONAL',

  // Facility data — PUBLIC (hospital directory)
  hospitals: 'PUBLIC',

  // Scheduling — INTERNAL
  doctoravailabilities: 'INTERNAL',
  availabilityexceptions: 'INTERNAL',
  slotlocks: 'INTERNAL',

  // Appointments — HEALTH (links patient to doctor at a time)
  appointments: 'HEALTH',

  // Consultations — HEALTH
  consultations: 'HEALTH',

  // Triage — HEALTH (symptom assessment results)
  triageassessments: 'HEALTH',

  // Referrals — HEALTH
  referrals: 'HEALTH',

  // Follow-ups — HEALTH
  followups: 'HEALTH',

  // Consent — PERSONAL (records user's data preferences)
  consents: 'PERSONAL',

  // Privacy requests — PERSONAL
  privacyrequests: 'PERSONAL',

  // Audit — INTERNAL (append-only system log)
  auditlogs: 'INTERNAL',

  // Notifications — INTERNAL (pointer, not content)
  notifications: 'INTERNAL',
};

/**
 * Field-level overrides for fields that are more sensitive than their collection.
 * E.g., a field in a PERSONAL collection that contains HEALTH data.
 */
export const FIELD_CLASSIFICATION: Record<string, Record<string, DataClassification>> = {
  users: {
    externalIdentityReference: 'PERSONAL',
    lastLoginAt: 'INTERNAL',
  },
  doctorprofiles: {
    consultationFee: 'INTERNAL',
    verificationMetadata: 'INTERNAL',
  },
  patientprofiles: {
    emergencyContactName: 'PERSONAL',
    emergencyContactPhone: 'PERSONAL',
    privacyPreferences: 'PERSONAL',
  },
  appointments: {
    reason: 'HEALTH',
    cancelledReason: 'INTERNAL',
  },
  triageassessments: {
    possibleConditions: 'HEALTH',
    recommendedAction: 'HEALTH',
    rawSymptomsStored: 'HEALTH',
  },
  referrals: {
    clinicalSummary: 'HEALTH',
    reason: 'HEALTH',
  },
  followups: {
    instructions: 'HEALTH',
    reason: 'HEALTH',
  },
};

/**
 * Classification-specific handling policies.
 */
export const CLASSIFICATION_POLICY: Record<
  DataClassification,
  {
    encryption: string;
    accessLogging: boolean;
    retentionDays: number;
    deleteAfterRetention: boolean;
    requiresConsent: boolean;
    externalSharingAllowed: boolean;
    auditOnAccess: boolean;
    description: string;
  }
> = {
  PUBLIC: {
    encryption: 'none',
    accessLogging: false,
    retentionDays: 36500, // effectively permanent
    deleteAfterRetention: false,
    requiresConsent: false,
    externalSharingAllowed: true,
    auditOnAccess: false,
    description: 'Non-sensitive data (facility directory, public health info)',
  },
  INTERNAL: {
    encryption: 'at-rest',
    accessLogging: true,
    retentionDays: 365, // 1 year
    deleteAfterRetention: true,
    requiresConsent: false,
    externalSharingAllowed: false,
    auditOnAccess: false,
    description: 'System operational data (sessions, availability, audit logs)',
  },
  PERSONAL: {
    encryption: 'at-rest + in-transit',
    accessLogging: true,
    retentionDays: 2555, // 7 years (DPDP requirement)
    deleteAfterRetention: true,
    requiresConsent: true,
    externalSharingAllowed: false,
    auditOnAccess: true,
    description: 'PII — names, contacts, demographics, consent records',
  },
  HEALTH: {
    encryption: 'at-rest + in-transit + field-level',
    accessLogging: true,
    retentionDays: 2555, // 7 years (medical records)
    deleteAfterRetention: true,
    requiresConsent: true,
    externalSharingAllowed: false,
    auditOnAccess: true,
    description: 'PHI — medical records, symptoms, diagnoses, clinical summaries',
  },
};

/**
 * Get the classification for a given collection and optional field.
 */
export function getClassification(collection: string, field?: string): DataClassification {
  if (field && FIELD_CLASSIFICATION[collection]?.[field]) {
    return FIELD_CLASSIFICATION[collection][field];
  }
  return COLLECTION_CLASSIFICATION[collection] || 'INTERNAL';
}

/**
 * Get the handling policy for a classification level.
 */
export function getHandlingPolicy(classification: DataClassification) {
  return CLASSIFICATION_POLICY[classification];
}

/**
 * Check if a field should be redacted in logs based on classification.
 */
export function shouldRedact(collection: string, field: string): boolean {
  const classification = getClassification(collection, field);
  return classification === 'HEALTH' || classification === 'PERSONAL';
}

/**
 * Get all collections at or above a given classification level.
 */
export function getCollectionsAboveLevel(minLevel: DataClassification): string[] {
  const levels: DataClassification[] = ['PUBLIC', 'INTERNAL', 'PERSONAL', 'HEALTH'];
  const minIndex = levels.indexOf(minLevel);
  return Object.entries(COLLECTION_CLASSIFICATION)
    .filter(([, level]) => levels.indexOf(level) >= minIndex)
    .map(([collection]) => collection);
}
