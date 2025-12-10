# Афиша+

Платформа для поиска, создания и участия в событиях: концерты, театр, спорт, митапы, экскурсии. Админ-панель рулит пользователями и событиями, фронт показывает рекомендации и статусы, бэк шлёт e-mail подтверждения и держит WebSocket-обновления.

## Киллер‑фичи
- Умные рекомендации по интересам и городу + авто-категоризация событий.
- Живые обновления через WebSocket: участие, лимиты мест, статистика без перезагрузок.
- ТГ-бот напоминаний: https://t.me/af1shanotify_bot (репо: https://github.com/dubinciktimofej/AfishaNotify_Boy).
- Гибкий календарь: статусы активное/предстоящее/прошедшее считаются автоматически; лимиты участников, подтверждения участия.
- Админ-модуль: управление пользователями и событиями, экспорт участников, логи участия.

## Технологии
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-0EA5E9?style=flat&logo=tailwindcss&logoColor=white)

## Быстрый старт

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r ../requirements.txt
export DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/aficha
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# или для продакшена
npm run build && npm run start
```

### Что настроить
- ENV фронта: `NEXT_PUBLIC_API_URL` (по умолчанию http://127.0.0.1:8000), ключи для геокодинга и рекомендаций (OpenCage, OpenRouter).
- БД: PostgreSQL, строка подключения в `DATABASE_URL`.
- E-mail отправка (конфиг в backend/app/config.py).

### Полезное
- WebSocket: `ws://<API_URL>/ws/events` — живые обновления участия.
- ТГ-бот уведомлений: https://t.me/af1shanotify_bot (репозиторий выше).
- Админка: `/admin`, доступна только ADMIN-ролям или whitelisted e-mail.

