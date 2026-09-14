import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDb, resetCollections } from './setup';
import { User } from '../src/database/models/User';
import { Consent } from '../src/database/models/Consent';
import {
  getConsentSummary,
  isConsentValid,
  giveConsent,
} from '../src/modules/consent/consent.service';
import {
  registerKey,
  getActiveKey,
  getActiveKeys,
} from '../src/services/keyManagement.service';
import {
  detectIncident,
  assessIncident,
  containIncident,
  getOpenIncidents,
} from '../src/services/breach.service';

const PATIENT_ID = 'test-patient-routes-001';

beforeAll(async () => {
  await connectTestDb();
});

beforeEach(async () => {
  await resetCollections(['users', 'consents', 'auditlogs', 'notifications']);
  await User.create({
    internalUserId: PATIENT_ID,
    externalIdentityProvider: 'mock',
    externalIdentityReference: 'mock-routes-001',
    role: 'PATIENT',
    status: 'ACTIVE',
  });
});

describe('Consent summary and check', () => {
  it('returns summary with all purposes as NOT_GIVEN initially', async () => {
    const summary = await getConsentSummary(PATIENT_ID);
    expect(summary).toBeDefined();
    expect(summary['HEALTHCARE_SERVICE']).toBeDefined();
    expect(summary['HEALTHCARE_SERVICE'].status).toBe('NOT_GIVEN');
  });

  it('isConsentValid returns false when no consent given', async () => {
    const valid = await isConsentValid(PATIENT_ID, 'HEALTHCARE_SERVICE');
    expect(valid).toBe(false);
  });

  it('isConsentValid returns true after granting consent', async () => {
    await giveConsent({
      userId: PATIENT_ID,
      purpose: 'OPTIONAL_RESEARCH',
      version: '1.0',
      text: 'Research consent',
      source: 'PWA',
    });

    const valid = await isConsentValid(PATIENT_ID, 'OPTIONAL_RESEARCH');
    expect(valid).toBe(true);
  });

  it('summary reflects grant status', async () => {
    await giveConsent({
      userId: PATIENT_ID,
      purpose: 'OPTIONAL_RESEARCH',
      version: '1.0',
      text: 'Research consent',
      source: 'PWA',
    });

    const summary = await getConsentSummary(PATIENT_ID);
    expect(summary['OPTIONAL_RESEARCH'].status).toBe('GRANTED');
  });
});

describe('Key management service', () => {
  it('registers and retrieves a public key', async () => {
    const key = await registerKey({
      userId: PATIENT_ID,
      publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE-test',
      algorithm: 'ECDH-P256',
    });

    expect(key.keyId).toBeDefined();
    expect(key.status).toBe('ACTIVE');

    const retrieved = await getActiveKey(PATIENT_ID);
    expect(retrieved).toBeDefined();
    expect(retrieved!.publicKey).toBe('MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE-test');
  });

  it('batch retrieval works', async () => {
    await registerKey({
      userId: PATIENT_ID,
      publicKey: 'batch-key-1',
      algorithm: 'ECDH-P256',
    });

    const keys = await getActiveKeys([PATIENT_ID]);
    expect(keys.size).toBe(1);
    expect(keys.get(PATIENT_ID)!.publicKey).toBe('batch-key-1');
  });
});

describe('Incident model (breach handling)', () => {
  it('can create and detect an incident', async () => {
    const incident = await detectIncident({
      title: 'Test breach',
      description: 'A test breach incident',
      severity: 'MEDIUM',
      affectedCollections: ['users'],
      affectedUserIds: [PATIENT_ID],
      estimatedRecordsBreached: 10,
      dataClassification: 'HEALTH',
    });

    expect(incident.incidentId).toBeDefined();
    expect(incident.severity).toBe('MEDIUM');
    expect(incident.status).toBe('DETECTED');
  });

  it('incident progresses through workflow', async () => {
    const incident = await detectIncident({
      title: 'Workflow test',
      description: 'Testing incident workflow',
      severity: 'HIGH',
    });

    const assessed = await assessIncident(incident.incidentId, {
      severity: 'CRITICAL',
      assignedTo: 'admin-001',
    });
    expect(assessed!.status).toBe('ASSESSED');
    expect(assessed!.severity).toBe('CRITICAL');

    const contained = await containIncident(incident.incidentId, [
      'Disabled affected accounts',
      'Revoked compromised tokens',
    ]);
    expect(contained!.status).toBe('CONTAINED');
    expect(contained!.containmentActions).toHaveLength(2);
  });

  it('getOpenIncidents returns non-reviewed incidents', async () => {
    await detectIncident({
      title: 'Open incident',
      description: 'Still open',
      severity: 'LOW',
    });

    const open = await getOpenIncidents();
    expect(open.length).toBeGreaterThanOrEqual(1);
  });
});
