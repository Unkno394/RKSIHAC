# app/core/security.py
from datetime import datetime, timedelta
from typing import Optional, Union

import jwt
try:
    import bcrypt  # type: ignore
    # passlib expects bcrypt.__about__.__version__, а в некоторых сборках его нет
    if hasattr(bcrypt, "__version__") and not hasattr(bcrypt, "__about__"):
        bcrypt.__about__ = type("about", (), {"__version__": bcrypt.__version__})()
except Exception:
    bcrypt = None  # fallback; passlib будет сам ругаться, если backend не найден
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _prepare_password(password: Union[str, bytes]) -> str:
    """
    BCrypt ограничивает пароль 72 байтами; приводим к строке и явно обрезаем.
    """
    if isinstance(password, bytes):
        password = password.decode("utf-8", errors="ignore")
    return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")


def hash_password(password: Union[str, bytes]) -> str:
    return pwd_context.hash(_prepare_password(password))


def verify_password(plain_password: Union[str, bytes], hashed_password: str) -> bool:
    return pwd_context.verify(_prepare_password(plain_password), hashed_password)


def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRES_MINUTES)
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.PyJWTError:
        return None
