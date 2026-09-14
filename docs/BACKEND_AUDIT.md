# Backend Audit — Swasthya Sathi SIH26133

Generated: 2026-08-31 · Updated: 2026-09-01

> **Frontend status (2026-09-01):** The SPA is now wired to the live backend — the
> patient, doctor and specialist workspaces (dashboard, appointments incl. SlotLock
> booking, referrals, follow-ups, triage, notifications) call the real endpoints via
> `frontend/src/api/services.ts` (typed, no demo fallback) with CSRF handling in
> `frontend/src/api/client.ts` and session/role via `frontend/src/context/AuthContext.tsx`.
> Backend module statuses below remain accurate for the server side. See `docs/SCMA.md`.

---

## 1. Current Architecture

```
Express.js + TypeScript + Mongoose + Socket.IO
├── 17 modules (auth, users, patients, doctors, availability, appointments,
│   consultations, triage, referrals, followups, notifications, consent,
│   privacy, audit, hospitals, healthWorkers, health)
├── 7 integrations (MeriPehchaan, Bhuvan, Mappls, BharatVC, GovDrive, AI, Mock)
├── 17 database models
├── 7 middleware (auth, authz, CSRF, rateLimit, validation, requestId, errorHandler)
├── 3 services (audit, notification, session)
├── 4 utilities (errors, id, response, asyncHandler)
├── Socket.IO /messaging namespace (E2EE relay)
└── 4 test files
```

**Total**: ~100 TypeScript files, 49 API endpoints, 17 route groups.

---

## 2. Existing Modules

| Module | Routes | Status |
|--------|--------|--------|
| auth | 5 (login, callback, logout, mock-login, me) | Working — mock + MeriPehchaan skeleton |
| users | 2 (GET/PATCH /me) | Working |
| patients | 2 (GET/PATCH /me) | Working |
| doctors | 3 (list, get, availability) | Working |
| availability | 4 (list, upsert, delete, exceptions) | Working |
| appointments | 7 (CRUD + cancel/confirm/start/complete) | Working — SlotLock atomic booking |
| consultations | 3 (start, get, end) | Working — BharatVC skeleton |
| triage | 2 (assess, get) | Working — calls Python AI service |
| referrals | 3 (create, list, accept) | Working |
| followups | 3 (create, list, complete) | Working |
| notifications | 2 (list, mark-read) | Working |
| consent | 3 (grant, list, withdraw) | Working |
| privacy | 3 (submit, list, get) | Working |
| audit | 1 (list — admin only) | Working |
| hospitals | 1 (nearby) | Working — dual Bhuvan+Mappls |
| healthWorkers | 1 (get /me) | Working |
| health | 2 (health, ready) | Working |
| ai | 2 (chat/stream, translate) | Working — proxy to Python service |

---

## 3. Database Models

| Model | Key Fields | Indexes |
|-------|-----------|---------|
| User | internalUserId, externalIdentityReference, role, status | unique(internalUserId), unique(externalIdentityReference) |
| Session | sessionTokenHash, internalUserId, expiresAt, revokedAt | unique(sessionTokenHash) |
| PatientProfile | patientId, internalUserId, displayName, DOB | unique(patientId), unique(internalUserId) |
| DoctorProfile | doctorId, internalUserId, specialization, verificationStatus | unique(doctorId), unique(internalUserId) |
| HealthWorkerProfile | healthWorkerId, internalUserId | unique(healthWorkerId) |
| Appointment | appointmentId, patientId, doctorId, scheduledAt, status | compound(doctorId, scheduledAt), (patientId, status) |
| SlotLock | doctorId, scheduledAt, appointmentId, status | unique(doctorId, scheduledAt) |
| DoctorAvailability | doctorId, dayOfWeek, startMinute, endMinute | compound(doctorId, dayOfWeek, startMinute) |
| Consultation | consultationId, appointmentId, provider, status | unique(consultationId) |
| TriageAssessment | triageId, patientId, riskLevel, source | unique(triageId) |
| Hospital | hospitalId, latitude, longitude, source | compound(lat, lng) |
| Referral | referralId, patientId, status | unique(referralId) |
| FollowUp | followUpId, patientId, status | unique(followUpId) |
| Consent | consentId, userId, purpose, status | compound(userId, purpose, status) |
| PrivacyRequest | privacyRequestId, userId, type, status | unique(privacyRequestId) |
| Notification | notificationId, userId, read | compound(userId, read) |
| AuditLog | eventId, actorUserId, action, result | 6 indexes for query patterns |

**No chat/message models** — E2EE messages are never persisted. ✓

---

## 4. API Routes

