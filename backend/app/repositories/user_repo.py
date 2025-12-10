# app/repositories/user_repo.py
from datetime import datetime
from typing import Iterable, Optional
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


def get_by_ids(db: Session, ids: Iterable[UUID]) -> list[User]:
    return db.query(User).filter(User.id.in_(list(ids))).all()


def update_profile(db: Session, user: User, full_name: Optional[str], about: Optional[str], avatar_url: Optional[str]) -> User:
    if full_name:
        user.full_name = full_name
    user.about = about
    user.avatar_url = avatar_url
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_users(
    db: Session,
    full_name: Optional[str] = None,
    role: Optional[str] = None,
    is_deleted: Optional[bool] = None,
    date_from: Optional[str | datetime] = None,
    date_to: Optional[str | datetime] = None,
) -> list[User]:
    query = db.query(User)
    if full_name:
        query = query.filter(User.full_name.ilike(f"%{full_name}%"))
    if role:
        query = query.filter(User.role == role)
    if is_deleted is not None:
        query = query.filter(User.is_deleted == is_deleted)
    if date_from:
        if isinstance(date_from, str):
            try:
                date_from = datetime.fromisoformat(date_from)
            except ValueError:
                date_from = None
        if date_from:
            query = query.filter(User.created_at >= date_from)
    if date_to:
        if isinstance(date_to, str):
            try:
                date_to = datetime.fromisoformat(date_to)
            except ValueError:
                date_to = None
        if date_to:
            query = query.filter(User.created_at <= date_to)
    return query.order_by(User.created_at.desc()).all()


def soft_delete_user(db: Session, user: User) -> User:
    user.is_deleted = True
    user.is_active = False
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def restore_user(db: Session, user: User) -> User:
    user.is_deleted = False
    user.is_active = True
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
