# Мани.точка 🍂

Telegram Mini App — минималистичный планировщик личного месячного бюджета и накоплений.
Пользователь вручную указывает доход, распределяет его по категориям и целям, добавляет расходы —
приложение показывает, сколько осталось.

## Стек

| Часть | Технологии |
|---|---|
| Mini App | React + TypeScript + Vite + Tailwind (`packages/web`) |
| API | NestJS + PostgreSQL + Prisma (`packages/api`) |
| Бот | grammY (`packages/bot`) |

```
Telegram Mini App (React) ──▶ API (NestJS) ──▶ PostgreSQL
Telegram Bot (grammY) ──────▶ API
```

## Локальный запуск

Требуется: Node 20+, Docker (для PostgreSQL).

```bash
# 1. зависимости
npm install

# 2. база данных
docker compose up -d

# 3. настройки API (уже есть по умолчанию, порт 5433, т.к. 5432 может быть занят системным Postgres)
cd packages/api
Copy-Item .env.example .env   # при необходимости

# 4. миграции
npm run db:migrate

# 5. запуск (три терминала, из корня)
npm run dev:api   # API  → http://localhost:3000/api
npm run dev:web   # SPA  → http://localhost:5173  (проксирует /api)
npm run dev:bot   # бот  → long polling
```

### Авторизация

Вход через Telegram `initData` (заголовок `x-init-data`). Подпись проверяется HMAC по `BOT_TOKEN`,
если токен задан. Пока `BOT_TOKEN` пуст и `DEV_MODE=true`, API доверяет переданному `user` —
удобно для разработки и тестов.

### Полезные команды

```bash
npm run db:generate   # сгенерировать Prisma Client
npm run db:migrate    # создать миграцию (prisma migrate dev)
npm run db:push       # синхронизировать схему без миграции
npm run build         # собрать всё
```

## Проверено (MVP)

- создание бюджета месяца с лимитами категорий и отчислениями в цели;
- автоматическое создание стартовых категорий при первом входе;
- добавление/удаление (soft delete) расходов, мгновенный пересчёт остатков;
- расчёт: нераспределено = доход − лимиты − в цели;
  остаток = доход − расходы − в цели;
- ручное пополнение целей и грамотное перепланирование (без двойного начисления);
- экраны: Главная, Бюджет, Категории, Цели, Расходы, Аналитика, Настройки.

## Деплой и хостинг

### GitHub Pages или Render — что подойдёт?

**GitHub Pages — не подходит как единственный хостинг.** Это только статический хостинг:
может отдать собранный фронтенд (`packages/web/dist`), но **не может** запустить NestJS API,
PostgreSQL или бота — а без бэкенда Mini App работать не будет (вся логика и данные на сервере).

**Render — подходит полностью** (есть бесплатный тариф):

| Что | Как на Render |
|---|---|
| API (NestJS) | Web Service, команда `npm run build --workspace=@money/api && npm run start --workspace=@money/api`, старт: `node packages/api/dist/main.js`, env: `DATABASE_URL`, `BOT_TOKEN`, `DEV_MODE=false` |
| PostgreSQL | Managed PostgreSQL (бесплатно до 1 ГБ) — вставить его `Internal Database URL` в `DATABASE_URL` API |
| Бот (grammY) | Ещё один Web Service (long polling — надёжнее, чем вебхук на бесплатном тарифе из-за сна сервера) или тот же инстанс; env: `BOT_TOKEN`, `APP_URL` |
| Mini App (SPA) | Static Site на Render ИЛИ GitHub Pages — оба HTTPS-хостинга годятся |

Требования Telegram к Mini App:
- URL приложения **обязательно HTTPS** (у Render и GitHub Pages есть);
- при регистрации бота у @BotFather укажите `Menu Button`/Mini App URL — адрес SPA;
- для продакшена в `.env` API обязательно `BOT_TOKEN` и `DEV_MODE=false`, иначе вход будет отклонён.

Рекомендация: вести всё на Render (API + Postgres + бот), фронтенд раздать как статику —
через GitHub Pages или тоже Render. Один аккаунт, один внутренний URL к БД, проще CORS.

## Что потребуется ещё (после MVP)

1. **Бот у @BotFather**: токен, название, иконка, ссылка на Mini App.
2. **Прод-база**: Managed PostgreSQL (Render/Neon) + `prisma migrate deploy` на деплое.
3. **Реальный `BOT_TOKEN`** в переменных окружения API и бота, `DEV_MODE=false`.
4. **Домен** (необязательно, но приятнее): `api.example.com` для API, `app.example.com` для SPA.
5. **Графики/статистика**: сейчас Аналитика простая (бары по категориям).
6. **Копирование месяца**: «прошлый план → новый месяц» — часто нужно.
7. **Уведомления**: напоминание о превышении лимита (бот в фон), конец месяца.
8. **Тесты**: e2e на API (сейчас проверено вручную), юнит-тесты на пересчёт денег — это бизнес-логика.
9. **CI/CD**: GitHub Actions — прогон сборки и миграций перед деплоем.
10. **Rate limiting** и защита от спама на публичный API после запуска.

## Структура

```
packages/
  api/   NestJS: auth (initData), users, categories, budgets, expenses, goals
         prisma/ → schema.prisma + миграции
  web/   React SPA: views (Home/Plan/Categories/Goals/Stats/Analytics/Settings)
  bot/   grammY: /start c кнопкой web_app
docker-compose.yml  локальный PostgreSQL (порт 5433)
```