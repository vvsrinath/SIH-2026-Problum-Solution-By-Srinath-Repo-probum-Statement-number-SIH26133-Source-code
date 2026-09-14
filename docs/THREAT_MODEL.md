# Swasthya Sathi — Formal Threat Model

## Methodology
STRIDE-based threat model applied to each system component.

## System Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                     TRUST BOUNDARY                           │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Frontend  │◄──►│ Backend  │◄──►│ MongoDB  │              │
│  │ (Browser) │    │ (Node.js)│    │ (Database)│              │
│  └─────┬────┘    └────┬─────┘    └──────────┘              │
│        │              │                                      │
│        │ E2EE         │ Internal                             │
│        ▼              ▼                                      │
│  ┌──────────┐    ┌──────────┐                               │
│  │ IndexedDB│    │AI Service│                               │
│  │ (Device) │    │(FastAPI) │                               │
│  └──────────┘    └──────────┘                               │
└─────────────────────────────────────────────────────────────┘

External Integrations (outside trust boundary):
  - MeriPehchaan (government SSO)
  - Bhuvan (ISRO geospatial)
  - Mappls (maps)
  - BharatVC (video)
  - GovDrive (storage)
```

## Threat Analysis by Component

### 1. Frontend (Browser)

| Threat | STRIDE | Mitigation |
|--------|--------|-----------|
| XSS via chat input | Tampering | CSP headers, input sanitization |
| Private key theft | Information Disclosure | IndexedDB encryption with PBKDF2 passphrase |
| Session hijacking | Spoofing | httpOnly cookies, short TTL, CSRF double-submit |
| Offline data theft | Information Disclosure | E2EE at rest in IndexedDB |
| Man-in-the-middle | Information Disclosure | TLS everywhere, certificate pinning |

### 2. Backend (Node.js)

| Threat | STRIDE | Mitigation |
|--------|--------|-----------|
| SQL/NoSQL injection | Tampering | Mongoose ODM, parameterized queries |
| CSRF on mutations | Tampering | Double-submit cookie pattern |
| Brute force auth | Elevation of Privilege | Rate limiting (10 req/min) |
| JWT forgery | Spoofing | HMAC signing, short TTL (15m) |
| Session fixation | Spoofing | Server-side sessions, rotation on login |
| RBAC bypass | Elevation of Privilege | Server-side permission matrix, 49 permissions |
| Data exfiltration | Information Disclosure | Classification-based access control |
| Admin overreach | Elevation of Privilege | Admin has NO patient-data read permission |
| Audit log tampering | Tampering | Append-only, no delete/update operations |
| Rate limit bypass | Denial of Service | IP-based + user-based rate limiting |

### 3. MongoDB Database

| Threat | STRIDE | Mitigation |
|--------|--------|-----------|
| Unauthorized access | Spoofing | Authentication enabled, network isolation |
| Data breach | Information Disclosure | Encryption at rest, field-level for HEALTH data |
| Injection via aggregation | Tampering | Mongoose schema validation |
| Backup exposure | Information Disclosure | Encrypted backups, access logging |
| Replica set compromise | Denial of Service | Majority write concern, authentication |

### 4. AI Service (FastAPI)

| Threat | STRIDE | Mitigation |
|--------|--------|-----------|
| Prompt injection | Tampering | Input sanitization, keyword emergency detection |
| Data leakage to external LLM | Information Disclosure | No external API calls (rule-based engine) |
| Unauthorized access | Spoofing | Shared secret (X-AI-Service-Secret) |
| Resource exhaustion | Denial of Service | Rate limiting (20 req/min) |
| Emergency bypass | Elevation of Privilege | Local keyword detection, no LLM needed |

### 5. E2EE Messaging

| Threat | STRIDE | Mitigation |
|--------|--------|-----------|
| Server reads plaintext | Information Disclosure | Server never stores/decrypts messages |
| Key compromise | Information Disclosure | Private key encrypted with PBKDF2, never on server |
| Replay attacks | Tampering | Timestamp + session binding |
| Message injection | Tampering | Conversation membership verified via DB |
| Key rotation gap | Information Disclosure | 90-day key expiry, automatic renewal |
| Lost device | Information Disclosure | Remote key revocation, local wipe |

### 6. External Integrations

| Threat | STRIDE | Mitigation |
|--------|--------|-----------|
| Credential leak | Information Disclosure | Env vars only, no hardcoded secrets |
| API impersonation | Spoofing | OAuth2 + shared secrets |
| Data poisoning | Tampering | Server-side validation, source tracking |
| Service unavailability | Denial of Service | Graceful fallback, explicit unavailable states |
| Callback forgery | Spoofing | State parameter validation, HTTPS only |

### 7. Consent & Privacy (DPDP)

| Threat | STRIDE | Mitigation |
|--------|--------|-----------|
| Consent bypass | Elevation of Privilege | Check consent before data processing |
| Data erasure failure | Tampering | Automated retention enforcement |
| Breach notification delay | Information Disclosure | 72-hour SLA monitoring, automated alerts |
| Consent forgery | Spoofing | Server-side consent records, audit trail |
| Export data tampering | Tampering | JSON export with timestamp + signature |

## Security Controls Summary

| Control | Implementation | Status |
|---------|---------------|--------|
| Authentication | JWT + MeriPehchaan SSO | Implemented |
| Authorization | RBAC (49 permissions, 6 roles) | Implemented |
| Resource-level auth | requireOwnership + requireClinicalAccess | Implemented |
| CSRF | Double-submit cookie | Implemented |
| Rate limiting | 3 tiers (general/auth/AI) | Implemented |
| Input validation | Zod schemas, strict mode | Implemented |
| Security headers | Helmet CSP | Implemented |
| E2EE | Web Crypto API (ECDH + AES-GCM) | Implemented |
| Key management | Generate/store/rotate/revoke | Implemented |
| Data classification | 4 levels (PUBLIC/INTERNAL/PERSONAL/HEALTH) | Implemented |
| Retention enforcement | Automated per-class retention | Implemented |
| Breach handling | 6-step incident response | Implemented |
| Audit logging | 40+ structured event types | Implemented |
| Offline security | IndexedDB encrypted storage | Implemented |
| Consent lifecycle | Grant/withdraw/expiry/erasure | Implemented |

## Residual Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Physical device theft | High | Device encryption, remote wipe capability |
| Insider threat (admin) | High | Admin has no patient-data access, full audit trail |
| Zero-day in dependencies | Medium | Regular updates, vulnerability scanning |
| Social engineering | Medium | User education, no sensitive data in notifications |
| Quantum computing | Low | ECDH P-256 acceptable for 5-10 year horizon |

## Compliance Mapping

| Requirement | Standard | Implementation |
|-------------|----------|---------------|
| Data minimization | DPDP Act 2023 | Collect only necessary fields |
| Consent management | DPDP Act 2023 | Granular purposes, withdrawal |
| Data portability | DPDP Act 2023 | JSON export endpoint |
| Right to erasure | DPDP Act 2023 | Full data deletion workflow |
| Breach notification | DPDP Act 2023 §8(6) | 72-hour SLA, automated alerts |
| Data retention | DPDP Act 2023 | Automated retention enforcement |
| Audit trail | DPDP Act 2023 | Append-only audit log |
| Access control | HIPAA-equivalent | RBAC + resource-level authorization |
