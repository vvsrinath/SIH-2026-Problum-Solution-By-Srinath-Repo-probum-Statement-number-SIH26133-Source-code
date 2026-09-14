# SCMA — Source Code & App

**Swasthya Sathi — Smart India Hackathon 2026 (SIH26133)**

This document is the single source for *what the app is*, *what it can do*, *how the workspaces map to the real backend*, and *how to demo it*. It complements the API reference in `README.md` and the lower-level design in `docs/ARCHITECTURE.md`.

---

## 1. What this is

Swasthya Sathi is a full-stack healthcare platform connecting patients, doctors, specialists, field health workers, PHCs and administrators across rural India. It is built on React + Vite, Node/Express + MongoDB, and a Python AI service, aligned with the DPDP Act 2023 and Indian Government service integrations (MeriPehchaan, Bhuvan/Mappls, BharatVC, GovDrive).

The app runs as a 4-service Docker Compose stack:

| Service | Stack | Port | Role |
|---------|-------|------|------|
| Frontend | React + Vite + Tailwind + nginx | 5173 | SPA (PWA) |
| Backend | Node + Express + TypeScript | 8000 | 55+ REST endpoints, Socket.IO |
| AI | FastAPI (Python) | 8100 | Rule-based + ML assistant |
| MongoDB | Mongo 7 (replica set `rs0`) | 27018 | 19 collections |

---

## 2. Workspaces (by role)

Each role has its own workspace and navigation, all wired to the live backend through a shared session (`AuthContext`).

### Patient (`/patient`)
- **Dashboard** — greeting, care journey timeline, upcoming appointments, recent referrals, activity feed and notifications digest — all from real APIs.
- **AI Care Assistant** (`/patient/assistant`) — multi-step **symptom assessment** calling `/triage/assess`, with risk badge, possible conditions, missing info, recommended action and a clear "not a definitive diagnosis" disclaimer. Urgent cases surface an emergency (call 108) banner. Conversational follow-up uses SSE `/chat/stream`.
- **Symptom Checker** (`/patient/symptom-checker`) — deterministic **rule-engine** triage (no LLM required). Pick symptoms from a categorized vocabulary, answer dynamic follow-up questions (duration/severity/context), and get an immediate risk assessment with conditions, red flags and recommended next steps.
- **Find Services** (`/patient/find-healthcare`) — find a doctor (`/doctors`, filter by specialization) **and** find nearby care (`/hospitals/nearby` using browser geolocation + Leaflet map). Mappls/Bhuvan integration is shown honestly (see §6).
- **Appointments** (`/patient/appointments`) — real appointment list/cancel **and** a SlotLock booking flow: pick a doctor + mode, candidate slots are computed from `/doctors/:id/availability`, and booking calls `POST /appointments`. Conflicts return 409 → honest "just booked" state. No fake success.
- **Referrals** (`/patient/referrals`) — real referral list from `/referrals`.
- **Follow-ups** (`/patient/follow-up`) — real follow-ups with "mark complete".
- **Health Records** (`/patient/records`) — encrypted documents from `/storage` (GovDrive). Honest states: loading / empty / "unavailable in this environment" when the integration isn't configured. Documents are never shown as fake plaintext records.
- **Medicines** (`/patient/medicines`) — honest empty state (prescription sync not yet wired) plus medicine-safety tips. No fabricated prescriptions.
- **Consult Online** (`/patient/consult-online`) — honest placeholder pointing to real appointment booking (choose a Video/Audio mode).

### Doctor (`/doctor`) & Specialist (`/specialist`)
- **Dashboard** — real upcoming/in-progress appointments + incoming referrals, stats computed from live data.
- **Appointments** — real list with **Confirm → Start → Complete** state machine (`confirm`/`start`/`complete` endpoints).
- **Patients** — derived unique patient list from the doctor's appointments (no fabricated data).
- **Referrals** — real list with **Accept** for inbound `CREATED` referrals (`acceptReferral`).

### Health Worker (`/worker`) & PHC (`/phc`) & Admin (`/admin`)
- **Worker Triage** (`/worker/triage`) — field health workers run the same **rule-engine** assessment for a patient (enter patient name, select symptoms, answer dynamic follow-ups) and see the risk assessment immediately. Results can be **saved as triage notes** to a session-local list for that visit; the "Triage notes" tab shows everything saved in the current session.
- Routed workspaces with per-role navigation and shared live **Notifications** page.

### Shared
- **Notifications** (`/notifications` in every role) — real `/notifications` with unread count, type badges and click-to-mark-read.

---

## 3. Live-API integration (the "anti-demo" layer)

Previously the frontend silently fell back to static `src/data/*` arrays whenever an API call returned `null` — the app *felt* like a demo. That layer is gone.

