# Frontend Integration Guide (Next.js / Vite)

Цель: чтобы любой человек из команды мог быстро подключить фронт к нашему backend API, настроить авторизацию через cookies и понимать типичные ошибки (401, CORS).

## 1) Где смотреть API-документацию

- Swagger UI: `GET /docs`
- OpenAPI YAML: `GET /docs/openapi.yaml`

Если Swagger и реальный сервер расходятся — это считается багом: сообщайте backend-команде.

## 2) Base URL (куда фронт шлёт запросы)

Локально (dev):
- `http://localhost:4000`

Production (Render):
- `https://<ваш-render-домен>.onrender.com`

## 3) Как у нас работает авторизация

Backend использует JWT, но **по умолчанию хранит токены в HttpOnly cookies**:

- cookie `accessToken`
- cookie `refreshToken`

После `login/register/refresh` backend присылает `Set-Cookie`, браузер сохранит cookies автоматически.

### Что должен сделать фронт

Для **всех** запросов к API, где нужны cookies, включайте отправку cookies:

- Fetch: `credentials: 'include'`
- Axios: `withCredentials: true`

Если забыть — будет 401, даже если вы только что логинились.

## 4) Переменные окружения

### Next.js
`.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
# production:
# NEXT_PUBLIC_API_BASE_URL=https://<ваш-render-домен>.onrender.com
```

### Vite
`.env`

```env
VITE_API_BASE_URL=http://localhost:4000
# production:
# VITE_API_BASE_URL=https://<ваш-render-домен>.onrender.com
```

## 5) Пример запросов

### Fetch

```js
const API_BASE = import.meta.env?.VITE_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;

export async function apiGetCurrentUser() {
  const res = await fetch(`${API_BASE}/api/users/current`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

### Axios

```js
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

export async function apiGetCurrentUser() {
  const { data } = await api.get('/api/users/current');
  return data;
}
```

## 6) Refresh-flow (если сервер вернул 401)

Стандартный сценарий:

1) На старте приложения вызовите `GET /api/users/current`.
2) Если получили 401 — сделайте `POST /api/auth/refresh` (тело может быть `{}`), обязательно с cookies.
3) Если refresh 200 — повторите `GET /api/users/current`.
4) Если refresh снова 401 — показывайте экран логина.

Важно: refreshToken обычно **не передают в body**, backend берёт его из cookie.

## 7) Tasks: создание и смена статуса

Создать задачу:

- `POST /api/tasks`
- Body: `{ "name": string, "date": "YYYY-MM-DD" }`

Сменить статус (основной эндпоинт):

- `PATCH /api/tasks/:id/status`
- Body: `{ "isDone": boolean }`

Примечание: в проекте может быть сохранён совместимый alias `PATCH /api/tasks/:id`, но фронту рекомендуется использовать `/status`.

## 8) Avatar upload (multipart)

Endpoint:

- `PATCH /api/users/avatar`
- `Content-Type: multipart/form-data`
- поле файла: `avatar`

**Ответ:** `200 text/plain` — строка URL (прямая ссылка на новый аватар).

Что делать на фронте:

- либо сразу обновить `user.avatarUrl` этим URL в UI,
- либо после успешной загрузки вызвать `GET /api/users/current` и взять обновлённого пользователя.

## 9) CORS (когда фронт и бек на разных доменах/портах)

Backend использует allow-list через переменную `CORS_ORIGINS`.

Для локальной разработки часто нужно добавить:

- Next dev: `http://localhost:3000`
- Vite dev: `http://localhost:5173`

Пример на бэке:

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

Признак CORS:

- В консоли браузера: `CORS policy: No 'Access-Control-Allow-Origin'...`
- В Network запрос будет заблокирован.
