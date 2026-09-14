# Swasthya Sathi — Smart India Hackathon 2026 (SIH26133)

A full-stack healthcare platform connecting patients with doctors, specialists, and health workers across rural India. Built with React + Node.js + MongoDB + Python AI, aligned with DPDP Act 2023 and Indian government integrations.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Docker Compose Stack                         │
│                                                                       │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────────────┐  │
│  │    Frontend    │   │    Backend    │   │     AI Service        │  │
│  │  React+Vite    │   │  Node+Express │   │   FastAPI (Python)    │  │
│  │  nginx :5173   │   │  :8000        │   │   :8100               │  │
│  └───────┬───────┘   └───────┬───────┘   └───────────────────────┘  │
│          │                   │                                        │
│          │  /api proxy       │  Internal                              │
│          └───────────────────┼────────────────────────────┐          │
│                              │                            │          │
│                        ┌─────┴─────┐               ┌─────┴─────┐   │
│                        │  MongoDB  │               │   Redis    │   │
│                        │  :27017   │               │  (opt)     │   │
│                        └───────────┘               └───────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

## Services

| Service | Stack | Port | Description |
|---------|-------|------|-------------|
| Frontend | React + Vite + Tailwind + nginx | 5173 | SPA with PWA + service worker |
| Backend | Node.js + Express + TypeScript | 8000 | 55+ REST endpoints + Socket.IO |
| AI Service | FastAPI + Python | 8100 | Rule-based health assistant + ML |
| Database | MongoDB 7 (replica set) | 27017 | 19 collections |

## Quick Start

### Docker (recommended)

```bash
cp .env.example .env          # edit secrets
docker compose up --build     # builds all 4 services
```

Open **http://localhost:5173**

### Local development

```bash
# Backend
cd backend && cp .env.example .env && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# AI Service
cd backend/ai-service && pip install -r requirements.txt && uvicorn app.main:app --port 8100
```

## Docker Commands

```bash
docker compose up --build          # start (foreground)
docker compose up -d --build       # start (background)
docker compose down                # stop
docker compose logs -f backend     # watch logs
docker compose down -v             # stop + delete data
```

## Features

| Feature | Description |
|---------|-------------|
| **6 Role Workspaces** | Patient, Doctor, Health Worker, Admin + Specialist + PHC |
| **E2EE Messaging** | End-to-end encrypted real-time chat (server relay only) |
| **SlotLock Appointments** | Atomic double-booking prevention |
| **AI Triage (Swasthya Mitra)** | Rule-based + ML symptom assessment, 12 Indian languages |
| **Rule Engine Symptom Checker** | `/patient/symptom-checker` — deterministic triage with dynamic follow-ups, duration/severity/context risk adjustments, risk level, conditions, red flags, and next steps |
| **Worker Field Triage** | `/worker/triage` — health workers run rule-engine assessment for a patient, enter patient name, and save session-local triage notes |
| **DPDP Act 2023 Compliance** | Consent lifecycle, data access/deletion/grievance, breach handling |
| **Data Classification** | 4-level (PUBLIC/INTERNAL/PERSONAL/HEALTH) per-collection policies |
| **Breach Handling** | 6-step workflow: detect → assess → contain → notify → remediate → review |
| **Key Management** | E2EE public key registration, rotation, revocation |
| **Offline Sync** | Service worker with cache-first for static, network-first for API |
| **Government Integrations** | MeriPehchaan SSO, Bhuvan maps, Mappls, BharatVC, GovDrive — official logos bundled in `frontend/public/images/gov/` |
| **PWA** | Installable, works offline, service worker |
| **Geospatial Search** | Find nearby hospitals/PHCs with Leaflet maps |
| **Multi-Language** | 12 Indian languages (Hindi, Tamil, Telugu, etc.) |

## API Routes (55+ endpoints)

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/auth/login` | Login (mock / MeriPehchaan) options |
| GET | `/api/v1/auth/callback` | SSO callback |
| POST | `/api/v1/auth/logout` | Logout (clears `ssat`) |
| POST | `/api/v1/auth/mock-login` | Dev-only mock login (sets `ssat`) |
| GET | `/api/v1/auth/me` | Current session (role/status) |

### Patient
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/patients/me` | My patient profile |
| PATCH | `/api/v1/patients/me` | Update my profile |
| GET | `/api/v1/users/me` | My identity + role profile |
| PATCH | `/api/v1/users/me` | Update self-editable fields |

