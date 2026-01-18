Frontend integration guide (Lehlehka API) 0) Терміни та модель доступу
0.1 Базові URL

API_BASE — базова адреса бекенда без /api в кінці.

локально: http://localhost:4000

прод: https://<render-domain>.onrender.com

Swagger UI: API_BASE/docs

OpenAPI YAML: API_BASE/docs/openapi.yaml

0.2 Тип авторизації

Авторизація через HttpOnly cookies: accessToken, refreshToken.

Cookies не читаються з JavaScript (це очікувано й правильно).

Для всіх приватних запитів потрібно вмикати відправку cookies:

fetch: credentials: "include"

axios: withCredentials: true

1. Перевірка, що бекенд доступний
   1.1 Health-check
   BASE="http://localhost:4000"
   curl -s "$BASE/health" | cat; echo

Очікувано: {"ok":true,...}

1.2 Swagger доступний

Відкрити в браузері:

http://localhost:4000/docs

2. Swagger: чому просить ID/параметри

Swagger UI генерується з OpenAPI. Якщо в шляху є параметр, Swagger зобов’язаний запросити значення:

GET /api/weeks/{weekNumber} → просить weekNumber

PATCH /api/tasks/{id}/status → просить id

Це коректно: без параметра URL не формується.

3. Налаштування змінних середовища на фронтенді
   3.1 Vite

.env

VITE_API_BASE_URL=http://localhost:4000

# prod:

# VITE_API_BASE_URL=https://<render-domain>.onrender.com

3.2 Next.js

.env.local

NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# prod:

# NEXT_PUBLIC_API_BASE_URL=https://<render-domain>.onrender.com

3.3 Нормалізація baseURL

Важливо прибрати кінцеві слеші, і переконатися, що немає /api у base.

const rawBase =
(import.meta as any)?.env?.VITE_API_BASE_URL ??
process.env.NEXT_PUBLIC_API_BASE_URL;

export const API_BASE = String(rawBase || "").replace(/\/+$/g, "");

Правило:

API_BASE не закінчується на /

API_BASE не містить /api

4. Рекомендований HTTP-клієнт
   4.1 Axios instance
   import axios from "axios";
   import { API_BASE } from "./apiBase";

export const api = axios.create({
baseURL: API_BASE,
withCredentials: true,
headers: { "Content-Type": "application/json" },
});
Axios (правильно)
js
Копіювати код
import axios from "axios";

4.2 Fetch helper (альтернатива)
import { API_BASE } from "./apiBase";

export async function authedFetch(input: string, init: RequestInit = {}) {
const res = await fetch(`${API_BASE}${input}`, {
...init,
credentials: "include",
headers: {
"Content-Type": "application/json",
...(init.headers || {}),
},
});

return res;
}

5. Auth: логін і підтримка сесії
   5.1 Логін

POST /api/auth/login
Body:

{ "email": "owner@example.com", "password": "secret123" }

Успіх:

відповідь 200

cookies встановлюються через Set-Cookie

5.2 Перевірка сесії

GET /api/users/current (потрібні cookies)

5.3 Refresh-flow при 401

Алгоритм:

Виконати приватний запит (наприклад /api/users/current)

Якщо 401 → викликати POST /api/auth/refresh (з cookies)

Якщо refresh успішний → повторити початковий запит 1 раз

Якщо знов 401 → сесія недійсна → UI повертається на логін

5.4 Критичний принцип

Якщо не увімкнені cookies (credentials/include або withCredentials), приватні запити завжди будуть 401.

6. Endpoints: що викликати і як
   6.1 Weeks (публічні та приватні)

Публічно
GET /api/weeks/:weekNumber

export async function getWeek(weekNumber: number) {
const { data } = await api.get(`/api/weeks/${weekNumber}`);
return data;
}

Приватно (поточний тиждень користувача)
GET /api/weeks/current

export async function getCurrentWeek() {
const { data } = await api.get(`/api/weeks/current`);
return data;
}

6.2 Tasks

Отримати задачі (опціонально по даті)
GET /api/tasks
GET /api/tasks?date=YYYY-MM-DD

// Якщо date не передати — бек поверне всі задачі користувача (date: null).
export async function getTasks(dateISO?: string) {
const { data } = await api.get(`/api/tasks`, { params: dateISO ? { date: dateISO } : undefined });
return data;
}

