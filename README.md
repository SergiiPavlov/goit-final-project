# Lehlehka Backend

Backend API for the **Lehlehka** team project.

## What's included (up to PR-10)
- Express + TypeScript skeleton
- Prisma + PostgreSQL schema
- Seed from JSON data (emotions / mom states / baby states)
- Auth (access + refresh, sessions stored in DB)
- Users: get current user, update profile, upload avatar
- Tasks: create, list by date, update isDone
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

Refresh:
```bash
curl -s -X POST http://localhost:4000/api/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

Logout (invalidate all sessions for the current user):
```bash
curl -s -X POST http://localhost:4000/api/auth/logout \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -d '{}'
```

## Smoke tests
See `docs/smoke.md`.

## Deploy
See `docs/deploy-render.md`.

## Notes
- Uploads are served from `/uploads/*`. In production you will likely want a persistent disk or object storage.
