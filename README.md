# Budget App 🍂

Telegram Mini App — минималистичный планировщик личного месячного бюджета и накоплений.

## Стек

| Часть | Технологии |
|---|---|
| Mini App | React + TypeScript + Vite + Tailwind (`packages/web`) |
| API | NestJS + PostgreSQL + Prisma (`packages/api`) |
| Бот | grammУ (`packages/bot`) |

```
Telegram Mini App (React) ──▶ API (NestJS) ──▶ PostgreSQL
Telegram Bot (grammУ) ──────▶ API
```

## Локальный запуск

Требуется: Node 20+, Docker (для PostgreSQL).

```bash
# 1. зависимости
npm install

# 2. база данных
docker compose up -d

# 3. настройки API
cd packages/api
cp .env.example .env

# 4. миграции
npm run db:migrate

# 5. запуск (три терминала, из корня)
npm run dev:api   # API  → http://localhost:3000/api
npm run dev:web   # SPA  → http://localhost:5173
npm run dev:bot   # бот  → long polling
```

## Авторизация

Вход через Telegram `initData` (заголовок `x-init-data`).
Подпись проверяется HMAC по `BOT_TOKEN` с constant-time сравнением.
После успешной проверки выдаётся серверный Bearer token.

## Полезные команды

```bash
npm run db:generate   # Prisma Client
npm run db:migrate    # миграция (prisma migrate dev)
npm run db:push       # синхронизация схемы без миграции
npm run build         # сборка
```

## Деплой на Render

| Сервис | Настройка |
|---|---|
| API (NestJS) | Web Service: `npm run build && node packages/api/dist/main.js` |
| PostgreSQL | Managed PostgreSQL, вставить Internal URL в `DATABASE_URL` |
| Bot | Background Worker или тот же инстанс |
| Mini App (SPA) | Static Site на Render или GitHub Pages |

Env для production:
```
DATABASE_URL=<Render Postgres Internal URL>
BOT_TOKEN=<токен от @BotFather>
AUTH_SECRET=<минимум 16 символов>
DEV_MODE=false
NODE_ENV=production
CORS_ORIGINS=https://your-app.onrender.com
APP_URL=https://your-app.onrender.com
```

## Структура

```
packages/
  api/   NestJS: auth, users, budgets, expenses, categories, goals, analytics, notifications
         prisma/ → schema.prisma + миграции
  web/   React SPA: Home, Plan, Categories, Goals, Stats, Analytics, Settings
  bot/   grammУ: /start, /help, /expense, /plan, /goals
.github/workflows/ci.yml   CI: typecheck, lint, test, build
docker-compose.yml          локальный PostgreSQL (порт 5433)
```
