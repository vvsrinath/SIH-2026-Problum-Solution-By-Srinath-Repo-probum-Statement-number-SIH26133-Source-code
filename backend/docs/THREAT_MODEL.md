# Threat Model — Swasthya Sathi Backend

Threats are analysed against the standard STRIDE categories. Mitigations
listed are implemented in the codebase; residual risks are documented.

## Assets
- Patient PII / health data (Appointment, TriageAssessment, PatientProfile).
- Authentication credentials / session tokens.
- E2EE message ciphertext (opaque; plaintext never leaves clients).
- Internal AI-service secret and integration API keys.
- Audit trail integrity.

## Trust boundaries
1. Client device <-> backend (HTTPS / WSS).
2. Backend <-> MongoDB (only backend DB user, TLS in production).
3. Backend <-> Python AI service (internal, shared-secret header).
4. Backend <-> external Gov adapters (MeriPehchaan, Bhuvan, Mappls, BharatVC,
   GovDrive) — outbound only, never incoming trust.
5. Backend <-> reverse proxy / load balancer.

---

## Threats

### Spoofing
- **T1 — Session/identity forgery.** Mitigated: signed JWT access tokens,
  server-side hashed sessions, HttpOnly cookie, secure flags, session
  revocation on logout; mock login disabled in production.
- **T2 — AI-service impersonation.** Mitigated: mandatory `X-AI-Service-Secret`
  header verified by the Python service; the URL is internal-only.

### Tampering
- **T3 — Slot double-booking.** Mitigated: atomic `SlotLock` insert with a
  unique `(doctorId, scheduledAt)` index inside the same transaction as the
  Appointment; losing writer gets 409. Tested in
  `tests/double-booking.test.ts`.
- **T4 — Tampered request input (injection, over-posting).** Mitigated: Zod
  schemas at every route boundary; `.strict()` on mutation bodies to reject
  unknown fields; body-size and upload limits; no raw SQL (Mongoose).

### Repudiation
- **T5 — Acting without an audit trail.** Mitigated: `services/audit.service.ts`
  records actor, action, resource, result, requestId and IP for consent,
  privacy, referral, follow-up and appointment actions. No secrets logged.

### Information disclosure
- **T6 — Over-exposure of patient data across roles.** Mitigated: RBAC matrix
  (`constants/roles.ts`) + `requirePermission`; resource-ownership checks
  (`requireResourceAccess`) return 404/403 without leaking the resource.
- **T7 — Raw AI/medical symptom text persisted.** Mitigated: TriageAssessment
  stores only a structured result (risk level, conditions, recommendation),
  never the raw symptom prompt. Set `rawSymptomsStored:false`.
- **T8 — E2EE plaintext read by server/admin.** Mitigated: no ChatMessage
  model; server relays opaque envelopes only and never inspects content.
  ADMINS have no plaintext access by design.
- **T9 — Error messages leaking internals.** Mitigated: centralized
  `errorHandler` sanitizes responses (no stacks/paths/secrets) in all envs.

### Denial of service
- **T10 — Brute force / API abuse.** Mitigated: global + focused rate limits
  (auth, AI, appointments, privacy); audit of denied permissions.
- **T11 — Oversized payloads.** Mitigated: `express.json({limit})` and
  `UPLOAD_MAX_BYTES`, plus 413 mapping.

### Elevation of privilege
- **T12 — Role escalation / cross-role access.** Mitigated: server-side RBAC
  matrix is the sole authority; role is re-derived from session/JWT per
  request, never trusted from the client. Tested in `tests/authz.test.ts`.
- **T13 — Cross-site request forgery.** Mitigated: SameSite=Lax HttpOnly cookie
  plus CSRF double-submit token check on state-changing requests
  (`middleware/csrf.ts`).

---

## Dependencies / infrastructure mitigations
- Secret injection at runtime (never baked into images; secrets use `${VAR:?}`
  in docker-compose). Vaulted in production.
- MongoDB: dedicated DB user, reconnect/idle timeouts, replica-set for
  transactions, TLS in production.
- TLS terminates at reverse proxy; `TRUST_PROXY` enables correct `req.ip` /
  rate limiting.
- Structured logs attach `requestId` for tracing without PII.

## Residual risks / accepted
- Rate limiting is in-memory (single instance). With multiple instances,
  move to a shared store (Redis) — the `REDIS_URL` env hook exists but the
  limiter is not yet Redis-backed.
- The AI service's safety of triage output depends on the underlying model;
  a clear disclaimer is always returned and no diagnosis is authoritative.
- CSRF relies on the browser honouring SameSite plus our double-submit header;
  clients must store and send the CSRF token from the body-safe cookie.
