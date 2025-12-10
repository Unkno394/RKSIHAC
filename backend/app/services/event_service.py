from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core import email_utils
from app.db.models import Event
from app.repositories import event_repo, user_repo
from app.core.ws_manager import ws_manager
from app.schemas.event import EventCreateRequest, EventResponse, EventUpdateRequest


def _touch_past_events(db: Session) -> None:
    """Автоматически помечаем прошедшие события (по дате)."""
    now = datetime.utcnow()
    events = event_repo.list_events(db, include_deleted=False)
    for ev in events:
        if _calc_status(ev.start_date, ev.end_date, now) == "past" and ev.status != "past":
            ev.status = "past"
            db.add(ev)
    db.commit()


def _calc_status(start: datetime, end: datetime, now: datetime) -> str:
    """Определяем статус события на основе дат (по календарным дням)."""
    if end.date() < now.date():
        return "past"
    if start.date() > now.date():
        return "upcoming"
    return "active"


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


def list_user_events(db: Session, user) -> list[EventResponse]:
    _touch_past_events(db)
    events = event_repo.list_events_by_user(db, user)
    return [_as_response(ev) for ev in events]


def create_event(db: Session, data: EventCreateRequest) -> EventResponse:
    participants = []
    if data.participant_ids:
        participants = user_repo.get_by_ids(db, data.participant_ids)
    now = datetime.utcnow()
    status = _calc_status(data.start_date, data.end_date, now)
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
    # если статус не передан вручную — пересчитываем по датам
    if data.status is None:
        now = datetime.utcnow()
        event.status = _calc_status(event.start_date, event.end_date, now)
        db.add(event)
        db.commit()
        db.refresh(event)
    return _as_response(event)


def soft_delete_event(db: Session, event_id: UUID) -> Optional[EventResponse]:
    event = event_repo.get_event(db, event_id)
    if not event:
        return None
    return _as_response(event_repo.soft_delete_event(db, event))


def join_event(db: Session, event_id: UUID, user) -> EventResponse:
    event = event_repo.get_event(db, event_id)
    if not event or event.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Событие не найдено")
    now = datetime.utcnow()
    if event.end_date < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Событие уже прошло")
    if event.max_participants is not None and len(event.participants) >= event.max_participants:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Достигнут максимальный лимит участников")
    if user in event.participants:
        return _as_response(event)
    event.participants.append(user)
    db.add(event)
    db.commit()
    db.refresh(event)
    try:
        event_repo.add_participant_log(db, event.id, user.id, "join")
        ws_manager.broadcast_from_thread(
            f'{{"type":"participant","action":"join","event_id":"{event.id}","user_id":"{user.id}"}}'
        )
    except Exception:
        pass
    return _as_response(event)


def leave_event(db: Session, event_id: UUID, user) -> EventResponse:
    event = event_repo.get_event(db, event_id)
    if not event or event.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Событие не найдено")
    if user in event.participants:
        event.participants = [p for p in event.participants if p.id != user.id]
        db.add(event)
        db.commit()
        db.refresh(event)
        try:
          event_repo.add_participant_log(db, event.id, user.id, "leave")
          ws_manager.broadcast_from_thread(
              f'{{"type":"participant","action":"leave","event_id":"{event.id}","user_id":"{user.id}"}}'
          )
        except Exception:
          pass
    return _as_response(event)


def get_participation_log(db: Session, event_id: UUID):
    event = event_repo.get_event(db, event_id)
    if not event or event.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Событие не найдено")

    logs = event_repo.get_participant_logs(db, event_id)
    last_action = {}
    for log in logs:
        last_action[log.user_id] = log.action

    user_ids = list(last_action.keys())
    users = user_repo.get_by_ids(db, user_ids)
    users_map = {u.id: u for u in users}

    active = []
    declined = []
    for uid, action in last_action.items():
        user = users_map.get(uid)
        if not user:
            continue
        info = {"id": user.id, "full_name": user.full_name, "email": user.email}
        if action == "join":
            active.append(info)
        else:
            declined.append(info)

    return {"active": active, "declined": declined}