### Doctor
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/doctors` | Directory search (`specialization`, `page`, `limit`) |
| GET | `/api/v1/doctors/:id` | Doctor details |
| GET | `/api/v1/doctors/:id/availability` | Patient-facing availability (weekly + exceptions) |
| POST | `/api/v1/availability` | Upsert my availability |
| GET | `/api/v1/availability` | List my availability |
| DELETE | `/api/v1/availability/:id` | Remove one availability window |
| POST | `/api/v1/availability/exceptions` | Set an availability exception |

### Appointments
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/appointments` | Book (SlotLock) |
| GET | `/api/v1/appointments` | List appointments |
| GET | `/api/v1/appointments/:id` | Appointment detail |
| POST | `/api/v1/appointments/:id/cancel` | Cancel appointment |
| POST | `/api/v1/appointments/:id/confirm` | Confirm (doctor) |
| POST | `/api/v1/appointments/:id/start` | Start consultation (doctor) |
| POST | `/api/v1/appointments/:id/complete` | Complete (doctor) |

### Consultations
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/consultations/:appointmentId/start` | Start consultation |
| GET | `/api/v1/consultations/:id` | Get consultation |
| POST | `/api/v1/consultations/:id/end` | End consultation |

### Triage
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/triage/assess` | AI symptom assessment (ML-powered, via backend) |
| GET | `/api/v1/triage/:id` | Get assessment |

### Triage Rule Engine (AI service, called directly from frontend)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/triage/assess-rule` | Deterministic rule-based assessment (no LLM) |
| GET | `/api/v1/triage/symptoms` | Symptom vocabulary grouped by category |
| GET | `/api/v1/triage/followups?previous=` | Dynamic follow-up questions for selected symptoms |

### Referrals & Follow-ups
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/referrals` | Create referral (doctor) |
| GET | `/api/v1/referrals` | List referrals (by role) |
| POST | `/api/v1/referrals/:id/accept` | Accept referral (doctor) |
| POST | `/api/v1/followups` | Create follow-up |
| GET | `/api/v1/followups` | List follow-ups |
| POST | `/api/v1/followups/:id/complete` | Complete follow-up |

### Consent & Privacy (DPDP)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/consent` | Grant consent |
| GET | `/api/v1/consent` | List consents |
| GET | `/api/v1/consent/summary` | Consent summary |
| GET | `/api/v1/consent/check?purpose=` | Check consent validity |
| POST | `/api/v1/consent/:id/withdraw` | Withdraw consent |
| POST | `/api/v1/privacy/requests` | Submit privacy request |
| GET | `/api/v1/privacy/requests` | List my requests |
| GET | `/api/v1/privacy/requests/:id` | Get request detail |
| PATCH | `/api/v1/privacy/requests/:id/decide` | Admin: approve/reject |
| POST | `/api/v1/privacy/export` | Export my data (consent) |
| POST | `/api/v1/privacy/export/full` | Export all data (clinical) |
| POST | `/api/v1/privacy/erase` | Erase all data |

### Key Management (E2EE)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/keys` | Register public key |
| GET | `/api/v1/keys/me` | Get my active key |
| GET | `/api/v1/keys/:userId` | Get user's active key |
| POST | `/api/v1/keys/batch` | Get keys for multiple users |
| POST | `/api/v1/keys/:keyId/revoke` | Revoke a key |
| GET | `/api/v1/keys/history/all` | Key history |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/retention/status` | Retention policy status |
| POST | `/api/v1/admin/retention/enforce` | Enforce retention |
| POST | `/api/v1/admin/breach/incidents` | Report incident |
| GET | `/api/v1/admin/breach/incidents` | List incidents |
| GET | `/api/v1/admin/breach/incidents/:id` | Incident detail |
| PATCH | `/api/v1/admin/breach/incidents/:id/step` | Advance incident step |

### Storage (GovDrive)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/storage/upload` | Upload encrypted file |
| GET | `/api/v1/storage/:id/download` | Download file |
| GET | `/api/v1/storage` | List files |
| DELETE | `/api/v1/storage/:id` | Delete file |

### AI
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/chat/stream` | Chat (proxied to AI service) |
| POST | `/api/v1/translate` | Translation |

### Other
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/hospitals/nearby` | Nearby hospitals (Mappls/Bhuvan) |
| GET | `/api/v1/notifications` | List notifications (+ `unread` count) |
| POST | `/api/v1/notifications/:id/read` | Mark notification read |
| GET | `/api/v1/audit` | Audit log (admin) |
| GET | `/api/v1/sync/state` | Offline sync state |
| POST | `/api/v1/sync/actions` | Stage offline actions |
| WS | `/socket.io/messaging` | E2EE messaging |

