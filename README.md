# Lehlehka Backend

Backend API for the **Lehlehka** team project.

## What's included (up to PR-10)
- Express + TypeScript skeleton
- Prisma + PostgreSQL schema
- Seed from JSON data (emotions / mom states / baby states)
- Auth (access + refresh, sessions stored in DB)
- Users: get current user, update profile, upload avatar
- Tasks: create, list by date, update isDone (status)
- Diaries: create + list by date
- Reference data: emotions + weeks dashboard
- Weeks: public week dashboard + private endpoints (current / baby / mom)
- Swagger UI + raw OpenAPI spec endpoints

## Requirements
- Node.js 18+ (recommended 20+)
- PostgreSQL (local or cloud)
- npm

## Setup (local)
1) Install dependencies
```bash
npm install
```

2) Create `.env`
```bash
cp .env.example .env
```
Set:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`

3) Create DB schema (initial migration)
```bash
npm run prisma:migrate:dev -- --name init
```

4) Seed reference data
```bash
npm run prisma:seed
```

5) Run in dev mode
```bash
npm run dev
```

## Swagger / OpenAPI
- Swagger UI: `GET /docs`
- Raw spec (YAML): `GET /docs/openapi.yaml`
- Raw spec (JSON): `GET /docs/openapi.json`

## Quick test (curl)
Register:
```bash
curl -s -X POST http://localhost:4000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test@example.com","password":"secret123"}'
```

Login:
```bash
curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"secret123"}'
```

Tip:
- In browsers, the backend primarily uses **HttpOnly cookies** (`accessToken`, `refreshToken`).
- For scripts/Postman you can use either cookies or `Authorization: Bearer <ACCESS_TOKEN>`.

Cookie-based flow (recommended for frontend-like testing):
```bash
BASE='http://localhost:4000'

# login and save cookies
curl -s -c cookies.txt -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@example.com","password":"secret123"}' > /dev/null

# private request with cookies
curl -s -b cookies.txt "$BASE/api/tasks?date=2026-01-15" | cat; echo

# refresh using cookies (empty JSON body is enough)
curl -s -b cookies.txt -X POST "$BASE/api/auth/refresh" \
  -H 'Content-Type: application/json' \
  -d '{}' | cat; echo
```

Local CORS note (Vite): set `CORS_ORIGINS=http://localhost:5173` (or add it to the list) and keep `COOKIE_SECURE=false`.

Refresh:
```bash
curl -s -X POST http://localhost:4000/api/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

Note: `refreshToken` can be provided either in JSON body (example above) or via cookie.

Logout (invalidate all sessions for the current user):
```bash
curl -s -X POST http://localhost:4000/api/auth/logout \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -d '{}'
```

Create a task:
```bash
curl -s -X POST http://localhost:4000/api/tasks \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test task","date":"2026-01-13"}'
```

Update task status (recommended endpoint):
```bash
curl -s -X PATCH http://localhost:4000/api/tasks/<TASK_ID>/status \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"isDone":true}'
```

Upload avatar:
```bash
curl -i -X PATCH http://localhost:4000/api/users/avatar \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -F 'avatar=@./avatar.jpg'
```
Response is `text/plain` (a direct URL). If your client needs the updated user object, call `GET /api/users/current`.

## Smoke tests
See `docs/smoke.md`.

## Deploy
See `docs/deploy-render.md`.

## Notes
- Uploads are served from `/uploads/*`. In production you will likely want a persistent disk or object storage.