### Auth
- `GET /api/v1/auth/login` — Start OAuth flow
- `GET /api/v1/auth/callback` — Handle callback
- `POST /api/v1/auth/logout` — Revoke session
- `POST /api/v1/auth/mock-login` — Dev mock login
- `GET /api/v1/auth/me` — Current user

### Users/Patients/Doctors
- `GET/PATCH /api/v1/users/me`
- `GET/PATCH /api/v1/patients/me`
- `GET /api/v1/doctors`, `GET /api/v1/doctors/:id`, `GET /api/v1/doctors/:id/availability`
- `GET /api/v1/health-workers/me`

### Appointments (SlotLock)
- `POST /api/v1/appointments` — Book (atomic SlotLock)
- `GET /api/v1/appointments` — List (role-scoped)
- `GET /api/v1/appointments/:id`
- `POST /api/v1/appointments/:id/cancel|confirm|start|complete`

### Availability
- `GET/POST/DELETE /api/v1/availability`
- `POST /api/v1/availability/exceptions`

### Consultations
- `POST /api/v1/consultations/:appointmentId/start`
- `GET /api/v1/consultations/:id`
- `POST /api/v1/consultations/:id/end`

### Triage
- `POST /api/v1/triage/assess`
- `GET /api/v1/triage/:id`

### Hospitals
- `GET /api/v1/hospitals/nearby`

### Referrals/Followups
- `POST/GET /api/v1/referrals`, `POST /api/v1/referrals/:id/accept`
- `POST/GET /api/v1/followups`, `POST /api/v1/followups/:id/complete`

### Consent/Privacy
- `POST/GET /api/v1/consent`, `POST /api/v1/consent/:id/withdraw`
- `POST/GET /api/v1/privacy/requests`, `GET /api/v1/privacy/requests/:id`

### Notifications/Audit
- `GET /api/v1/notifications`, `POST /api/v1/notifications/:id/read`
- `GET /api/v1/audit` (admin only)

### AI
- `POST /api/v1/chat/stream` (SSE proxy)
- `POST /api/v1/translate`

### Health
- `GET /health`, `GET /ready`

---

## 5. Security Mechanisms

| Mechanism | Status |
|-----------|--------|
| CSRF double-submit cookie | ✓ Implemented |
| CORS origin restriction | ✓ Implemented |
| Rate limiting (general/auth/AI/privacy/appointment) | ✓ Implemented |
| RBAC with 27 permissions | ✓ Implemented |
| Zod validation on all inputs | ✓ Implemented |
| JWT + server-side session | ✓ Implemented |
| Request ID tracking | ✓ Implemented |
| Structured logging with redaction | ✓ Implemented |
| Helmet security headers | ✓ Implemented |
| Production fail-fast on bad secrets | ✓ Implemented |
| IDOR protection (requireResourceAccess) | ✓ Implemented |
| E2EE relay (no plaintext storage) | ✓ Implemented |
| Audit logging | ✓ Implemented |

---

## 6. Integrations

| Integration | Provider File | Status |
|-------------|---------------|--------|
| MeriPehchaan | `meripehchaan.provider.ts` | Skeleton — `buildAuthUrl` + `handleCallback` exist, `refreshSession` not implemented |
| Bhuvan | `bhuvan.provider.ts` | Skeleton — returns `{ available: false }` |
| Mappls | `mappls.provider.ts` | Skeleton — returns `{ available: false }` |
| BharatVC | `bharatvc.provider.ts` | Skeleton — `createSession` + `endSession` exist, returns unavailable when no credentials |
| GovDrive | `govdrive.provider.ts` | Skeleton — throws `UNAVAILABLE` |
| AI | `ai.client.ts` | Working — calls Python FastAPI service via HTTP |
| Mock Auth | `mock.provider.ts` | Working — dev-only |

---

## 7. What Can Be Reused

- **ALL existing modules** — well-structured, properly typed
- **SlotLock appointment system** — atomic double-booking prevention
- **E2EE Socket.IO relay** — server never sees plaintext
- **Consent + Privacy modules** — DPDP-aligned
- **Audit logging** — comprehensive with redaction
- **All integration adapters** — provider pattern with graceful degradation
- **All middleware** — CSRF, CORS, rate limiting, auth, authz, validation
- **All database models** — proper indexes and schemas
- **All tests** — authz, double-booking, E2EE

---

## 8. What Must Be Replaced

| Component | Current | Target |
|-----------|---------|--------|
| AI backend | Groq (via Python service) | Local lightweight model (CPU-friendly) |
| AI service port | 8000 (conflicts with Node backend) | 8100 |
| AI model version string | `swarm-groq-1.0` | Update to reflect new model |
| OpenStreetMap Nominatim (frontend) | External API call in LocationBadge.tsx | Use Mappls/Bhuvan through backend |

