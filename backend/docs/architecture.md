# Swasthya Sathi — Backend Architecture

Production-structured Node.js + TypeScript + Express + MongoDB backend for the
SIH26133 healthcare platform. The backend is the sole authority for identity,
authorization, business rules and audit; external government integrations are
isolated behind adapters that fail gracefully.

## High-level topology

```
Client (PWA / doctor / health-worker)  +  External Gov services
        |                                      ^
        | HTTPS / wss                          | (server-side adapters only)
        v                                      |
+--------------------- backend (Node/TS) ----------------+
|  Express app (helmet, cors, rate-limit, CSRF)          |
|   /api/v1 routers   (auth, users, patients, doctors,   |
|     appointments, availability, consultations, triage, |
|     hospitals, consent, privacy, referrals, followups, |
|     notifications, audit)                              |
|  Socket.IO E2EE message relay (never persisted)        |
|  Mongo persistence (appointments, consents, audit...)  |
+---------------------------------------------------------+
        | internal, authenticated (X-AI-Service-Secret)
        v
+-- Python (FastAPI) AI service: triage / chat / translate -
```

## Guidelines that shape the design

1. **Server is authority** — RBAC matrix (`constants/roles.ts`) decides what
   each role may do. Clients never decide authorization.
2. **Data minimization** — only store what the service requires (e.g.
   TriageAssessment stores a structured risk result, not raw symptom text; the
   User model stores minimized MeriPehchaan identity fields).
3. **E2EE end-to-end** — message content is opaque ciphertext; the server
   relays envelopes and never stores or inspects plaintext (no ChatMessage
   model exists by design).
4. **Graceful integration** — Bhuvan, Mappls, MeriPehchaan, BharatVC, GovDrive
   and the AI service are adapters returning explicit `unavailable` states
   rather than crashing when unconfigured/unreachable.
5. **Audit without secrets** — every auditable action funnels through
   `services/audit.service.ts`; details never include passwords, tokens, keys
   or E2EE content.
6. **Fail fast in production** — `config/env.ts` refuses to boot in
   production with mock auth or placeholder secrets.

## Key modules & data flow

### Auth / sessions (`modules/auth`, `services/session.service.ts`)
- Mock login exists only for non-production; real provider is MeriPehchaan
  (OAuth2) through `integrations/meripehchaan`.
- Access JWT `{ sub, role, type:'access', sessionId }`; the raw session token
  is hashed (SHA-256) and stored server-side; validated per request.
- HttpOnly `ssat` cookie + SameSite=Lax + secure in prod.

### Appointments — double-booking protection (`modules/appointments`)
- `SlotLock` with a **unique index on `(doctorId, scheduledAt)`** is created
  in the **same MongoDB transaction** as the Appointment.
- Exactly one concurrent booking for a doctor+slot wins; the loser gets a
  duplicate-key error mapped to `409 APPOINTMENT_SLOT_UNAVAILABLE`.
  See `tests/double-booking.test.ts`.

### Consultations (`modules/consultations`, `integrations/bharatvc`)
- Start/end a consultation bound to a real appointment (belongs-to checks).
- `BharatVCProvider` returns `INTEGRATION_UNAVAILABLE` when unconfigured.

### AI triage (`modules/triage`, `integrations/ai`, separate service)
- `POST /triage/assess` validates inputs (limits), calls the Python service
  with the internal secret header, and stores a **structured** assessment
  (risk level, possible conditions, recommended action, disclaimer) — never
  the raw symptom text.
- The AI service also exposes **deterministic rule-engine** endpoints (no LLM, no internal secret):
  - `POST /triage/assess-rule` — symptom-vocabulary triage with dynamic follow-ups, duration/severity/context risk adjustments; used by the Symptom Checker and Worker Triage frontend pages.
  - `GET /triage/symptoms` — symptom vocabulary grouped by category.
  - `GET /triage/followups?previous=` — dynamic follow-up questions for the selected symptoms.
- Rate-limited via `aiLimiter`.

### E2EE messaging (`sockets/*`)
- Socket.IO namespace `/messaging`, token-authenticated.
- `conversation:join` enforces membership via a real Appointment/Referral.
- `message:send` relays an opaque envelope (`ciphertext`, `nonce`) to other
  room members only — never echoed to the sender, never persisted.
  See `tests/e2ee-messaging.test.ts`.

### Consent & privacy (`modules/consent`, `modules/privacy`)
- Granular consent per purpose + withdraw, each audited.
- Data-subject privacy requests (access/correction/deletion/grievance) under
  `PERMISSION.PRIVACY_MANAGE_SELF`.

### Government integrations (adapters)
| Service | Purpose | Adapter |
|---|---|---|
| MeriPehchaan | National digital identity login | `integrations/meripehchaan` |
| Bhuvan (ISRO) | Health-facility geo data | `integrations/bhuvan` |
| Mappls (MapMyIndia) | Maps/geocoding / places | `integrations/mappls` |
| BharatVC | Video consultation | `integrations/bharatvc` |
| GovDrive | Encrypted document vault | `integrations/govdrive` |

Each adapter keeps its base URL/key in the environment and returns a stable
`unavailable` result when not configured.

## Security posture

- Helmet security headers, strict CORS allowlist, compression, cookie-parser.
- Global + per-route rate limits (auth, AI, appointments, privacy).
- CSRF double-submit protection (`middleware/csrf.ts`) in addition to
  SameSite=Lax.
- Input validation via Zod at the route boundary (`middleware/validation.ts`).
- Sanitized error responses (no stacks/secrets) regardless of NODE_ENV.
- Structured logging (pino) with secret redaction.
- See `docs/THREAT_MODEL.md` for the full threat analysis.

## Testing

`npm test` (vitest). Three suites cover the critical guarantees:
- `tests/double-booking.test.ts` — atomic slot-lock under concurrency.
- `tests/e2ee-messaging.test.ts` — member authorization + opaque relay.
- `tests/authz.test.ts` — RBAC matrix + `requirePermission`.

Integration suites connect to a MongoDB at `TEST_MONGODB_URI` (default
`mongodb://127.0.0.1:27017/swasthya_sathi_test`).

## Running locally / in Docker

See `docker-compose.yml` (MongoDB replica set + AI service + backend) and the
root `docs/DEPLOYMENT_GUIDE.md`.
