# Smoke checks

Цель: быстро убедиться, что API работает после деплоя/изменений.

## Вариант A — скрипт (Git Bash / WSL / Linux)

1) Запусти сервер (локально или на Render).
2) Выполни:

```bash
chmod +x scripts/smoke.sh
BASE_URL=http://localhost:4000 EMAIL=owner@example.com PASSWORD=secret123 ./scripts/smoke.sh
```

Примечания:
- Скрипт делает `register` (ошибка «уже существует» игнорируется), потом `login` и выполняет базовые запросы.
- Если на проде не нужен `register`, просто задай логин существующего юзера.

## Вариант B — вручную (curl)

```bash
BASE=http://localhost:4000

curl -i "$BASE/health"

curl -i -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@example.com","password":"secret123","name":"Owner"}'

LOGIN_JSON="$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@example.com","password":"secret123"}')"

ACCESS="$(echo "$LOGIN_JSON" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')"

curl -i -X POST "$BASE/api/tasks" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test task","date":"2026-01-06"}'

# optional: mark task done (status)
# TASK_ID="<paste id from create task response>"
# curl -i -X PATCH "$BASE/api/tasks/$TASK_ID/status" \
#   -H "Authorization: Bearer $ACCESS" \
#   -H "Content-Type: application/json" \
#   -d '{"isDone":true}'

curl -i "$BASE/api/tasks?date=2026-01-06" \
  -H "Authorization: Bearer $ACCESS"

curl -i "$BASE/api/weeks/10"

curl -i "$BASE/docs/openapi.yaml"
```