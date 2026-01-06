# Deploy to Render

Ниже — минимальный, рабочий сетап для Render (Web Service).

## 1) Prerequisites

- Репозиторий на GitHub.
- PostgreSQL (Render Postgres / Neon / Supabase и т.п.).

## 2) Render Web Service

Create → **Web Service** → подключите репозиторий.

Рекомендуемые настройки:

- Runtime: Node
- Build Command:

```bash
npm ci && npm run build && npm run prisma:migrate:deploy
```

- Start Command:

```bash
npm start
```

## 3) Environment variables

Скопируйте `.env.example` в настройки Render и заполните реальные значения.

Минимально обязательные:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Остальное можно оставить по примеру.

## 4) Persistent files (uploads)

Аватары сохраняются в `uploads/` в файловой системе сервера.

Важно: на free-инстансах Render файловая система обычно **эпемерная** (после перезапуска файлы могут пропасть). Если нужно сохранять аватары долговременно — подключайте **Persistent Disk** или выносите файлы в S3-совместимое хранилище.

## 5) Quick validation

После деплоя:

```bash
curl -i https://<YOUR-RENDER-URL>/health
curl -i https://<YOUR-RENDER-URL>/docs/openapi.yaml
```

И затем выполните smoke-скрипт из `docs/smoke.md`.
