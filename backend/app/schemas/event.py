from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, validator
from app.schemas.auth import ProfileResponse


class EventCreateRequest(BaseModel):
    title: str
    short_description: Optional[str] = None
    description: str
    start_date: datetime
    end_date: datetime
    image_url: str
    city: str
    payment_info: Optional[str] = None
    max_participants: Optional[int] = Field(default=None, ge=1)
    participant_ids: List[UUID] = []

    @validator("end_date")
    def end_after_start(cls, v, values):
        start = values.get("start_date")
        if start and v < start:
            raise ValueError("Дата окончания должна быть не раньше даты начала")
        return v


class EventUpdateRequest(BaseModel):
    title: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    image_url: Optional[str] = None
    city: Optional[str] = None
    payment_info: Optional[str] = None
    max_participants: Optional[int] = Field(default=None, ge=1)
    participant_ids: Optional[List[UUID]] = None
    status: Optional[str] = None

    @validator("end_date")
    def end_after_start(cls, v, values):
        start = values.get("start_date")
        if start and v and v < start:
            raise ValueError("Дата окончания должна быть не раньше даты начала")
        return v


class EventResponse(BaseModel):
    id: UUID
    title: str
    short_description: Optional[str]
    description: str
    start_date: datetime
    end_date: datetime
    image_url: str
    city: str
    payment_info: Optional[str]
    max_participants: Optional[int]
    status: str
    is_deleted: bool
    participants: List[UUID]

    class Config:
        from_attributes = True


class ParticipationUser(BaseModel):
    id: UUID
    full_name: str
    email: str


class ParticipationLogResponse(BaseModel):
    active: List[ParticipationUser]
    declined: List[ParticipationUser]
