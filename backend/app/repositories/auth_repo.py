# app/repositories/auth_repo.py
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models import EmailVerificationCode, PasswordResetToken, User


def create_email_code(
    db: Session,
    user: User,
    code: str,
    expires_at: datetime,
) -> EmailVerificationCode:
    record = EmailVerificationCode(
        user_id=user.id,
        code=code,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_valid_email_code(
    db: Session,
    user: User,
    code: str,
) -> Optional[EmailVerificationCode]:
    now = datetime.utcnow()
    return (
        db.query(EmailVerificationCode)
        .filter(
            EmailVerificationCode.user_id == user.id,
            EmailVerificationCode.code == code,
            EmailVerificationCode.is_used == False,  # noqa: E712
            EmailVerificationCode.expires_at > now,
        )
        .first()
    )


def mark_email_code_used(db: Session, record: EmailVerificationCode):
    record.is_used = True
    db.add(record)
    db.commit()
    db.refresh(record)


def invalidate_email_codes_for_user(db: Session, user: User):
    (
        db.query(EmailVerificationCode)
        .filter(
            EmailVerificationCode.user_id == user.id,
            EmailVerificationCode.is_used == False,  # noqa: E712
        )
        .update({EmailVerificationCode.is_used: True})
    )
    db.commit()


def create_reset_token(
    db: Session,
    user: User,
    token: str,
    expires_at: datetime,
) -> PasswordResetToken:
    record = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_valid_reset_token(
    db: Session,
    token: str,
    email: str | None = None,
) -> Optional[PasswordResetToken]:
    now = datetime.utcnow()
    query = (
        db.query(PasswordResetToken)
        .join(User)
        .filter(
            PasswordResetToken.token == token,
            PasswordResetToken.is_used == False,  # noqa: E712
            PasswordResetToken.expires_at > now,
        )
    )
    if email:
        query = query.filter(User.email == email)
    return query.first()


def mark_reset_token_used(db: Session, record: PasswordResetToken):
    record.is_used = True
    db.add(record)
    db.commit()
    db.refresh(record)
