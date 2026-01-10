# Frontend Integration Guide (Next.js / Vite) — для команды 
Этот документ для фронтенд-разработчиков (junior / студент).
Цель: чтобы любой человек из команды мог за 15–30 минут:
- подключить фронт к нашему backend API,
- настроить авторизацию,
- проверить приватные эндпоинты,
- понимать типичные ошибки (401, CORS, cookies).

---

## 0) Самое важное (1 минута)

### Как у нас работает авторизация СЕЙЧАС
Backend использует JWT, но **хранит токены в cookies**:
- cookie `accessToken`
- cookie `refreshToken`

После `login/register/refresh` backend отправляет в ответе заголовки **`Set-Cookie`**.
Браузер сохраняет cookies автоматически. :contentReference[oaicite:5]{index=5}

### Что должен помнить фронт
Для приватных запросов в браузере **НЕ нужно** вручную передавать `Authorization: Bearer ...`,
если вы работаете через cookies.

Нужно включить отправку cookies на запросах:
- **Fetch:** `credentials: 'include'`
- **Axios:** `withCredentials: true`

Это критично: **если забыть — будет 401** (даже если вы “только что логинились”).:contentReference[oaicite:6]{index=6}

---

## 1) Где смотреть API-документацию

- Swagger UI: `GET /docs`
- OpenAPI YAML: `GET /docs/openapi.yaml`

Важно:
- Swagger — ориентир/контракт.
- Если Swagger и реальный сервер расходятся — пишем backend-команде.

---

## 2) Base URL (куда фронт шлёт запросы)

### Локально (dev)
Backend: `http://localhost:4000`

### Production (Render)
Backend: `https://<ваш-render-домен>.onrender.com`

---

## 3) Переменные окружения для фронта

### Next.js
Файл: `.env.local`
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
# в проде:
# NEXT_PUBLIC_API_BASE_URL=https://<ваш-render-домен>.onrender.com
Команды:

bash
Копіювати код
npm i
npm run dev
Vite
Файл: .env

env
Копіювати код
VITE_API_BASE_URL=http://localhost:4000
# в проде:
# VITE_API_BASE_URL=https://<ваш-render-домен>.onrender.com
Команды:

bash
Копіювати код
npm i
npm run dev
4) CORS (когда фронт и бек на разных доменах/портах)
Backend использует allow-list через переменную CORS_ORIGINS (на стороне backend).
frontend-integration


Для локальной разработки обычно нужно
Next dev: http://localhost:3000

Vite dev: http://localhost:5173

Пример, что чаще всего требуется на бэке:

env
Копіювати код
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
(Если у вас другой порт — добавьте свой.)

Как понять, что это CORS
В консоли браузера: CORS policy: No 'Access-Control-Allow-Origin'...

В Network запрос будет заблокирован.

Что делать
Сообщить backend’у ваш origin (например http://localhost:5173).

Backend добавляет origin в CORS_ORIGINS.

Перезапускаем backend.

5) “Cookies + credentials” — обязательная настройка для всех запросов
По умолчанию браузер не отправляет cookies на другой домен/порт,
поэтому все запросы к backend должны быть с credentials.
frontend-integration


Fetch (правильно)
js
Копіювати код
await fetch(`${API_BASE}/api/users/current`, {
  method: "GET",
  credentials: "include",
});
Axios (правильно)
js
Копіювати код
import axios from "axios";

axios.defaults.withCredentials = true;

await axios.get(`${API_BASE}/api/users/current`);
Если забыть credentials/withCredentials → будет 401. 
frontend-integration


6) Авторизация: Register / Login
Register
POST /api/auth/register

Login
POST /api/auth/login

Что происходит:

backend возвращает JSON (user + иногда токены в теле — это не критично для фронта),

backend ставит cookies через Set-Cookie,

браузер сохраняет cookies сам. 
frontend-integration


После этого можно вызывать приватные эндпоинты (например GET /api/users/current) — тоже с credentials.

7) Как проверять “залогинен ли пользователь” на фронте
Стандартный сценарий:

На старте приложения вызываем:
GET /api/users/current (с credentials)

Если 200 → пользователь залогинен

Если 401 → делаем refresh-flow или показываем логин
frontend-integration


8) Refresh-flow (если сервер вернул 401)
Если GET /api/users/current вернул 401, делаем:
POST /api/auth/refresh (с credentials)

Важно:

refreshToken НЕ передаём в body

backend берёт refreshToken из cookies

тело можно отправлять пустым {}
frontend-integration


Дальше:

если refresh 200 → повторяем GET /api/users/current

если refresh снова 401 → делаем logout на фронте (чистим состояние UI) и редиректим на /login
frontend-integration


9) Приватные эндпоинты (все через cookies)
Примеры:

GET /api/users/current

POST /api/tasks

PATCH /api/tasks/:id

DELETE /api/diaries/:id

GET /api/weeks/current

Во всех запросах: credentials: "include" / withCredentials: true
frontend-integration


