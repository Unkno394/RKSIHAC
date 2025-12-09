# app/repositories/user_repo.py
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import User


def get_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, full_name: str, email: str, password_hash: str) -> User:
    user = User(
        full_name=full_name,
        email=email,
        password_hash=password_hash,
        role="USER",
        is_active=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def activate_user(db: Session, user: User) -> User:
    user.is_active = True
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_password(db: Session, user: User, password_hash: str) -> User:
    user.password_hash = password_hash
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_by_id(db: Session, user_id: UUID) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def update_profile(db: Session, user: User, full_name: Optional[str], about: Optional[str], avatar_url: Optional[str]) -> User:
    if full_name:
        user.full_name = full_name
    user.about = about
    user.avatar_url = avatar_url
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
