# Prisma migrations

Migrations are generated locally by developers/CI.

Initial migration (first run):

```bash
npm run prisma:migrate:dev -- --name init
```

Production deploy:

```bash
npm run prisma:migrate:deploy
```
