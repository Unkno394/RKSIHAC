from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.core import email_utils
from app.db.models import Event
from app.repositories import event_repo, user_repo
from app.schemas.event import EventCreateRequest, EventResponse, EventUpdateRequest


def _touch_past_events(db: Session) -> None:
    """Автоматически помечаем прошедшие события."""
    now = datetime.utcnow()
    events = event_repo.list_events(db, include_deleted=False)
    for ev in events:
        if ev.end_date < now and ev.status != "past":
            ev.status = "past"
            db.add(ev)
    db.commit()


def _as_response(event: Event) -> EventResponse:
    return EventResponse(
        id=event.id,
        title=event.title,
        short_description=event.short_description,
        description=event.description,
        start_date=event.start_date,
        end_date=event.end_date,
        image_url=event.image_url,
        city=event.city,
        payment_info=event.payment_info,
        max_participants=event.max_participants,
        status=event.status,
        is_deleted=event.is_deleted,
        participants=[p.id for p in event.participants],
    )


def list_events(db: Session, status: Optional[str] = None) -> list[EventResponse]:
    _touch_past_events(db)
    events = event_repo.list_events(db, status=status, include_deleted=False)
    return [_as_response(ev) for ev in events]


def get_event(db: Session, event_id: UUID) -> Optional[EventResponse]:
    _touch_past_events(db)
    ev = event_repo.get_event(db, event_id)
    if not ev:
        return None
    return _as_response(ev)


def create_event(db: Session, data: EventCreateRequest) -> EventResponse:
    participants = []
    if data.participant_ids:
        participants = user_repo.get_by_ids(db, data.participant_ids)
    status = "active"
    now = datetime.utcnow()
    if data.start_date > now:
        status = "upcoming"
    if data.end_date < now:
        status = "past"
    event = event_repo.create_event(
        db=db,
        title=data.title,
        short_description=data.short_description,
        description=data.description,
        start_date=data.start_date,
        end_date=data.end_date,
        image_url=data.image_url,
        city=data.city,
        payment_info=data.payment_info,
        max_participants=data.max_participants,
        participants=participants,
        status=status,
    )
    if participants:
        email_utils.send_event_notification([p.email for p in participants], event)
    return _as_response(event)


def update_event(db: Session, event_id: UUID, data: EventUpdateRequest) -> Optional[EventResponse]:
    event = event_repo.get_event(db, event_id)
    if not event or event.is_deleted:
        return None
    participants = None
    if data.participant_ids is not None:
        participants = user_repo.get_by_ids(db, data.participant_ids)
    event = event_repo.update_event(
        db,
        event,
        title=data.title,
        short_description=data.short_description,
        description=data.description,
        start_date=data.start_date,
        end_date=data.end_date,
        image_url=data.image_url,
        city=data.city,
        payment_info=data.payment_info,
        max_participants=data.max_participants,
        participants=participants,
        status=data.status,
    )
    return _as_response(event)


def soft_delete_event(db: Session, event_id: UUID) -> Optional[EventResponse]:
    event = event_repo.get_event(db, event_id)
    if not event:
        return None
    return _as_response(event_repo.soft_delete_event(db, event))
