# Lehlehka Backend (PR-04 Auth)

This is PR-04 of the backend plan for the **Lehlehka** team project.

## What's included
- Express + TypeScript skeleton (PR-01)
- Prisma + PostgreSQL schema (PR-02)
- Seed from JSON data (PR-03)
- **Auth (PR-04)**:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh` (refresh rotation, sessions stored in DB)
  - `POST /api/auth/logout` (Bearer access token; optionally invalidate one session)

## Requirements
- Node.js 18+ (recommended 20+)
- PostgreSQL (local or cloud)
- npm

## Setup
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

## Useful URLs
- Health check: `GET /health`
- DB check: `GET /health/db`
- Swagger UI: `GET /docs`

## Notes
- Next PR: Users (me, update profile, avatar upload) + protected routes base.
