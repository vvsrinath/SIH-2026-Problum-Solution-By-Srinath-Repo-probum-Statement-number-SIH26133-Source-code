import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectTestDb, resetCollections } from './setup';
import { submitPrivacyRequest, decidePrivacyRequest, exportUserData } from '../src/modules/privacy/privacy.service';
import { PrivacyRequest, PRIVACY_REQUEST_TYPE } from '../src/database/models/PrivacyRequest';
import { Consent, CONSENT_PURPOSE } from '../src/database/models/Consent';
import { giveConsent, listMyConsents, withdrawConsent } from '../src/modules/consent/consent.service';

const TEST_USER = 'usr-privacy-test-001';

describe('Privacy module (DPDP compliance)', () => {
  beforeAll(async () => {
    if (await connectTestDb()) await resetCollections(['privacyrequests', 'consents', 'auditlogs', 'notifications']);
  });

  it('submit creates a privacy request with SUBMITTED status', async () => {
    const doc = await submitPrivacyRequest({
      userId: TEST_USER,
      type: PRIVACY_REQUEST_TYPE.ACCESS,
      describeData: 'I want a copy of all my health records',
    });
    expect(doc.privacyRequestId).toBeTruthy();
    expect(doc.status).toBe('SUBMITTED');
    expect(doc.type).toBe('ACCESS');
  });

  it('decide changes request status to APPROVED and records reviewer', async () => {
    const submitted = await submitPrivacyRequest({
      userId: TEST_USER,
      type: PRIVACY_REQUEST_TYPE.DELETION,
      rationale: 'Remove my account data',
    });
    const decided = await decidePrivacyRequest(submitted.privacyRequestId, 'usr-admin-001', 'APPROVED', 'Verified identity');
    expect(decided?.status).toBe('APPROVED');
    expect(decided?.reviewerUserId).toBe('usr-admin-001');
  });

  it('export returns user consents and privacy requests', async () => {
    const data = await exportUserData(TEST_USER);
    expect(data.userId).toBe(TEST_USER);
    expect(Array.isArray(data.consents)).toBe(true);
    expect(Array.isArray(data.privacyRequests)).toBe(true);
    expect(data.exportedAt).toBeTruthy();
  });
});

describe('Consent module', () => {
  beforeAll(async () => {
    if (await connectTestDb()) await resetCollections(['consents', 'auditlogs', 'notifications']);
  });

  it('grant creates a consent record with GRANTED status', async () => {
    const consent = await giveConsent({
      userId: TEST_USER,
      purpose: CONSENT_PURPOSE.HEALTHCARE_SERVICE,
      version: '1.0',
      text: 'I agree to data processing for healthcare',
    });
    expect(consent.consentId).toBeTruthy();
    expect(consent.status).toBe('GRANTED');
    expect(consent.purpose).toBe('HEALTHCARE_SERVICE');
  });

  it('listMyConsents returns consents for the user', async () => {
    const list = await listMyConsents(TEST_USER);
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list[0].userId).toBe(TEST_USER);
  });

  it('withdraw changes consent status to WITHDRAWN', async () => {
    const granted = await giveConsent({
      userId: TEST_USER,
      purpose: CONSENT_PURPOSE.OPTIONAL_RESEARCH,
      version: '1.0',
    });
    const withdrawn = await withdrawConsent(granted.consentId, TEST_USER);
    expect(withdrawn.status).toBe('WITHDRAWN');
    expect(withdrawn.withdrawnAt).toBeDefined();
  });
});
