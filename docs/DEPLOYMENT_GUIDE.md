# Swasthya Sathi — Deployment Guide

## Quick Start

### Local Development (no Docker)

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev                # http://localhost:8000

# Frontend (in another terminal)
cd frontend
npm install
npm run dev                # http://localhost:5173
```

### Docker (recommended for full stack)

```bash
cp .env.example .env        # fill in SESSION_SECRET, JWT_SECRET
docker compose up --build   # frontend + backend + MongoDB
# open http://localhost:5173
```

| Service | Container | URL |
|---------|-----------|-----|
| Frontend | swasthya-frontend | http://localhost:5173 |
| Backend | swasthya-backend | http://localhost:8000 |
| MongoDB | swasthya-mongodb | mongodb://localhost:27017 |

```bash
docker compose up -d --build       # background
docker compose logs -f backend     # watch logs
docker compose down                # stop
docker compose down -v             # stop + delete data
```

### Docker: environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SESSION_SECRET` | Yes | — | Random string for session signing |
| `JWT_SECRET` | Yes | — | Random string for JWT signing |
| `AUTH_PROVIDER` | No | `mock` | `mock` (dev) or `meripehchaan` |
| `CORS_ORIGINS` | No | `http://localhost:5173,http://localhost:80` | Allowed origins |
| `AI_SERVICE_URL` | No | `http://localhost:8000` | AI service (self) |
| `AI_SERVICE_SECRET` | No | `dev-ai-internal-secret-9f2` | AI shared secret |

---

## Deployment Platforms

### Vercel (frontend only)

1. Push to GitHub
2. Vercel → Add New → Project → Import
3. Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
4. Set env var `VITE_API_BASE_URL` to your backend URL
5. Deploy

### Netlify (frontend only)

```toml
[build]
  command = "cd frontend && npm install && npm run build"
  publish = "frontend/dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### GitHub Pages

Workflow at `.github/workflows/deploy.yml` — triggers on push to `main`.
Requires **Settings → Pages → Source: GitHub Actions**.

### Docker on a VPS

```bash
# On the server
git clone <repo>
cd <repo>
cp .env.example .env
# Edit .env with real secrets
docker compose up -d --build

# Optional: reverse proxy with Caddy or Nginx for HTTPS
```

### Render / Railway / Fly.io

Each service can be deployed separately:
- **Backend**: Dockerfile in `backend/`, port 8000
- **Frontend**: Dockerfile in `frontend/`, port 80 (nginx)
- **MongoDB**: Use managed MongoDB (MongoDB Atlas) or self-hosted

---

## Pre-Deployment Checklist

- [ ] `docker compose build` succeeds (or `npm run build` in both dirs)
- [ ] `SESSION_SECRET` and `JWT_SECRET` are strong random values
- [ ] `AUTH_PROVIDER` is NOT `mock` in production
- [ ] `CORS_ORIGINS` includes your frontend domain
- [ ] MongoDB has replica set enabled (required for transactions)
- [ ] HTTPS enabled (use Caddy, Nginx, or cloud provider)
- [ ] Service worker registered (DevTools → Application)
- [ ] All routes work (deep links + refresh)
- [ ] PWA manifest valid

---

## Architecture

```text
                    ┌─────────────┐
                    │   Browser   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   nginx     │  :80 (Docker) / :5173 (dev)
                    │  frontend   │
                    └──────┬──────┘
                           │ /api/*
                    ┌──────▼──────┐
                    │   Express   │  :8000
                    │   backend   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  MongoDB    │  :27017 (replica set)
                    └─────────────┘
```

- **Dev mode**: Vite dev server proxies `/api` to `localhost:8000`
- **Docker mode**: nginx proxies `/api` to `backend:8000`
- **Production**: set `VITE_API_BASE_URL` at build time

---

## Troubleshooting

### `docker compose up` fails on MongoDB health check
MongoDB replica set init can take 30-60s on first run. Wait for it or check:
```bash
docker compose logs mongodb
```

### Frontend shows blank page in Docker
Check that `nginx.conf` is in `frontend/` and the build succeeded:
```bash
docker compose logs frontend
```

### CORS errors in browser
Add your frontend URL to `CORS_ORIGINS` in `.env`:
```
CORS_ORIGINS=http://localhost:5173,https://your-domain.com
```

### API calls return 404 in Docker
nginx proxies `/api/*` to `backend:8000`. Make sure the backend container is running:
```bash
docker compose ps
docker compose logs backend
```

### Service Worker shows old version
Bump the cache version in `frontend/public/sw.js`:
```js
const CACHE_NAME = 'swasthya-sathi-v7';
```
Then rebuild and deploy.

---

## Security

- `httpOnly: false` on CSRF cookie (readable by frontend JS)
- Session cookies are `httpOnly: true` + `sameSite: lax`
- Helmet.js sets security headers
- Rate limiting on auth and AI endpoints
- CORS restricted to configured origins

---

## Support

- **Vite**: https://vitejs.dev
- **React Router**: https://reactrouter.com
- **Tailwind CSS**: https://tailwindcss.com
- **Docker**: https://docs.docker.com/compose
- **MongoDB**: https://www.mongodb.com/docs

---

*Last Updated: August 31, 2026*
