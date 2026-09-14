# Swasthya Sathi — Backend Architecture (SIH26133)

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        Docker Compose Stack                       │
│                                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Frontend   │  │   Backend   │  │  AI Service  │              │
│  │  (nginx)     │  │  (Node.js)  │  │  (FastAPI)   │              │
│  │  :5173       │  │  :8000       │  │  :8100        │              │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘              │
│         │                 │                                         │
│         │   /api proxy    │   Internal                             │
│         └─────────────────┼─────────────────────────┐             │
│                           │                         │             │
│                     ┌─────┴─────┐              ┌────┴────┐       │
│                     │  MongoDB  │              │  Redis   │       │
│                     │  :27017   │              │  (opt)   │       │
│                     └───────────┘              └─────────┘       │
└──────────────────────────────────────────────────────────────────┘
```

## Module Structure (19 modules)

```
backend/src/
├── modules/
│   ├── auth/           # Mock + MeriPehchaan SSO, JWT sessions
│   ├── users/          # User CRUD, role assignment
│   ├── patients/       # Patient profiles, medical history
│   ├── doctors/        # Doctor profiles, specializations
│   ├── healthWorkers/  # ASHA/ANM worker management
│   ├── hospitals/      # Facility directory
│   ├── availability/   # Doctor scheduling (availability windows)
│   ├── appointments/   # Booking with SlotLock double-booking prevention
│   ├── consultations/  # Video call sessions via BharatVC
│   ├── triage/         # AI-powered symptom assessment (ML + deterministic rule engine)
│   ├── referrals/      # Doctor-to-doctor referrals
│   ├── followups/      # Post-consultation follow-up tracking
│   ├── consent/        # DPDP Act 2023 consent management (enhanced)
│   ├── privacy/        # DPDP access/correction/deletion/grievance (enhanced)
│   ├── notifications/  # Multi-channel notifications
│   ├── audit/          # Immutable audit log
│   ├── ai/             # AI service proxy routes
│   ├── admin/          # Retention status, breach incident management
│   ├── storage/        # GovDrive encrypted file storage
│   └── keys/           # E2EE key registration/management
├── integrations/       # External service adapters
│   ├── ai/             # AI service client (→ :8100)
│   ├── authProvider.ts # Provider factory (mock | meripehchaan)
│   ├── bhuvan/         # ISRO Bhuvan geospatial
│   ├── mappls/         # Mappls/MapMyIndia maps
│   ├── bharatvc/       # BharatVC video consultation
│   ├── govdrive/       # GovDrive encrypted storage
│   ├── meripehchaan/   # MeriPehchaan government SSO (OAuth2)
│   ├── maps/           # Generic map types
│   └── mock/           # Mock authentication
├── sockets/            # Socket.IO E2EE messaging relay
├── database/models/    # 19 Mongoose schemas
├── middleware/         # Auth, CSRF, rate-limit, validation, RBAC
├── services/           # Cross-cutting: audit, retention, breach, key mgmt, scheduler
└── config/             # env.ts, logger, openapi, dataClassification
```

## Database Models (19)

| Model | Purpose |
|-------|---------|
| `User` | Core identity, roles, status |
| `Session` | Server-side JWT session tracking |
| `PatientProfile` | Medical profile linked to User |
| `DoctorProfile` | Doctor details, specializations |
| `HealthWorkerProfile` | ASHA/ANM worker profiles |
| `Hospital` | Facility directory |
| `DoctorAvailability` | Weekly scheduling windows |
| `SlotLock` | Atomic double-booking prevention |
| `Appointment` | Booking records |
| `Consultation` | Consultation metadata |
| `TriageAssessment` | AI triage results |
| `Referral` | Doctor-to-doctor referrals |
| `FollowUp` | Post-consultation tasks |
| `Consent` | DPDP consent records (enhanced lifecycle) |
| `PrivacyRequest` | DPDP data requests (with decide/erase/export) |
| `AuditLog` | Immutable audit trail (40+ structured actions) |
| `Notification` | User notifications |
| `UserKey` | E2EE public key registration/revocation |
| `Incident` | Breach incident handling (6-step workflow) |

## API Routes (55+ endpoints)

All routes under `/api/v1/`:

| Module | Method | Path | Permission |
|--------|--------|------|------------|
| Auth | POST | `/auth/login` | public |
| Auth | POST | `/auth/register` | public |
| Auth | POST | `/auth/logout` | any |
| Auth | GET | `/auth/me` | any |
| Users | GET | `/users` | ADMIN |
| Users | PATCH | `/users/:id` | ADMIN |
| Patients | GET | `/patients` | PATIENT |
| Patients | PATCH | `/patients/:id` | PATIENT |
| Doctors | GET | `/doctors` | any auth |
| Doctors | GET | `/doctors/:id` | any auth |
| Availability | POST | `/availability` | DOCTOR |
| Availability | GET | `/availability?doctorId=` | any auth |
| Appointments | POST | `/appointments` | PATIENT |
| Appointments | GET | `/appointments` | any auth |
| Appointments | POST | `/appointments/:id/cancel` | PATIENT |
| Appointments | POST | `/appointments/:id/confirm` / `start` / `complete` | DOCTOR |
| Consultations | POST | `/consultations/:appointmentId/start` | DOCTOR/PATIENT |
| Consultations | GET | `/consultations/:id` | any auth |
| Consultations | POST | `/consultations/:id/end` | DOCTOR/PATIENT |
| Triage | POST | `/triage/assess` | PATIENT |
| Triage | GET | `/triage/:id` | PATIENT |
| Referrals | POST | `/referrals` | DOCTOR |
| Referrals | GET | `/referrals` | DOCTOR/PATIENT |
| Followups | POST | `/followups` | DOCTOR |
| Followups | GET | `/followups` | DOCTOR/PATIENT |
| Consent | POST | `/consent` | PATIENT |
| Consent | GET | `/consent` | PATIENT |
| Consent | GET | `/consent/summary` | PATIENT |
| Consent | GET | `/consent/check?purpose=` | PATIENT |
| Consent | POST | `/consent/:id/withdraw` | PATIENT |
| Privacy | POST | `/privacy/requests` | PATIENT |
| Privacy | GET | `/privacy/requests` | PATIENT |
| Privacy | GET | `/privacy/requests/:id` | PATIENT |
| Privacy | PATCH | `/privacy/requests/:id/decide` | ADMIN |
| Privacy | POST | `/privacy/export` | PATIENT |
| Privacy | POST | `/privacy/export/full` | PATIENT |
| Privacy | POST | `/privacy/erase` | PATIENT |
| Notifications | GET | `/notifications` | any auth |
| Audit | GET | `/audit` | ADMIN |
| Admin | GET | `/admin/retention/status` | ADMIN |
| Admin | POST | `/admin/retention/enforce` | ADMIN |
| Admin | POST | `/admin/breach/incidents` | ADMIN |
| Admin | GET | `/admin/breach/incidents` | ADMIN |
| Admin | GET | `/admin/breach/incidents/:id` | ADMIN |
| Admin | PATCH | `/admin/breach/incidents/:id/step` | ADMIN |
| Storage | POST | `/storage/upload` | PATIENT/DOCTOR |
| Storage | GET | `/storage/:id/download` | PATIENT/DOCTOR |
| Storage | GET | `/storage` | PATIENT/DOCTOR |
| Storage | DELETE | `/storage/:id` | PATIENT/DOCTOR |
| Keys | POST | `/keys` | any auth |
| Keys | GET | `/keys/me` | any auth |
| Keys | GET | `/keys/:userId` | any auth |
| Keys | POST | `/keys/batch` | any auth |
| Keys | POST | `/keys/:keyId/revoke` | any auth |
| Keys | GET | `/keys/history/all` | any auth |
| AI | POST | `/chat/stream` | any auth |
| AI | POST | `/translate` | any auth |
| Triage (rule engine) | POST | `/triage/assess-rule` | any auth |
| Triage (rule engine) | GET | `/triage/symptoms` | any auth |
| Triage (rule engine) | GET | `/triage/followups` | any auth |

## Key Design Decisions

### 0. Frontend ↔ Backend Integration (live API)
- The SPA talks to the **real** backend — workspaces are populated from live data, not demo arrays.
- `frontend/src/api/client.ts` performs CSRF double-submit (reads `csrf` cookie, sends `X-CSRF-Token` on mutating requests), sends the `ssat` session cookie, and throws typed `ApiError`s so every page shows an honest loading/empty/error state.
- `frontend/src/context/AuthContext.tsx` drives role identity from `/auth/me`; each role workspace uses role-scoped navigation.
- Domain calls live in `frontend/src/api/services.ts`; see `docs/SCMA.md`.

### 1. E2EE Messaging (Server-Only Relay)
- Server never stores plaintext message content
- Messages are opaque ciphertext blobs relayed via Socket.IO
- Conversation membership verified via Appointment/Referral DB lookup
- In-memory routing only — lost on server restart

### 2. SlotLock Double-Booking Prevention
- Atomic `findOneAndUpdate` with unique compound index `(doctorId, scheduledAt)`
- Lock acquired before appointment creation
- Released if appointment creation fails
- Prevents race conditions in concurrent booking attempts

### 3. DPDP Act 2023 Compliance
- Consent: granular purposes (HEALTHCARE_SERVICE, OPTIONAL_RESEARCH, OPTIONAL_ANALYTICS, NOTIFICATIONS)
- Consent validity checking, automatic expiry enforcement
- Privacy requests: ACCESS, CORRECTION, DELETION, GRIEVANCE
- Admin approve/reject workflow for privacy decisions
- Full data export (all clinical data) + erasure (anonymize + soft-delete)
- Scheduled jobs: daily retention enforcement, consent expiry, key expiry

### 4. Data Classification (4 Levels)
- PUBLIC, INTERNAL, PERSONAL, HEALTH per `config/dataClassification.ts`
- Per-collection and per-field policies
- Handling rules: encrypt-at-rest, encrypt-transit, anonymize, aggregate-only

### 5. Breach Handling (6-Step Workflow)
- DETECT → ASSESS → CONTAIN → NOTIFY → REMEDIATE → REVIEW
- 72-hour DPDP SLA monitoring
- Incident model with structured state machine
- Admin routes for incident management

### 6. Key Management
- E2EE public key registration, rotation, revocation
- 90-day expiry with automatic enforcement via scheduler
- UserKey model with status tracking

### 7. Integration Adapter Pattern
- Each external service (Bhuvan, Mappls, BharatVC, GovDrive) has a provider adapter
- Adapters return explicit `available: false` when not configured
- No silent failures — callers see "service temporarily unavailable"
- Credentials never hardcoded — loaded from env vars
- MeriPehchaan uses real OAuth2 with refresh token flow
- Official logos for all integrations bundled in `frontend/public/images/gov/` (identification only)

### 8. AI Service Isolation
- Python FastAPI on separate port (8100)
- Internal only — never exposed to public internet
- Shared secret authentication (`X-AI-Service-Secret`)
- Deterministic JSON rule engine (symptom vocabulary → follow-ups → risk/conditions/red-flags) + optional ML (sentence-transformers)
- `/triage/assess-rule`, `/triage/symptoms`, `/triage/followups` are public-ish and called directly from the frontend (Symptom Checker, Worker Triage)
- Emergency detection runs locally without AI

## Security Model

See `SECURITY.md` for full threat model.