## Project Structure

```
.
├── frontend/                     React + Vite + Tailwind (SPA)
│   ├── src/
│   │   ├── api/                  Typed API client (CSRF) + domain services + E2EE
│   │   │   ├── client.ts         Fetch client (CSRF double-submit, typed errors)
│   │   │   ├── services.ts       Real backend domain services (no demo fallbacks)
│   │   │   └── backend.ts        SSE chat stream proxy + base URL
│   │   ├── context/              AuthContext (session/role), LanguageContext
│   │   ├── storage/              Hybrid local data layer (Dexie + E2EE)
│   │   │   ├── repositories/     chat/cache/draft/preferences/sync queue
│   │   │   ├── sync/             connectivity, conflict, sync manager
│   │   │   └── encryption/       AES-GCM + key management
│   │   ├── hooks/                useAsync, useOfflineStatus, useLocalChat, useDraft, …
│   │   ├── pages/                Screens by role (live-API driven)
│   │   ├── components/           Reusable UI (incl. RuleTriageWizard — shared rule-based triage)
│   │   ├── i18n/                 12 language dictionaries
│   │   └── data/                 Static content (marketing, navigation, tips)
│   ├── public/                   Static assets + service worker (sw.js) + official integration logos (images/gov/)
│   ├── Dockerfile                Multi-stage → nginx
│   └── nginx.conf                Reverse proxy
│
├── backend/                      Node.js + Express + MongoDB
│   ├── src/
│   │   ├── modules/              19 feature modules
│   │   │   ├── auth/             Mock + MeriPehchaan SSO
│   │   │   ├── appointments/     SlotLock atomic booking
│   │   │   ├── consultations/    BharatVC video
│   │   │   ├── triage/           AI symptom assessment
│   │   │   ├── consent/          DPDP consent lifecycle
│   │   │   ├── privacy/          DPDP data requests + erase
│   │   │   ├── admin/            Retention + breach incidents
│   │   │   ├── storage/          GovDrive encrypted files
│   │   │   ├── keys/             E2EE key management
│   │   │   └── sync/             Offline sync state + action staging
│   │   ├── integrations/         7 external service adapters
│   │   ├── sockets/              E2EE Socket.IO relay
│   │   ├── services/             Retention, breach, key mgmt, scheduler
│   │   ├── database/models/      19 Mongoose schemas (+ Idempotency/SyncState)
│   │   └── middleware/           Auth, CSRF, rate-limit, RBAC, idempotency
│   ├── ai-service/               Python FastAPI AI + ML engine + rule engine
│   ├── tests/                    Vitest
│   └── Dockerfile                Multi-stage → tsx
│
├── docs/                         Architecture + Security + Threats
├── docker-compose.yml            Full stack: 4 services
└── README.md                     This file
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, Leaflet |
| Backend | Node.js, Express, TypeScript, Mongoose, Socket.IO |
| AI Service | Python, FastAPI, rule-based + sentence-transformers |
| Database | MongoDB 7 (replica set) |
| Auth | JWT + CSRF double-submit, MeriPehchaan SSO |
| Messaging | Socket.IO with E2EE (server relay only) |
| Maps | Bhuvan (ISRO) + Mappls (MapMyIndia) |
| Video | BharatVC integration |
| Storage | GovDrive encrypted vault |
| Deployment | Docker Compose, Render |

## Frontend ↔ Backend Integration (live API)

The SPA is connected to the real backend — workspaces are populated from live data, not static demo arrays. Key pieces:

- **`src/api/client.ts`** — the single fetch wrapper. It reads the double-submit `csrf` cookie and echoes it as the `X-CSRF-Token` header on every state-changing request (the backend requires this), sends the `ssat` session cookie via `credentials: 'include'`, unwraps the `{ success, data }` envelope, and throws typed `ApiError`s (`network` / `unauthorized` / `forbidden` / `conflict` / `validation` / `unavailable` …) so every UI shows an honest loading / empty / error state. There are **no demo fallbacks**.
- **`src/context/AuthContext.tsx`** — reads `/auth/me` once, exposes `internalUserId`, `role`, `status`, `roleName`, and a `resolveBasePath()`. All role layouts (patient, doctor, specialist, worker, PHC, admin) now source identity from the session.
- **`src/api/services.ts`** — typed domain services for every module (auth, doctors, availability, appointments, referrals, triage, consultations, nearby hospitals, follow-ups, notifications, patients/users, consent, privacy, keys, sync). Each maps directly to a verified backend endpoint.
- **`src/hooks/useAsync.ts`** — standard `{ data, loading, error, reload }` async loader used across pages.

Connected flows:

| Page | Real integration |
|------|------------------|
| Patient Dashboard | `/auth/me`, `/users/me`, `/appointments`, `/referrals`, `/notifications` |
| AI Care Assistant | `/triage/assess` (multi-step symptom assessment) + `/chat/stream` SSE |
| Symptom Checker (patient) | `/triage/symptoms` + `/triage/followups` + `/triage/assess-rule` (deterministic rule engine, direct to AI service) |
| Worker Field Triage | `/triage/assess-rule` (rule-based) + session-local triage notes |
| Find Services | `/doctors` (search) + `/hospitals/nearby` (geolocation, Mappls/Bhuvan) |
| Appointments | `/appointments` list/cancel + SlotLock booking via `/doctors/:id/availability` → `/appointments` |
| Referrals / Follow-ups | `/referrals`, `/followups` (+ accept / complete actions) |
| Doctor & Specialist workspaces | `/appointments` (confirm/start/complete), `/referrals` (accept), derived patient lists |
| Notifications (all roles) | `/notifications` (+ mark-read) |
| Login (dev) | mock-login via `mockLogin()` (CSRF, session, role-gated navigation; two demo doctor identities — primary + Specialist Dr. 2 for A→B referrals) |
| Health Records (patient) | `/storage` (GovDrive encrypted documents; honest "unavailable" when not configured) |
| Medicines (patient) | Prescription sync not wired — honest empty state + safety tips |
| Patient referrals progress | Timeline derived from live `/referrals` statuses |
| Doctor consult workspace | Live patient appointments + referrals; prototype notes form (not persisted), honest empty states for history/labs/prescriptions |

**Honest integrations:** MeriPehchaan SSO, Bhuvan/Mappls maps, BharatVC video and GovDrive storage are mocked at the backend in this environment. The UI always shows an "integration ready" or "unavailable in this environment" state — it never fakes success. Official government integration logos (MeriPehchaan, ABHA, BharatVC, Mappls, GovDrive, Bhuvan/ISRO, NMC) are bundled in `frontend/public/images/gov/` for accurate branding. For the full feature walkthrough, see `docs/SCMA.md`.

## Security

- **E2EE**: Server never stores plaintext messages — relay only
- **Key Management**: 90-day key expiry, automatic rotation, revocation
- **SlotLock**: Atomic double-booking prevention via unique compound index
- **RBAC**: 29 permissions, 4 roles (PATIENT, DOCTOR, HEALTH_WORKER, ADMIN) — admin has NO patient-data access
- **CSRF**: Double-submit cookie pattern
- **Rate Limiting**: 300 req/min general, 10/min auth, 20/min AI
- **DPDP Act 2023**: Consent lifecycle, data access/deletion/grievance
- **Data Classification**: 4-level (PUBLIC/INTERNAL/PERSONAL/HEALTH) policies
- **Breach Handling**: 6-step workflow with 72-hour DPDP SLA
- **Scheduled Jobs**: Daily retention enforcement, consent expiry, key expiry

See [docs/SECURITY.md](docs/SECURITY.md) and [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) for full details.

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — System design, module structure, API reference
- [SECURITY.md](docs/SECURITY.md) — Threat model, E2EE, DPDP compliance
- [THREAT_MODEL.md](docs/THREAT_MODEL.md) — STRIDE analysis, 50+ threats
- [SCHEMA.md](docs/SCHEMA.md) — 19-model ER diagram with field details
- [BACKEND_AUDIT.md](docs/BACKEND_AUDIT.md) — Full backend inventory
- [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) — Docker + platform deployment
- [BACKEND_GUIDE.md](docs/BACKEND_GUIDE.md) — Backend development guide
- [FILE_STRUCTURE.md](docs/FILE_STRUCTURE.md) — Complete file map
- [PWA_TESTING_GUIDE.md](docs/PWA_TESTING_GUIDE.md) — PWA testing guide
- [HYBRID_DATA_ARCHITECTURE.md](docs/HYBRID_DATA_ARCHITECTURE.md) — MongoDB + IndexedDB offline-first design
- [SCMA.md](docs/SCMA.md) — Source Code & App: feature walkthrough, workspaces, live-API integration, demo flow

## Testing

```bash
cd backend && npx vitest run     # 36 tests (incl. hybrid data + idempotency)
cd backend && npx tsc --noEmit   # type-check
cd frontend && npm test          # 18 tests (storage + encryption)
cd frontend && npm run build     # production build
```

## License

Internal project — not licensed for distribution.
