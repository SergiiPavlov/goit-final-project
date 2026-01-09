# Frontend Integration Guide (Next.js / Vite) — для команды

Этот документ для фронтенд-разработчиков.
Цель: чтобы любой человек из команды мог за 15–30 минут подключить фронт к нашему backend-API,
протестировать авторизацию и приватные эндпоинты, и понимать частые ошибки.

---

## 0) Что важно понять сразу (1 минута)

1) Наш backend использует **JWT токены в JSON** (accessToken/refreshToken).
2) Мы **не используем cookies** для авторизации (нет Set-Cookie).
3) Для приватных запросов фронт обязан отправлять:
   `Authorization: Bearer <accessToken>`

Это “нормальный” подход для SPA/CSR, и он хорошо тестируется через Swagger/curl.

---

## 1) Где смотреть документацию API

### Swagger UI
- `GET /docs` — интерфейс Swagger (кнопка “Authorize” для Bearer)
- `GET /docs/openapi.yaml` — yaml-контракт

Важно:
- Swagger — это **контракт для команды**.
- Источник истины по факту поведения — **реальный ответ сервера** (если вдруг Swagger расходится — сообщите backend-команде).

---

## 2) База URL (куда фронт шлёт запросы)

### Локально (dev)
- Backend: `http://localhost:4000`

### Production (Render)
- Backend: `https://<ваш-render-домен>.onrender.com`

---

## 3) Переменные окружения для фронта

### Next.js
Файл: `.env.local`
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
# или Render URL в проде:
# NEXT_PUBLIC_API_BASE_URL=https://lehlehka-render.onrender.com
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
Команды:

bash
Копіювати код
npm i
npm run dev
4) CORS (важно, если фронт и бек на разных доменах)
Backend использует allow-list CORS_ORIGINS:

env
Копіювати код
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
Если фронт запускается на:

Next: http://localhost:3000

Vite: http://localhost:5173

…эти домены должны быть в allow-list.

Как понять, что проблема в CORS
В консоли браузера будет ошибка вида:

“CORS policy: No 'Access-Control-Allow-Origin' header …”

запрос в Network будет “blocked”

Решение:

добавить домен фронта в CORS_ORIGINS и перезапустить backend.

5) Авторизация: что хранить и где
Backend возвращает токены в JSON:

Register
POST /api/auth/register

Login
POST /api/auth/login

Ответ:

json
Копіювати код
{
  "user": { ... },
  "accessToken": "JWT...",
  "refreshToken": "JWT..."
}
Как хранить токены на фронте (рекомендуем на этом этапе)
В памяти приложения:

accessToken → React state / context

refreshToken → тоже в state / context (или sessionStorage)

Почему так:

проще всего

не требует cookies

меньше проблем с SameSite/CORS
Минус:

после refresh страницы токены пропадут → нужен повторный логин (или добавить сохранение в sessionStorage).

6) Как писать запросы на приватные эндпоинты
Любой защищённый запрос должен включать заголовок:

makefile
Копіювати код
Authorization: Bearer <accessToken>
Примеры приватных эндпоинтов:

GET /api/users/current

PATCH /api/tasks/:id

DELETE /api/diaries/:id

GET /api/weeks/current

7) Next.js (App Router) — практический “скелет” интеграции
Шаг 1 — сделать один “API client”
Создайте файл: src/lib/api.ts

Логика:

берем baseUrl из process.env.NEXT_PUBLIC_API_BASE_URL

делаем функции login, register, refresh, getCurrentUser и т.п.

в каждую приватную функцию передаем accessToken и добавляем Authorization header

Важно: на фронте не пытайтесь “ждать куки” — их нет.

Шаг 2 — сделать AuthContext (хранит accessToken/refreshToken)
Создайте:

src/context/AuthContext.tsx

Внутри:

state: accessToken, refreshToken, user

методы: login(), logout(), refresh()

Правило:

после login/register → сохранить токены в state

на logout → очистить state

