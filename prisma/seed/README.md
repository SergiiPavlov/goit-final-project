# Prisma seed (PR-03)

This project includes a deterministic seed that loads reference data into PostgreSQL.

## What is seeded
- `Emotion` from `prisma/seed/data/emotions.json`
- `WeekMomState` from `prisma/seed/data/mom_states.json`
- `WeekBabyState` from `prisma/seed/data/baby_states.json`

Seed uses **upsert** by primary keys (`Emotion.id`, `weekNumber`), so it is safe to rerun.

## Run
```bash
npm run prisma:seed
```

## Notes
- Seed expects database schema to be migrated (`npm run prisma:migrate:dev`).
- For local development you can export `PGPASSWORD=...` in your shell to avoid interactive password prompts.
