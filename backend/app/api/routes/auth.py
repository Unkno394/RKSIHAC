from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer

from uuid import UUID
from app.db.base import get_db
from app.repositories import user_repo
from app.services import auth_service
from app.db.models import User
from app.schemas.auth import (
    RegisterRequest,
    RegisterResponse,
    ConfirmEmailRequest,
    LoginRequest,
    LoginResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ResetCodeVerifyRequest,
    ProfileResponse,
    ProfileUpdateRequest,
)
from app.core.security import decode_access_token

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
def get_current_user_id(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=403, detail="Неверный или истекший токен")
    return payload.get("sub")


@router.get("/profile", response_model=ProfileResponse)
def get_user_profile(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    user_uuid = UUID(str(user_id))
    user = user_repo.get_by_id(db, user_uuid)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
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
    user_id: str = Depends(get_current_user_id),
):
    user_uuid = UUID(str(user_id))
    user = user_repo.get_by_id(db, user_uuid)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
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