Шаг 3 — refresh-flow на 401
Рекомендуемая логика (простыми словами):

Фронт делает запрос к приватному эндпоинту.

Если ответ 401:

вызвать POST /api/auth/refresh с refreshToken

если refresh успешен → сохранить новый accessToken и повторить исходный запрос

если refresh не успешен → logout и редирект на /login

Это можно реализовать:

либо вручную в каждом запросе (простая версия)

либо одной оберткой authedFetch() / interceptor (удобнее)

Шаг 4 — разделение приватных/публичных страниц в Next
Так как у нас не cookies, у Next middleware (серверный) не сможет “надежно” читать accessToken из cookie.

Поэтому на этом этапе рекомендуем:

Публичные страницы рендерятся всегда.

Приватные страницы:

на клиенте (useEffect) проверяют accessToken

если токена нет → редирект на /login

если токен есть → пробуем GET /api/users/current

200 → показать страницу

401 → refresh → повтор

refresh failed → /login

Это самый простой и рабочий вариант для команды.

8) Weeks (public и private) — нюанс для фронта
Public week
GET /api/weeks/{weekNumber}

daysToChildbirth
Поле daysToChildbirth возвращается только если фронт передал dueDate:

GET /api/weeks/1?dueDate=2026-12-31

Если dueDate не передать — поля не будет. Это нормально.

9) Avatar upload (multipart)
PATCH /api/users/avatar

Content-Type: multipart/form-data

поле файла: avatar

обязательно Authorization: Bearer <token>

Ответ:

json
Копіювати код
{ "avatarUrl": "/uploads/avatars/filename.jpg" }
Важно:

avatarUrl — относительный путь

на фронте полный URL:
${API_BASE_URL}${avatarUrl}

10) Как увидеть “сколько живет токен” (exp)
JWT обычно содержит поле exp (unix time).
На фронте можно:

декодировать payload и смотреть exp

или просто реагировать на 401 и делать refresh

Если нужно “посмотреть руками”:

можно вставить токен на jwt.io (только в dev и без секретов)

или локально декодировать base64 payload

Практично в продукте:

не полагаться на exp на фронте, а делать refresh по 401.

11) Как протестировать в Swagger (пошагово)
Открыть /docs

Сделать POST /api/auth/register или POST /api/auth/login

Скопировать accessToken из ответа

Нажать кнопку Authorize

Ввести:
Bearer <accessToken>

Пробовать GET /api/users/current, GET /api/weeks/current, etc.

Если получаете 401:

значит токен не установлен в Authorize

или вы забыли “Bearer ”

или токен уже невалиден/просрочен

12) Bash smoke (для команды фронта/бека)
Пример локального smoke:

bash
Копіювати код
BASE="${BASE:-http://localhost:4000}"

EMAIL="fe_test_$(date +%s)@example.com"
PASS="secret123!"
NAME="FE Test"

echo "Register..."
REG_JSON=$(curl -sS -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")

TOKEN=$(echo "$REG_JSON" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
echo "TOKEN=${TOKEN:0:20}..."

echo "Current user..."
curl -sS -i "$BASE/api/users/current" \
  -H "Authorization: Bearer $TOKEN" | head -n 40
13) Частые проблемы и ответы
“У нас в Swagger нет Set-Cookie”
Это нормально: мы используем токены в JSON, а не cookies.
Нужно брать accessToken из ответа и ставить Authorize (Bearer).

“На Render 404 Week not found”
Чаще всего это не фронт, а окружение:

не применены миграции/seed на прод-БД

подключена пустая/другая БД

Проверка:

локально /api/weeks/current работает после seed

на Render — если 404, смотрим DB и seed

“401 Unauthorized на приватных”
Причины:

забыли Authorization: Bearer ...

токен не тот (пустой/обрезанный)

токен протух → нужно refresh (или залогиниться заново)

“CORS”
Если браузер блокирует запрос:

убедитесь, что домен фронта добавлен в CORS_ORIGINS


