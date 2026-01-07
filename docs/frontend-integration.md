# Frontend Integration Guide

Этот документ предназначен для фронтенд‑разработчиков команды.
Он описывает, как корректно подключать фронтенд к нашему backend‑API,
какие переменные окружения нужны, как работает авторизация и какие есть нюансы.

---

## 1. Базовая информация

### API Base URL
- **Local (dev):** `http://localhost:4000`
- **Production:** URL, выданный Render (например `https://lehlehka-backend.onrender.com`)

Во фронтенде рекомендуется использовать переменную окружения:
- `VITE_API_BASE_URL` (Vite)
- `NEXT_PUBLIC_API_BASE_URL` (Next.js)

Пример:
```env
VITE_API_BASE_URL=http://localhost:4000
```

---

## 2. CORS

Backend использует allow‑list через переменную окружения:

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

Важно:
- домен фронтенда **обязан** быть добавлен в `CORS_ORIGINS`
- иначе браузер будет блокировать запросы

---

## 3. Авторизация (Auth Flow)

### Эндпоинты
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secret123"
}
```

Ответ:
```json
{
  "user": { ... },
  "accessToken": "JWT",
  "refreshToken": "JWT"
}
```

### Токены
- **accessToken**
  - короткоживущий
  - передаётся в заголовке:
    ```
    Authorization: Bearer <accessToken>
    ```
- **refreshToken**
  - используется для обновления accessToken
  - хранение: по решению фронта (memory / secure storage)

### Refresh
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refreshToken>"
}
```

### Поведение на 401
Рекомендуемая логика:
1. Любой запрос вернул 401
2. Попробовать `/api/auth/refresh`
3. Если refresh успешен → повторить оригинальный запрос
4. Если refresh неуспешен → logout и редирект на login

---

## 4. Protected Endpoints

Все защищённые эндпоинты требуют заголовок:

```http
Authorization: Bearer <accessToken>
```

Примеры:
- `GET /api/users/current`
- `PATCH /api/tasks/:id`
- `DELETE /api/diaries/:id`

---

## 5. Tasks (пример)

### Обновление статуса задачи
```http
PATCH /api/tasks/{id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "isDone": true
}
```

Возможные ответы:
- `200` — успешно
- `400` — ошибка валидации
- `404` — Task not found
- `401` — нет авторизации

---

## 6. Weeks (Public API)

### Получение недели (public)
```http
GET /api/weeks/{weekNumber}
```

### Дополнительно: daysToChildbirth
Если нужно получить `daysToChildbirth`, фронт **обязан** передать `dueDate`:

```http
GET /api/weeks/1?dueDate=2026-12-31
```

Без `dueDate` поле `daysToChildbirth` не возвращается.

---

## 7. Avatar Upload

### Endpoint
```http
PATCH /api/users/avatar
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

Форма:
- поле: `avatar`
- тип: file

Ответ содержит:
```json
{
  "avatarUrl": "/uploads/avatars/filename.jpg"
}
```

Важно:
- `avatarUrl` — **относительный путь**
- на фронте использовать:
```ts
const fullUrl = `${API_BASE_URL}${avatarUrl}`
```

---

## 8. Swagger / Контракты

Swagger всегда является источником истины:
- UI: `/docs`
- YAML: `/docs/openapi.yaml`

Перед использованием эндпоинта:
- проверяйте requestBody
- проверяйте возможные response codes

---

## 9. Частые ошибки

- ❌ 401 — забыли Authorization header
- ❌ CORS error — фронт‑домен не в `CORS_ORIGINS`
- ❌ 400 Validation error — неверный JSON (смотрите Swagger)

---

## 10. Рекомендуемый минимум для старта фронта

1. Настроить `API_BASE_URL`
2. Добавить домен в `CORS_ORIGINS`
3. Реализовать login + refresh flow
4. Подключить Swagger как reference
5. Проверить smoke‑запросы

---

Если возникают вопросы — сверяйтесь со Swagger или обращайтесь к backend‑команде.
