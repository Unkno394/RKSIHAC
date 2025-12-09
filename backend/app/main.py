from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth  # Подключение маршрута для авторизации и пользователей
from app.db.base import Base, engine

# Создание таблиц в базе данных (для простоты без Alembic)
Base.metadata.create_all(bind=engine)

# Инициализация FastAPI
app = FastAPI(title="Afisha Auth API")

# Настройки CORS для разрешения запросов с других доменов (например, с фронтенда)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Можно указать конкретные домены, например ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],  # Разрешаем все HTTP методы
    allow_headers=["*"],  # Разрешаем все заголовки
)

# Подключаем маршруты (роутеры) для аутентификации и пользователей
app.include_router(auth.router)  # Включаем все маршруты из auth.py, включая /get_users

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Afisha Auth API running"}

