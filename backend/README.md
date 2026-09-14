# Swasthya Sathi — Backend (Node.js + TypeScript)

Production-structured backend for the SIH26133 healthcare platform.

## Prerequisites
- Node.js ≥ 20
- MongoDB (replica-set mode for transactions) — `docker compose up mongodb`
- Python 3.13 for the separate AI service (`ai-service/`)

## Setup
```bash
cp .env.example .env          # then fill in real values
npm install
npm run typecheck
```

## Run
```bash
npm run dev                    # tsx watch (development)
npm run build && npm start     # compiled (production)
```

The AI service is a separate Python FastAPI app under `ai-service/` (runs on
`127.0.0.1:8000` by default). The backend calls it with the shared internal
secret header. API docs are at `http://localhost:8080/docs` (Swagger/OpenAPI).

## Docker (all-in-one)
```bash
AI_SERVICE_SECRET=... SESSION_SECRET=... JWT_SECRET=... docker compose up --build
```
Starts MongoDB (replica set), the AI service, and the backend. See
`docker-compose.yml`.

## Tests
```bash
npm test                       # vitest: double-booking, E2EE, authz
```
Integration suites need MongoDB at `TEST_MONGODB_URI` (default the test DB).

## Docs
- `docs/architecture.md` — modules, data flow, security posture.
- `docs/THREAT_MODEL.md` — STRIDE threat analysis and mitigations.
- `../../docs/BACKEND_GUIDE.md`, `DEPLOYMENT_GUIDE.md`, `FILE_STRUCTURE.md`
  (repo root) — operational guides.
