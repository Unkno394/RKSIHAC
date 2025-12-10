# app/schemas/auth.py
import re
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, validator


FULL_NAME_REGEX = re.compile(r"^[А-Яа-яЁё\s-]+$")


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    password_confirm: str

    @validator("full_name")
    def full_name_must_be_russian(cls, v: str):
        if not FULL_NAME_REGEX.match(v):
            raise ValueError("ФИО должно содержать только русские буквы и пробелы")
        return v

    @validator("password")
    def password_requirements(cls, v: str):
        if len(v) < 8:
            raise ValueError("Пароль должен быть не менее 8 символов")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Пароль должен содержать латинские буквы")
        if not re.search(r"\d", v):
            raise ValueError("Пароль должен содержать цифры")
        # если нужно — можно добавить проверку на спецсимволы
        return v

    @validator("password_confirm")
    def passwords_match(cls, v: str, values):
        password = values.get("password")
        if password and v != password:
            raise ValueError("Пароль и подтверждение пароля не совпадают")
        return v


class RegisterResponse(BaseModel):
    message: str


class ConfirmEmailRequest(BaseModel):
    email: EmailStr
    code: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str
    new_password_confirm: str


class ResetCodeVerifyRequest(BaseModel):
    email: EmailStr
    token: str


class ProfileResponse(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    role: str
    is_active: bool
    avatar_url: Optional[str] = None
    about: Optional[str] = None


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    about: Optional[str] = None
    avatar_url: Optional[str] = None


class UserListResponse(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    role: str
    created_at: datetime
    is_active: bool
    is_deleted: bool
    avatar_url: Optional[str] = None


class AdminUserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None


class AdminResetPasswordRequest(BaseModel):
    new_password: str


class AdminResetPasswordResponse(BaseModel):
    message: str
    new_password: str


class EventRequest(BaseModel):
    title: str
    short_description: Optional[str] = None
    description: str
    start_date: datetime
    end_date: datetime
    image_url: str
    payment_info: Optional[str] = None
    max_participants: Optional[int] = None
    participant_ids: list[UUID] = []


class EventResponse(BaseModel):
    id: UUID
    title: str
    short_description: Optional[str]
    description: str
    start_date: datetime
    end_date: datetime
    image_url: str
    payment_info: Optional[str]
    max_participants: Optional[int]
    status: str
    is_deleted: bool
    participants: list[UUID]

    class Config:
        orm_mode = True