Створити задачу
POST /api/tasks
Body:

{ "name": "Task name", "date": "2026-01-15" }

export async function createTask(name: string, dateISO: string) {
const { data } = await api.post(`/api/tasks`, { name, date: dateISO });
return data;
}

Змінити статус
PATCH /api/tasks/:id/status
Body:

{ "isDone": true }

export async function setTaskDone(taskId: string, isDone: boolean) {
const { data } = await api.patch(`/api/tasks/${taskId}/status`, { isDone });
return data;
}

6.3 Users: профіль і аватар

Поточний користувач
GET /api/users/current

Завантаження аватара (multipart/form-data)
PATCH /api/users/avatar
Поле файлу: avatar

export async function uploadAvatar(file: File) {
const fd = new FormData();
fd.append("avatar", file);

const { data } = await api.patch(`/api/users/avatar`, fd, {
headers: { "Content-Type": "multipart/form-data" },
});

return data; // за контрактом може бути рядок-URL
}

7. CORS: вимоги та перевірка
   7.1 Що потрібно для cookies-auth

Access-Control-Allow-Origin має бути конкретним origin фронта (не \*)

Access-Control-Allow-Credentials: true

Vary: Origin

7.2 Preflight (OPTIONS)

Для запитів із Content-Type: application/json браузер часто робить preflight.

Відповідь на OPTIONS має містити:

Access-Control-Allow-Origin

Access-Control-Allow-Credentials

Access-Control-Allow-Methods (GET/POST/PATCH/DELETE…)

Access-Control-Allow-Headers (наприклад Content-Type, інколи Authorization)

Статус зазвичай: 204 No Content (або 200)

7.3 Команди перевірки CORS (локально)
BASE="http://localhost:4000"
ORIGIN="http://localhost:5173"

curl -i "$BASE/api/weeks/40" -H "Origin: $ORIGIN" | sed -n '1,60p'

curl -i -X OPTIONS "$BASE/api/tasks?date=2026-01-15" \
 -H "Origin: $ORIGIN" \
 -H "Access-Control-Request-Method: GET" \
 -H "Access-Control-Request-Headers: Content-Type, Authorization" \
 | sed -n '1,120p'

8. Типові помилки та діагностика
   8.1 401 Missing access token

Причини:

запит пішов без cookies

cookies не зберігаються через CORS/SameSite/Secure

приватний запит без логіна

Перевірка:

DevTools → Application → Cookies (домен API): accessToken/refreshToken

Network → Request headers: чи є Cookie: ...

8.2 CORS error у консолі

Причини:

origin фронта не в allowlist на бекенді

OPTIONS не обробляється або без потрібних заголовків

Access-Control-Allow-Origin: \* разом із Allow-Credentials: true (так не можна)

9. Мінімальний робочий сценарій інтеграції

Прописати \*\_API_BASE_URL на локальний бек.

Створити HTTP-клієнт з withCredentials: true.

Реалізувати login(email, password) → POST /api/auth/login.

Після логіна викликати GET /api/users/current і зберегти користувача в state.

Реалізувати refresh на 401: POST /api/auth/refresh → повторити запит 1 раз.

Реалізувати Tasks: GET /api/tasks?date=..., POST /api/tasks, PATCH /api/tasks/:id/status.

Реалізувати Weeks: GET /api/weeks/:weekNumber, GET /api/weeks/current.

Реалізувати Avatar upload: PATCH /api/users/avatar.

Перевірити CORS (GET + OPTIONS) на наявність ACAO/ACAC/Allow-\*.

10. Команди “перед PR / перед релізом” (бекенд)
    npm run lint
    npm run build
    npm run smoke

Призначення:

lint — чистий ESLint

build — перевірка TypeScript

smoke — базова перевірка API-ланцюжків

11. Примітка про прод (frontend domain ≠ backend domain)

Якщо фронт і бек на різних доменах, cookies можуть вимагати:

SameSite=None

Secure=true (лише HTTPS)

Якщо в проді “логін ок, але приватні запити 401” — перше, що перевіряється: чи cookies зберігаються на домені API і чи відправляються в запитах.
