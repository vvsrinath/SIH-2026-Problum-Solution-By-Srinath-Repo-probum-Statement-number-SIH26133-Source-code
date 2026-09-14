import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectTestDb, resetCollections } from './setup';
import { DATA_CLASSIFICATION, getClassification, CLASSIFICATION_POLICY, shouldRedact } from '../src/config/dataClassification';
import { UserKey } from '../src/services/keyManagement.service';

describe('Data Classification', () => {
  it('classifies collections correctly', () => {
    expect(getClassification('users')).toBe(DATA_CLASSIFICATION.PERSONAL);
    expect(getClassification('patientprofiles')).toBe(DATA_CLASSIFICATION.HEALTH);
    expect(getClassification('hospitals')).toBe(DATA_CLASSIFICATION.PUBLIC);
    expect(getClassification('auditlogs')).toBe(DATA_CLASSIFICATION.INTERNAL);
    expect(getClassification('triageassessments')).toBe(DATA_CLASSIFICATION.HEALTH);
  });

  it('classifies fields correctly', () => {
    expect(getClassification('users', 'externalIdentityReference')).toBe(DATA_CLASSIFICATION.PERSONAL);
    expect(getClassification('patientprofiles', 'emergencyContactName')).toBe(DATA_CLASSIFICATION.PERSONAL);
    expect(getClassification('appointments', 'reason')).toBe(DATA_CLASSIFICATION.HEALTH);
  });

  it('redacts health and personal data', () => {
    expect(shouldRedact('patientprofiles', 'emergencyContactName')).toBe(true);
    expect(shouldRedact('triageassessments', 'possibleConditions')).toBe(true);
    expect(shouldRedact('hospitals', 'name')).toBe(false);
  });

  it('has policies for all classification levels', () => {
    expect(CLASSIFICATION_POLICY.PUBLIC).toBeDefined();
    expect(CLASSIFICATION_POLICY.INTERNAL).toBeDefined();
    expect(CLASSIFICATION_POLICY.PERSONAL).toBeDefined();
    expect(CLASSIFICATION_POLICY.HEALTH).toBeDefined();
  });

  it('HEALTH requires field-level encryption', () => {
    expect(CLASSIFICATION_POLICY.HEALTH.encryption).toContain('field-level');
    expect(CLASSIFICATION_POLICY.HEALTH.auditOnAccess).toBe(true);
  });
});

describe('Retention Policy', () => {
  beforeAll(async () => {
    if (await connectTestDb()) await resetCollections(['auditlogs', 'consents']);
  });

  it('audit log retention is 10 years', async () => {
    const { RETENTION_RULES } = await import('../src/services/retention.service');
    const auditRule = RETENTION_RULES.find((r) => r.collection === 'auditlogs');
    expect(auditRule).toBeDefined();
    expect(auditRule!.retentionDays).toBe(3650);
  });

  it('triage retention is 2 years', async () => {
    const { RETENTION_RULES } = await import('../src/services/retention.service');
    const triageRule = RETENTION_RULES.find((r) => r.collection === 'triageassessments');
    expect(triageRule).toBeDefined();
    expect(triageRule!.retentionDays).toBe(730);
  });
});

describe('Key Management', () => {
  beforeAll(async () => {
    if (await connectTestDb()) await resetCollections(['userkeys']);
  });

  it('registers and retrieves a public key', async () => {
    const { registerKey, getActiveKey } = await import('../src/services/keyManagement.service');
    const testUserId = 'usr-key-test-001';
    const testPublicKey = 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEtest';

    const key = await registerKey({
      userId: testUserId,
      publicKey: testPublicKey,
      algorithm: 'ECDH-P256',
      fingerprint: 'abc123',
    });

    expect(key.keyId).toBeTruthy();
    expect(key.status).toBe('ACTIVE');

    const active = await getActiveKey(testUserId);
    expect(active).toBeTruthy();
    expect(active!.publicKey).toBe(testPublicKey);
  });

  it('revokes a key', async () => {
    const { registerKey, revokeKey, getActiveKey } = await import('../src/services/keyManagement.service');
    const testUserId = 'usr-key-test-002';

    const key = await registerKey({
      userId: testUserId,
      publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEtest2',
    });

    const revoked = await revokeKey(key.keyId, testUserId, 'Compromise suspected');
    expect(revoked).toBe(true);

    const active = await getActiveKey(testUserId);
    expect(active).toBeNull();
  });
});
