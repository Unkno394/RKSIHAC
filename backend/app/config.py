from pydantic_settings import BaseSettings
from pydantic import AnyUrl

class Settings(BaseSettings):
    # База по умолчанию — локальный SQLite, можно переопределить в .env
    DATABASE_URL: str = "sqlite:///./app.db"
    # JWT
    JWT_SECRET_KEY: str = "CHANGE_ME_SECRET"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 60
    # SMTP настройки для Gmail
    EMAIL_FROM: str = "fff898666@gmail.com"  # Твой email
    SMTP_HOST: str = "smtp.gmail.com"  # SMTP сервер Gmail
    SMTP_PORT: int = 587  # Порт для TLS
    SMTP_USER: str = "fff898666@gmail.com"  # Твой email
    SMTP_PASSWORD: str = "pjyp guwp qkfl hlaq"  # Пароль приложения
    SMTP_USE_TLS: bool = True  # Используем TLS для безопасности

    FRONTEND_BASE_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
