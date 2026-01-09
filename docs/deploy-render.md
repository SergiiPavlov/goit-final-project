0) Подготовка локально (1 раз)

В корне проекта:

npm ci
npm run build
npm start


Проверь, что в отдельном терминале отвечает:

curl -fsS http://localhost:4000/health


Если локально это работает — на Render будет предсказуемо.

1) Создай PostgreSQL (Render)

Render → New → PostgreSQL

Создай базу (название любое)

После создания открой её и возьми Internal Database URL (это и будет DATABASE_URL)

2) Создай Web Service (Backend)

Render → New → Web Service

Подключи GitHub репозиторий

Выбери ветку (например, main или ваша PR-ветка)

Настройки:

Runtime: Node

Build Command:

npm ci && npm run build && npm run prisma:migrate:deploy


Start Command:

npm start


Важно про PORT: в Render PORT задаётся автоматически.
Не надо руками ставить PORT=4000 в Render env, иначе можно “промахнуться” мимо порта, который ожидает платформа.

3) Environment Variables (Render → Settings → Environment)

Перенеси из .env.example только нужное.

Минимально обязательно:

DATABASE_URL = Internal Database URL из шага 1

JWT_ACCESS_SECRET = сгенерируй

JWT_REFRESH_SECRET = сгенерируй

BCRYPT_SALT_ROUNDS = 10

NODE_ENV = production

CORS_ORIGINS = список доменов фронта через запятую, например:

https://your-frontend.vercel.app,https://your-frontend.onrender.com,http://localhost:3000


Секреты можно сгенерировать так (локально):

openssl rand -hex 32


(сделай два раза — для access и refresh)

Cloudinary (очень рекомендую для Render)

Так как файловая система на бесплатных инстансах часто эпемерная, аватары лучше хранить в Cloudinary.

Если хотите Cloudinary в проде — добавь:

CLOUDINARY_CLOUD_NAME

CLOUDINARY_API_KEY

CLOUDINARY_API_SECRET

CLOUDINARY_FOLDER=avatars

DEFAULT_AVATAR_URL = ссылка на дефолтный аватар (можно тоже в Cloudinary)

Если не добавлять Cloudinary переменные — сервер может перейти на локальные uploads/, и после рестартов аватары будут теряться.

4) Деплой и проверка

После первого деплоя (Render даст вам URL сервиса):

BASE="https://<YOUR-RENDER-URL>"

curl -fsS "$BASE/health" && echo
curl -fsS "$BASE/docs/openapi.yaml" >/dev/null && echo "openapi ok"


И прогон smoke против Render (если ваш scripts/smoke.sh читает BASE_URL, обычно так):

BASE_URL="$BASE" npm run smoke

5) Частые причины “не работает у фронта” (коротко)

CORS_ORIGINS не содержит реальный домен фронта → браузер блокирует запросы.

На Render выставили PORT=4000 вручную → сервис “не слушает” тот порт, который ждёт Render.

Не задали Cloudinary и ожидают, что аватары сохранятся навсегда на диске → после рестарта исчезают.