- **`src/api/client.ts`** — single typed fetch wrapper. Reads the double-submit `csrf` cookie and sends it as `X-CSRF-Token` on every mutating request (required by the backend), sends the `ssat` session cookie, unwraps the `{ success, data }` envelope, and throws typed `ApiError`s `{ kind, status, code }` (`network`, `unauthorized`, `forbidden`, `conflict`, `validation`, `unavailable`, `server`).
- **`src/context/AuthContext.tsx`** — loads `/auth/me`, exposes `internalUserId`, `role`, `status`, `roleName`, `signOut()`, `resolveBasePath()`. Every role layout sources its identity from the session.
- **`src/api/services.ts`** — typed domain services for every module, mapped to verified endpoints. No demo fallback anywhere.
- **`src/hooks/useAsync.ts`** — standard `{ data, loading, error, reload }` loader; pages render `LoadingState` / `EmptyState` / `ErrorState` (with retry) honestly.

> **Design rule:** a request either returns real data or surfaces a clear error/empty state. The app never fabricates a success.

---

## 4. Honest integrations

Government integrations are **mock/skeleton** at the backend in this environment:

- **MeriPehchaan SSO** — mock-login sets a real `ssat` session; the real SSO flow is "integration ready".
- **Bhuvan / Mappls maps** — `/hospitals/nearby` returns `available`/`providers` flags. If a provider is inactive, the UI shows **"Unavailable in this environment"** rather than fake hospitals.
- **BharatVC video** — consultation start/join represented; live video depends on the external service.
- **GovDrive storage** — encrypted vault endpoints exist; actual uploads require credentials.
- **Official logos** — government integration logos (MeriPehchaan, ABHA/NHM, BharatVC, Mappls, GovDrive, Bhuvan/ISRO, NMC) are bundled in `frontend/public/images/gov/` for accurate branding; used for identification only.

The UI always communicates readiness/unavailability truthfully.

---

## 5. Demo flow (acceptance path)

1. `docker compose up --build` → open http://localhost:5173
2. **Login** as a **Patient** (mock-login) → land on the Patient Dashboard populated with live data.
3. **AI Care Assistant** → run a symptom assessment (e.g. "fever and headache for 2 days") → see risk level + recommended action.
4. **Find Services** → search doctors by specialization → pick one.
5. **Appointments** → book a slot through the SlotLock flow → it appears in the list.
6. **Referrals & Follow-ups** → confirm live entries / accept actions. Two demo doctors exist (Doctor A + Specialist Doctor B on the login page); referrals created by A and addressed to B are accepted by B — a true A→B referral chain. Patients complete their **own** follow-ups (`FOLLOWUP_COMPLETE_SELF` + self-ownership check — completing someone else's returns 403); doctors and health workers can complete any assigned follow-up.
7. Log in as a **Doctor** → confirm/start/complete an appointment, accept an inbound referral.
8. Check **Notifications** across roles → mark items read.

---

## 6. Current status vs. remaining

**Done**
- Real auth context + typed API client + typed domain services (no demo fallbacks).
- Patient, Doctor, Specialist workspaces live-wired (dashboard, appointments incl. SlotLock booking, referrals, follow-ups, notifications, triage).
- Demo footer removed; identity sourced from session.
- Login page uses real `mockLogin` (CSRF + session + role-gated navigation); role cards are honest dev sessions, no fabricated identities.
- Health Records (storage-backed), Medicines (honest empty + tips), Patient Consultation (live appointments/referrals + labelled prototype form), referral-progress timeline derived from live data.
- Rule-based **Symptom Checker** (`/patient/symptom-checker`) and **Worker Field Triage** (`/worker/triage`) powered by a deterministic JSON rule engine (symptom vocabulary → dynamic follow-ups → risk assessment with duration/severity/context adjustments).
- Official government integration logos bundled in `frontend/public/images/gov/`.

**Outstanding / lower-priority**
- E2EE messaging UI/relay wiring, BharatVC live video, PHC/Admin deep flows, and the public **Home** hero can be deepened further.

---

## 7. Verification

```bash
cd frontend && npx tsc --noEmit   # 0 errors
cd frontend && npm run build      # production build OK (chunk-size warning only)
cd backend && npx tsc -p tsconfig.json --noEmit   # 0 errors
cd backend && npm test            # 36/36 pass (incl. SlotLock double-booking + authz)
```

A live end-to-end transcript (login → triage → SlotLock booking → consultation → referral → follow-up → notifications, with real IDs) is captured in `docs/live_verification.txt`.

See `README.md` → *Frontend ↔ Backend Integration* for the endpoint-to-page map.
