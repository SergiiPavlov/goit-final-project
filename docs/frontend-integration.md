Frontend Integration Guide (Next.js / Vite) — для команды (версия для начинающих)

Этот документ для фронтенд-разработчиков (junior / студент).
Цель: чтобы любой человек из команды мог за 15–30 минут:

подключить фронт к нашему backend API,

настроить авторизацию,

проверить приватные эндпоинты,

понять частые ошибки (401, CORS, cookies).

0. Что важно понять сразу (1 минута)
   Как у нас работает авторизация СЕЙЧАС

Backend использует JWT, но хранит их в cookies:

cookie accessToken

cookie refreshToken

После login/register/refresh backend отправляет в ответе Set-Cookie.
Браузер сохраняет cookies сам.

Для приватных запросов НЕ нужно передавать Authorization: Bearer ..., если вы работаете в браузере.
Вместо этого нужно включить отправку cookies:

Fetch: credentials: 'include'

Axios: withCredentials: true

✅ Это ключевая вещь. Если забыть — будет 401.

1. Где смотреть документацию API
   Swagger UI

GET /docs — Swagger UI

GET /docs/openapi.yaml — YAML контракт

Важно:

Swagger — это ориентир/контракт.

Если Swagger и реальный сервер расходятся — пишем backend-команде.

2. Base URL (куда фронт шлёт запросы)
   Локально (dev)

Backend: http://localhost:4000

Production (Render)

Backend: https://<ваш-render-домен>.onrender.com

3. Переменные окружения для фронта
   Next.js

Файл: .env.local

NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# в проде:

# NEXT_PUBLIC_API_BASE_URL=https://<ваш-render-домен>.onrender.com

Команды:

npm i
npm run dev

Vite

Файл: .env

VITE_API_BASE_URL=http://localhost:4000

# в проде:

# VITE_API_BASE_URL=https://<ваш-render-домен>.onrender.com

Команды:

npm i
npm run dev

4. CORS (если фронт и бек на разных доменах)

Backend использует allow-list через переменную CORS_ORIGINS.

Пример для локальной разработки:

CORS_ORIGINS=http://localhost:3000,http://localhost:5173

Next.js dev: http://localhost:3000

Vite dev: http://localhost:5173

Как понять, что это CORS

В консоли браузера будет:

CORS policy: No 'Access-Control-Allow-Origin' header ...

запрос в Network будет заблокирован

Решение:

Добавить домен фронта в CORS_ORIGINS

Перезапустить backend

5. Самое важное для фронта: cookies и credentials
   Почему это важно

По умолчанию браузер не отправляет cookies на другой домен/порт.

Поэтому все запросы к backend должны быть “с credentials”.

Fetch пример (правильно)
await fetch(`${API_BASE}/api/users/current`, {
method: "GET",
credentials: "include",
});

Axios пример (правильно)
axios.defaults.withCredentials = true;

await axios.get(`${API_BASE}/api/users/current`);

Если забыть credentials/withCredentials → будет 401, даже если пользователь “логинился”.

6. Авторизация: Register / Login
   Register

POST /api/auth/register

Login

POST /api/auth/login

Что происходит:

backend возвращает JSON (user, и иногда токены в теле — это не критично для фронта)

backend ставит cookies через Set-Cookie

браузер сохраняет cookies сам

✅ После этого можно вызывать приватные эндпоинты (например, /api/users/current) — тоже с credentials.

7. Как проверять “залогинен ли пользователь” на фронте

Стандартная проверка:

1. При старте приложения

Вызываем:
GET /api/users/current (с credentials)

200 → пользователь залогинен

401 → нужно refresh / или показать страницу логина

8. Refresh-flow (если сервер вернул 401)

Если GET /api/users/current вернул 401:

Делаем:
POST /api/auth/refresh (с credentials)

Важно:

refreshToken НЕ передаём в body

backend берёт refreshToken из cookies

Тело можно отправлять пустым:

{}

Дальше:

Если refresh 200 → повторяем GET /api/users/current

Если refresh снова 401 → делаем logout на фронте (чистим состояние UI) и редирект на /login

9. Приватные эндпоинты (все через cookies)

Примеры:

GET /api/users/current

PATCH /api/tasks/:id

DELETE /api/diaries/:id

GET /api/weeks/current

Во всех запросах:

credentials: "include" / withCredentials: true

10. Weeks — нюанс с dueDate
    Public week

GET /api/weeks/{weekNumber}

daysToChildbirth появляется только если передать dueDate:

GET /api/weeks/1?dueDate=2026-12-31

Если dueDate не передать — поля не будет. Это нормально.

11. Avatar upload (Cloudinary, multipart)
    Как работает

backend загружает файл в Cloudinary

в БД хранит полный абсолютный URL

если аватар не загружали — backend возвращает DEFAULT_AVATAR_URL

Endpoint

PATCH /api/users/avatar

Запрос

Content-Type: multipart/form-data

поле файла: avatar

cookies должны отправляться (credentials)

Пример curl:

curl -X PATCH http://localhost:4000/api/users/avatar \
 -b cookies.txt \
 -F "avatar=@avatar.png"

Важно для фронта

avatarUrl — уже готовый URL.

❌ Не добавлять API_BASE_URL
❌ Не “склеивать” строки

Можно сразу:

<img src={user.avatarUrl} alt="User avatar" />

12. COOKIE_SECURE=false — нужно ли добавлять в ENV?

Да, для локальной разработки по HTTP это правильная настройка.

Смысл:

если COOKIE_SECURE=true, браузер может не принимать cookie на http:// (Secure cookies только для https)

на localhost это часто ломает авторизацию в браузере

Рекомендация:

локально: COOKIE_SECURE=false

прод (https): COOKIE_SECURE=true

13. Как протестировать руками (пошагово)

Запустить backend

Вызвать register/login из фронта (или Postman)

Открыть DevTools → Application → Cookies → убедиться что появились cookies

Сделать GET /api/users/current из фронта (обязательно credentials)

Если 401:

проверь credentials

проверь CORS_ORIGINS

проверь COOKIE_SECURE

14. Bash smoke (локальная проверка cookies-авторизации)

Это тот тест, который ты уже запускал — он правильный.
Вот компактная версия, которую можно дать команде:

set -euo pipefail

BASE="${BASE:-http://localhost:4000}"
JAR="${JAR:-/tmp/cookies_test.txt}"
rm -f "$JAR"

EMAIL="fe*test*$(date +%s)_$RANDOM@example.com"
PASS="secret123!"
NAME="FE Test"

echo "== 1) Register (should set cookies) =="
curl -sS -i -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -c "$JAR" \
 -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
 | grep -i "set-cookie" || (echo "No Set-Cookie found" && exit 1)

echo "== 2) Current user via cookies =="
curl -sS -i "$BASE/api/users/current" -b "$JAR" | head -n 25

echo "== 3) Refresh via cookies =="
curl -sS -i -X POST "$BASE/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -b "$JAR" -c "$JAR" \
 -d "{}" | head -n 35

echo "DONE"

15. Частые проблемы (и что делать)
    “401 Unauthorized”

забыли credentials: include / withCredentials: true

cookie не сохранились из-за COOKIE_SECURE=true на http

CORS не настроен для credentials

“CORS blocked”

добавить домен фронта в CORS_ORIGINS

убедиться, что backend разрешает credentials

“В Swagger не видно cookies”

Swagger не идеален для cookie-flow. Проверяйте через браузер / curl jar.