---

## 9. What Is Missing

| Component | Status |
|-----------|--------|
| MeriPehchaan `refreshSession()` | Not implemented |
| Bhuvan real integration | No credentials, skeleton only |
| Mappls real integration | No credentials, skeleton only |
| BharatVC real integration | No credentials, skeleton only |
| GovDrive real integration | No credentials, skeleton only |
| AI service in docker-compose.yml | Not included |
| Privacy center expanded routes | Basic CRUD exists but some DPDP endpoints missing |
| Comprehensive test suite | Only 4 test files |
| Redis for Socket.IO scaling | Not configured |
| Backend health check in Docker | Not defined |

---

## 10. Migration Sequence

### Phase 1: Audit ✓ (this document)
### Phase 2: Infrastructure
- Fix AI_SERVICE_URL default (8000 → 8100)
- Rename PORT to BACKEND_PORT in env.ts
- Add AI service to docker-compose.yml
- Add backend health check to Docker
- Verify MongoDB replica set in Docker

### Phase 3: Security
- Update env.ts production assertions
- Add missing privacy routes (access-request, correction-request, deletion-request, grievance)
- Ensure all consent purposes are defined
- Verify IDOR protection on all routes

### Phase 4: AI
- Rewrite ai-service to use local lightweight model (remove Groq dependency)
- Update triage.service.ts model version
- Add AI service Dockerfile with CPU-only model

### Phase 5: Maps
- Implement Bhuvan provider with proper API interface
- Implement Mappls provider with proper API interface
- Remove Nominatim from frontend (use backend /hospitals/nearby)

### Phase 6: Consultation
- Implement BharatVC adapter with mock provider
- Document required credentials

### Phase 7: Messaging
- Audit E2EE implementation
- Ensure no chat persistence
- Add Redis adapter placeholder for scaling

### Phase 8: Storage
- Implement GovDrive adapter with mock provider
- Document required credentials

### Phase 9: Privacy
- Add missing DPDP routes
- Expand consent purposes
- Add grievance handling

### Phase 10: Testing
- Add integration tests for auth flows
- Add API endpoint tests
- Add consent/privacy workflow tests
- Add concurrency tests
- Expand E2EE tests

### Phase 11: Documentation
- Create ARCHITECTURE.md, SECURITY.md, DATA_FLOW.md
- Create E2EE.md, INTEGRATIONS.md, DPDP_ALIGNMENT.md
- Create THREAT_MODEL.md
- Update README.md

---

## Files That Need Modification

| File | Change |
|------|--------|
| `src/config/env.ts` | Rename PORT→BACKEND_PORT, fix AI default, update env vars |
| `src/modules/triage/triage.service.ts` | Update model version string |
| `src/modules/ai/aiProxy.routes.ts` | Ensure proper auth on proxy routes |
| `src/modules/privacy/privacy.routes.ts` | Add missing DPDP routes |
| `src/modules/privacy/privacy.controller.ts` | Add missing handlers |
| `src/modules/consent/consent.service.ts` | Verify all purposes defined |
| `backend/.env.example` | Update with all required vars |
| `docker-compose.yml` | Add ai-service, fix ports |
| `backend/Dockerfile` | Add non-root user, health check |
| `ai-service/` | Rewrite to remove Groq |

## Files That Should Be Added

| File | Purpose |
|------|---------|
| `src/integrations/bhuvan/bhuvan.adapter.ts` | Real Bhuvan API adapter |
| `src/integrations/mappls/mappls.adapter.ts` | Real Mappls API adapter |
| `src/integrations/bharatvc/bharatvc.mock.ts` | Dev mock provider |
| `src/integrations/govdrive/govdrive.mock.ts` | Dev mock provider |
| `tests/auth-flow.test.ts` | Auth integration tests |
| `tests/api-endpoints.test.ts` | API endpoint tests |
| `tests/consent-privacy.test.ts` | Privacy workflow tests |
| `docs/ARCHITECTURE.md` | System architecture |
| `docs/SECURITY.md` | Security documentation |
| `docs/DATA_FLOW.md` | Data flow diagrams |
| `docs/E2EE.md` | E2EE documentation |
| `docs/INTEGRATIONS.md` | Integration documentation |
| `docs/DPDP_ALIGNMENT.md` | DPDP compliance |
| `docs/THREAT_MODEL.md` | Threat model |

## Files That Should Be Removed

| File | Reason |
|------|--------|
| `ai-service/app/groq_client.py` | Replace with local model |
| `ai-service/app/config.py` Groq vars | No longer needed |
| Frontend Nominatim call | Use backend maps |
