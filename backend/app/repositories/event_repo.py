from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import Event, User


def list_events(
    db: Session,
    status: Optional[str] = None,
    include_deleted: bool = False,
) -> List[Event]:
    query = db.query(Event)
    if not include_deleted:
        query = query.filter(Event.is_deleted == False)  # noqa: E712
    if status:
        query = query.filter(Event.status == status)
    return query.order_by(Event.start_date).all()


def get_event(db: Session, event_id: UUID) -> Optional[Event]:
    return db.query(Event).filter(Event.id == event_id).first()


def create_event(
    db: Session,
    title: str,
    short_description: Optional[str],
    description: str,
    start_date: datetime,
    end_date: datetime,
    image_url: str,
    city: str,
    payment_info: Optional[str],
    max_participants: Optional[int],
    participants: List[User],
    status: str,
) -> Event:
    event = Event(
        title=title,
        short_description=short_description,
        description=description,
        start_date=start_date,
        end_date=end_date,
        image_url=image_url,
        city=city,
        payment_info=payment_info,
        max_participants=max_participants,
        participants=participants,
        status=status,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def update_event(
    db: Session,
    event: Event,
    *,
    title: Optional[str] = None,
    short_description: Optional[str] = None,
    description: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    image_url: Optional[str] = None,
    city: Optional[str] = None,
    payment_info: Optional[str] = None,
    max_participants: Optional[int] = None,
    participants: Optional[List[User]] = None,
    status: Optional[str] = None,
) -> Event:
    if title is not None:
        event.title = title
    if short_description is not None:
        event.short_description = short_description
    if description is not None:
        event.description = description
    if start_date is not None:
        event.start_date = start_date
    if end_date is not None:
        event.end_date = end_date
    if image_url is not None:
        event.image_url = image_url
    if city is not None:
        event.city = city
    if payment_info is not None:
        event.payment_info = payment_info
    if max_participants is not None:
        event.max_participants = max_participants
    if participants is not None:
        event.participants = participants
    if status is not None:
        event.status = status
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def soft_delete_event(db: Session, event: Event) -> Event:
    event.is_deleted = True
    event.status = "deleted"
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
