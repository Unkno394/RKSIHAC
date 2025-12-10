from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.base import get_db
from app.db.models import User
from app.repositories import user_repo
from app.schemas.auth import (
    AdminResetPasswordRequest,
    AdminResetPasswordResponse,
    AdminUserUpdateRequest,
    ConfirmEmailRequest,
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    ProfileResponse,
    ProfileUpdateRequest,
    RegisterRequest,
    RegisterResponse,
    ResetCodeVerifyRequest,
    ResetPasswordRequest,
    UserListResponse,
    ChangeEmailRequest,
)
from app.schemas.event import (
    EventCreateRequest,
    EventResponse,
    EventUpdateRequest,
    ParticipationLogResponse,
)
from app.services import auth_service, event_service

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

router = APIRouter(prefix="/auth", tags=["auth"])

# Роут для регистрации пользователя
@router.post("/register", response_model=RegisterResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    try:
        auth_service.register_user(db, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return RegisterResponse(
        message="Регистрация почти завершена. На вашу почту отправлен код подтверждения."
    )

# Роут для подтверждения почты
@router.post("/confirm-email")
def confirm_email(data: ConfirmEmailRequest, db: Session = Depends(get_db)):
    try:
        auth_service.confirm_email(db, data.email, data.code)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return {"message": "Почта успешно подтверждена. Вы можете войти в систему."}

# Роут для входа в систему
@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    try:
        token = auth_service.login_user(db, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return LoginResponse(access_token=token)

# Роут для запроса сброса пароля
@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    try:
        auth_service.request_password_reset(db, data.email)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return {
        "message": "Если аккаунт с такой почтой существует, письмо со ссылкой для сброса пароля отправлено."
    }

# Роут для сброса пароля
@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        auth_service.reset_password(db, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return {
        "message": "Пароль успешно изменён. Теперь вы можете войти с новым паролем."
    }

# Роут для проверки кода сброса пароля
@router.post("/verify-reset-code")
def verify_reset_code(data: ResetCodeVerifyRequest, db: Session = Depends(get_db)):
    try:
        auth_service.verify_reset_code(db, data.email, data.token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return {"message": "Код верен. Можно задать новый пароль."}


# Роут для получения информации о текущем пользователе
def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=403, detail="Неверный или истекший токен")
    user_id = payload.get("sub")
    try:
        user_uuid = UUID(str(user_id))
    except Exception:
        raise HTTPException(status_code=401, detail="Неверный токен")
    user = user_repo.get_by_id(db, user_uuid)
    if not user or user.is_deleted:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


@router.get("/profile", response_model=ProfileResponse)
def get_user_profile(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    return ProfileResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        avatar_url=user.avatar_url,
        about=user.about,
    )


@router.put("/profile", response_model=ProfileResponse)
def update_user_profile(
    data: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user = user_repo.update_profile(db, user, data.full_name, data.about, data.avatar_url)
    return ProfileResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        avatar_url=user.avatar_url,
        about=user.about,
    )


@router.post("/change-email", response_model=ProfileResponse)
def change_email(
    data: ChangeEmailRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        user = auth_service.change_email(db, user, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return ProfileResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        avatar_url=user.avatar_url,
        about=user.about,
    )


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Доступ только для администратора")
    return user


@router.get("/events/{event_id}/participation-log", response_model=ParticipationLogResponse)
def participation_log(
    event_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = event_service.get_participation_log(db, event_id)
    return ParticipationLogResponse(
        active=result["active"],
        declined=result["declined"],
    )


# ---------------------- Админ: пользователи ----------------------
@router.get("/admin/users", response_model=List[UserListResponse])
def list_users(
    full_name: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, description="active|deleted|all"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    is_deleted = None
    if status_filter == "active":
        is_deleted = False
    elif status_filter == "deleted":
        is_deleted = True
    users = user_repo.list_users(
        db=db,
        full_name=full_name,
        role=role,
        is_deleted=is_deleted,
        date_from=date_from,
        date_to=date_to,
    )
    return [
        UserListResponse(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            role=u.role,
            created_at=u.created_at,
            is_active=u.is_active,
            is_deleted=u.is_deleted,
            avatar_url=u.avatar_url,
        )
        for u in users
    ]


@router.put("/admin/users/{user_id}", response_model=UserListResponse)
def admin_update_user(
    user_id: UUID,
    data: AdminUserUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = user_repo.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if data.full_name:
        user.full_name = data.full_name
    if data.role:
        user.role = data.role
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserListResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        created_at=user.created_at,
        is_active=user.is_active,
        is_deleted=user.is_deleted,
        avatar_url=user.avatar_url,
    )


@router.delete("/admin/users/{user_id}", response_model=UserListResponse)
def admin_soft_delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = user_repo.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user = user_repo.soft_delete_user(db, user)
    return UserListResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        created_at=user.created_at,
        is_active=user.is_active,
        is_deleted=user.is_deleted,
        avatar_url=user.avatar_url,
    )


@router.post("/admin/users/{user_id}/restore", response_model=UserListResponse)
def admin_restore_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = user_repo.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user = user_repo.restore_user(db, user)
    return UserListResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        created_at=user.created_at,
        is_active=user.is_active,
        is_deleted=user.is_deleted,
        avatar_url=user.avatar_url,
    )

@router.post("/admin/users/{user_id}/reset-password", response_model=AdminResetPasswordResponse)
def admin_reset_password(
    user_id: UUID,
    data: AdminResetPasswordRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = user_repo.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    auth_service.admin_reset_password(db, user, data.new_password)
    return AdminResetPasswordResponse(
        message="Пароль сброшен и отправлен пользователю",
        new_password=data.new_password,
    )


# ---------------------- События ----------------------
@router.get("/events", response_model=List[EventResponse])
def get_events(
    status: Optional[str] = Query(None, description="active|upcoming|past"),
    db: Session = Depends(get_db),
):
    return event_service.list_events(db, status=status)


@router.get("/events/{event_id}", response_model=EventResponse)
def get_event(event_id: UUID, db: Session = Depends(get_db)):
    event = event_service.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    return event


@router.post("/events", response_model=EventResponse)
def create_event(
    event_data: EventCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return event_service.create_event(db, event_data)


@router.put("/events/{event_id}", response_model=EventResponse)
def update_event(
    event_id: UUID,
    event_data: EventUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    event = event_service.update_event(db, event_id, event_data)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    return event


@router.delete("/events/{event_id}", response_model=EventResponse)
def delete_event(
    event_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    event = event_service.soft_delete_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    return event


@router.post("/events/{event_id}/join", response_model=EventResponse)
def join_event(
    event_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return event_service.join_event(db, event_id, user)


@router.post("/events/{event_id}/leave", response_model=EventResponse)
def leave_event(
    event_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return event_service.leave_event(db, event_id, user)


@router.get("/events/my", response_model=List[EventResponse])
def list_my_events(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return event_service.list_user_events(db, user)