10) Weeks — нюанс с dueDate
Для public weeks:

GET /api/weeks/{weekNumber}

Поле daysToChildbirth появляется только если передать dueDate:

GET /api/weeks/1?dueDate=2026-12-31

Если dueDate не передать — поля не будет. Это нормально. 
frontend-integration


11) Avatar upload (Cloudinary, multipart)
Как работает:

backend загружает файл в Cloudinary

в БД хранит полный абсолютный URL

если аватар не загружали — backend возвращает DEFAULT_AVATAR_URL
frontend-integration


Endpoint:

PATCH /api/users/avatar

Запрос:

Content-Type: multipart/form-data

поле файла: avatar

cookies должны отправляться (credentials)

Важно для фронта:

avatarUrl — уже готовый URL.

Не добавлять API_BASE_URL

Не “склеивать” строки
Можно сразу:

jsx
Копіювати код
<img src={user.avatarUrl} alt="User avatar" />

frontend-integration


frontend-integration


12) COOKIE_SECURE — что ставить локально и в проде
Да, это правильная настройка:

локально (HTTP): COOKIE_SECURE=false

прод (HTTPS): COOKIE_SECURE=true

Смысл:
если COOKIE_SECURE=true, браузер может не принимать cookie на http:// (Secure cookies только для https),
на localhost это часто ломает авторизацию в браузере.
frontend-integration


13) Как протестировать руками в браузере (очень пошагово)
Цель: убедиться, что cookies реально ставятся и реально отправляются дальше.

Шаг 1 — откройте DevTools
Откройте ваш фронт (например http://localhost:5173)

Откройте DevTools (F12)

Вкладка Network:

включите “Preserve log” (чтобы запросы не пропадали при переходах)

Вкладка Application (Chrome) → Cookies

Шаг 2 — выполните register/login с фронта
В интерфейсе фронта нажмите Register или Login

В Network найдите запрос:

POST /api/auth/register или POST /api/auth/login

Шаг 3 — проверьте, что сервер поставил cookies (Set-Cookie)
Кликните на запрос в Network

Откройте вкладку Headers

Найдите в Response Headers строки Set-Cookie

должны быть accessToken=... и refreshToken=...

Если Set-Cookie нет:

это либо ошибка на сервере,

либо запрос не дошёл (CORS/blocked),

либо вы ходите не туда (не тот BASE URL).

Шаг 4 — проверьте, что cookies появились в браузере
Application → Cookies

Выберите домен backend (или текущий домен, в зависимости от схемы)

Убедитесь, что accessToken и refreshToken появились

Шаг 5 — проверьте, что cookies реально уходят на приватный запрос
В UI фронта вызовите приватный запрос (например “профиль”)

это обычно GET /api/users/current

В Network откройте этот запрос

В Request Headers найдите Cookie:

там должны быть accessToken=...; refreshToken=...

Если вместо 200 вы видите 401:

проверьте, что запрос отправляется с credentials: 'include' / withCredentials: true

проверьте CORS_ORIGINS на бэке

проверьте COOKIE_SECURE (локально должен быть false)
frontend-integration


14) Bash smoke (локальная проверка cookies-авторизации)
Это быстрый тест, который можно дать всей команде.

Важно: файл cookie-jar (например .cookies.txt) не надо коммитить.
Его лучше добавить в .gitignore и хранить только локально.

bash
Копіювати код
set -euo pipefail

BASE="${BASE:-http://localhost:4000}"
JAR="${JAR:-./.cookies.txt}"
rm -f "$JAR"

EMAIL="fe_test_$(date +%s)_$RANDOM@example.com"
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

frontend-integration


15) Частые проблемы и быстрый чек-лист
“401 Unauthorized”
Причины:

забыли credentials: 'include' / withCredentials: true
frontend-integration


cookie не сохранились из-за COOKIE_SECURE=true на http
frontend-integration


CORS не настроен для credentials/вашего origin
frontend-integration


“CORS blocked”
Причины:

домен фронта не добавлен в CORS_ORIGINS

backend не разрешает credentials

“В Swagger не видно cookies”
Swagger не идеален для cookie-flow.
Проверяйте через браузер (DevTools) или через curl с cookie jar. 
frontend-integration


16) Что нужно от фронта, чтобы backend настроили правильно (коротко)
Сообщите backend-команде:

ваш dev-origin (пример: http://localhost:5173)

где будет прод (Vercel домен), когда появится

что вам нужна cookie-auth схема (credentials)

17) Примечание про прод (Vercel/Render) и cookies
Если после деплоя фронта на другой домен cookies внезапно “не сохраняются”:

первым делом смотрим Set-Cookie (атрибуты Secure/SameSite/Domain)

и проверяем, что фронт отправляет credentials.

Это типичная зона проблем на кросс-доменных деплоях.

убедиться, что backend разрешает credentials

“В Swagger не видно cookies”

Swagger не идеален для cookie-flow. Проверяйте через браузер / curl jar.
