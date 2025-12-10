# app/services/auth_service.py
import random
import string
import uuid
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.core import email_utils
from app.config import settings
from app.db.models import User
from app.repositories import user_repo, auth_repo
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    ResetPasswordRequest,
)


def _trim_password(password: str) -> str:
    # BCrypt игнорирует байты после 72, поэтому явно обрезаем до 72 байт.
    return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")


def _generate_code(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def _generate_reset_token() -> str:
    return uuid.uuid4().hex


def register_user(db: Session, data: RegisterRequest):
    existing = user_repo.get_by_email(db, data.email)
    password_hash = hash_password(_trim_password(data.password))

    if existing:
        if existing.is_active:
            raise ValueError("Пользователь с такой почтой уже существует")
        # Пользователь не активирован — обновляем данные и шлём новый код
        existing.full_name = data.full_name
        existing.password_hash = password_hash
        existing.is_active = False
        db.add(existing)
        db.commit()
        db.refresh(existing)
        auth_repo.invalidate_email_codes_for_user(db, existing)
        user = existing
    else:
        user = user_repo.create_user(
            db=db,
            full_name=data.full_name,
            email=data.email,
            password_hash=password_hash,
        )

    code = _generate_code()
    expires_at = datetime.utcnow() + timedelta(hours=24)
    auth_repo.create_email_code(db, user, code, expires_at)

    email_utils.send_confirmation_code(user.email, code)



def confirm_email(db: Session, email: str, code: str):
    user = user_repo.get_by_email(db, email)
    if not user:
        raise ValueError("Пользователь не найден")

    record = auth_repo.get_valid_email_code(db, user, code)
    if not record:
        raise ValueError("Неверный или истёкший код подтверждения")

    auth_repo.mark_email_code_used(db, record)
    user_repo.activate_user(db, user)
    email_utils.send_welcome_email(user.email, user.full_name)


def login_user(db: Session, data: LoginRequest) -> str:
    user = user_repo.get_by_email(db, data.email)
    if not user:
        raise ValueError("Неверный email или пароль")

    if not user.is_active:
        raise ValueError("Почта не подтверждена")

    if not verify_password(_trim_password(data.password), user.password_hash):
        raise ValueError("Неверный email или пароль")

    token = create_access_token(str(user.id), user.role)
    return token


def request_password_reset(db: Session, email: str):
    user = user_repo.get_by_email(db, email)
    # Важно: не палим, существует ли email — но всё равно можно не создавать токен
    if not user:
        return

    token = _generate_reset_token()
    expires_at = datetime.utcnow() + timedelta(hours=24)
    auth_repo.create_reset_token(db, user, token, expires_at)

    email_utils.send_reset_code(user.email, token)


def reset_password(db: Session, data: ResetPasswordRequest):
    record = auth_repo.get_valid_reset_token(db, data.token, email=data.email)
    if not record:
        raise ValueError("Ссылка для сброса пароля недействительна или истекла")

    user: User = record.user
    new_hash = hash_password(_trim_password(data.new_password))
    user_repo.update_password(db, user, new_hash)

    auth_repo.mark_reset_token_used(db, record)
    email_utils.send_password_changed(user.email)


def verify_reset_code(db: Session, email: str, token: str):
    record = auth_repo.get_valid_reset_token(db, token, email=email)
    if not record:
        raise ValueError("Неверный или истёкший код")


def admin_reset_password(db: Session, user: User, new_password: str):
    new_hash = hash_password(_trim_password(new_password))
    user_repo.update_password(db, user, new_hash)
    email_utils.send_password_changed(user.email, new_password)
