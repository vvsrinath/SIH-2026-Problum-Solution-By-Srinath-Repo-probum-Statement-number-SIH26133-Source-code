# Swasthya Sathi — Security Model & Threat Analysis

## Authentication & Authorization

### Authentication Flow
```
Login → Mock Auth / MeriPehchaan SSO
  ↓
JWT issued (15 min TTL)
  ↓
Server-side session created (7 day TTL)
  ↓
CSRF token set in httpOnly cookie
  ↓
Subsequent requests: Bearer JWT + X-CSRF-Token
```

### RBAC Permission Matrix (6 roles, 49 permissions)

| Role | Key Permissions |
|------|----------------|
| PATIENT | profile:*:self, appointment:create/read/cancel, triage:create/read, consultation:join, consent/privacy:manage:self |
| DOCTOR | doctor:profile:*, availability:manage, appointments:read:assigned, referral:create, followup:create, patient:read:authorized |
| HEALTH_WORKER | healthworker:appointment:manage, patient:read:assigned, followup:manage |
| ADMIN | admin:system, admin:users, admin:audit, admin:settings, admin:facilities |

### Critical Security Property
**ADMIN has NO patient-data read permission.** Admin can manage users, audit logs, and system settings, but cannot read patient medical records, consultation content, or message plaintext. This is enforced at the permission level, not just convention.

## End-to-End Encryption (E2EE)

### Threat Model
- **Server compromise**: Attacker sees only ciphertext blobs, no plaintext
- **Database breach**: No message content stored (by design — no ChatMessage model)
- **Man-in-the-middle**: TLS + E2EE means MITM sees only encrypted blobs
- **Insider threat**: Server operators cannot read messages

### Implementation
```
Client A → encrypt(message, recipientPublicKey) → ciphertext
  ↓
Socket.IO emit (MESSAGE_SEND)
  ↓
Server: verify membership via DB lookup (Appointment/Referral)
  ↓
Server: broadcast ciphertext to room (never decrypt, never store)
  ↓
Client B → decrypt(ciphertext, privateKey) → plaintext
```

### Properties
- Server is a pure relay — never sees plaintext
- Conversation membership verified via real Appointment/Referral records
- No message persistence — in-memory routing only
- Protocol version tracked for future upgrades

## Data Privacy (DPDP Act 2023)

### Consent Management
- 4 granular purposes: HEALTHCARE_SERVICE, OPTIONAL_RESEARCH, OPTIONAL_ANALYTICS, NOTIFICATIONS
- Each consent has version, timestamp, source (PWA/ADMIN/IMPORT)
- Withdrawal recorded with timestamp
- All consent changes audited

### Privacy Rights
| Right | Endpoint | Description |
|-------|----------|-------------|
| Access | POST /privacy/requests | Request copy of all personal data |
| Correction | POST /privacy/requests | Request correction of inaccurate data |
| Deletion | POST /privacy/requests | Request deletion of personal data |
| Grievance | POST /privacy/requests | File grievance about data handling |
| Export | POST /privacy/export | Download JSON of all consent + privacy records |
| Admin Review | PATCH /privacy/requests/:id/decide | Approve/reject privacy requests |

### Data Minimization
- GPS coordinates: `RETENTION_GPS_DAYS=0` — never persisted
- Symptom text: passed transiently to AI, never stored (`rawSymptomsStored: false`)
- Triage assessments: stored without raw symptom text
- Audit logs: retained 10 years (regulatory requirement)

## CSRF Protection

- Double-submit cookie pattern
- CSRF token set on every response
- Mutation requests (POST/PATCH/DELETE) require `X-CSRF-Token` header
- Token validated via constant-time comparison

## Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| General API | 300 req/min | 60s |
| Auth endpoints | 10 req/min | 60s |
| AI endpoints | 20 req/min | 60s |

## Input Validation

- Zod schemas on all mutation endpoints
- `strict()` mode — unknown fields rejected
- `trim()` + `max()` on all string inputs
- Request body size limit: 1MB

## Security Headers (Helmet)

- Content-Security-Policy (production)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Strict-Transport-Security (production)

## Integration Security

### AI Service Isolation
- Internal-only — never exposed to public internet
- Shared secret authentication (`X-AI-Service-Secret`)
- No external API keys in the service itself
- Emergency detection runs locally (no LLM call needed)

### External Service Adapters
- Credentials loaded from environment variables only
- No hardcoded secrets in source code
- Adapters return explicit unavailable states when not configured
- Timeouts on all external HTTP calls (15-30 seconds)

## Threat Matrix

| Threat | Mitigation |
|--------|-----------|
| SQL/NoSQL injection | Mongoose ODM, parameterized queries |
| XSS | Helmet CSP, input sanitization |
| CSRF | Double-submit cookie pattern |
| Session hijacking | Short JWT TTL (15m), server-side sessions |
| Brute force | Rate limiting (10 req/min on auth) |
| Data breach | E2EE, no plaintext storage, data minimization |
| Insider threat | RBAC, audit logging, no admin patient-data access |
| Supply chain | No third-party LLM, no external API dependencies in AI service |
| Man-in-the-middle | TLS + E2EE |
| Replay attacks | Session-bound tokens, timestamp validation |

## Audit Logging

Every significant action is recorded:
- Auth events (login, logout, register)
- Consent changes (grant, withdraw)
- Privacy requests (submit, decide)
- Appointment lifecycle (book, cancel, complete)
- Referral creation
- Admin actions

Audit logs are append-only and include:
- Actor userId
- Action type
- Resource type + ID
- Result (SUCCESS/FAILURE)
- Request ID + IP
- Timestamp
