from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import SessionLocal, engine
from models import Base
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="", tags=["Notifications"])

# ── Notification DB Model ─────────────────────────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"
    id         = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    title      = Column(String)
    message    = Column(String)
    type       = Column(String, default="info")   # info | success | warning | error
    category   = Column(String, default="system") # system | shipment | booking | driver | invoice
    is_read    = Column(Boolean, default=False)
    link       = Column(String, nullable=True)    # optional deep-link e.g. /invoices/123
    created_at = Column(DateTime, default=datetime.utcnow)

# Create the table if it doesn't exist
Base.metadata.create_all(bind=engine)


# ── Schemas ───────────────────────────────────────────────────────────────────
class NotificationCreate(BaseModel):
    company_id: int
    title:      str
    message:    str
    type:       Optional[str] = "info"
    category:   Optional[str] = "system"
    link:       Optional[str] = None

class MarkReadBody(BaseModel):
    ids: list[int]  # list of notification IDs to mark read


# ── DB Dependency ─────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Helper: create a notification programmatically ───────────────────────────
def create_notification(db: Session, company_id: int, title: str, message: str,
                         type: str = "info", category: str = "system", link: str = None):
    n = Notification(
        company_id=company_id, title=title, message=message,
        type=type, category=category, link=link,
    )
    db.add(n); db.commit(); db.refresh(n)
    return n


# ── Routes ────────────────────────────────────────────────────────────────────
@router.get("/notifications/{company_id}")
def get_notifications(company_id: int, unread_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(Notification).filter(Notification.company_id == company_id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
    unread_count  = db.query(Notification).filter(
        Notification.company_id == company_id,
        Notification.is_read == False
    ).count()
    return {
        "notifications": [_to_dict(n) for n in notifications],
        "unread_count":  unread_count,
        "total":         len(notifications),
    }


@router.post("/notifications", status_code=201)
def post_notification(data: NotificationCreate, db: Session = Depends(get_db)):
    n = create_notification(
        db, data.company_id, data.title, data.message,
        data.type, data.category, data.link
    )
    return _to_dict(n)


@router.patch("/notifications/read")
def mark_read(body: MarkReadBody, db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.id.in_(body.ids)).update(
        {"is_read": True}, synchronize_session=False
    )
    db.commit()
    return {"marked_read": len(body.ids)}


@router.patch("/notifications/read-all/{company_id}")
def mark_all_read(company_id: int, db: Session = Depends(get_db)):
    count = db.query(Notification).filter(
        Notification.company_id == company_id,
        Notification.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"marked_read": count}


@router.delete("/notifications/{notification_id}", status_code=204)
def delete_notification(notification_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(n); db.commit()


@router.delete("/notifications/clear/{company_id}", status_code=204)
def clear_all_notifications(company_id: int, db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.company_id == company_id).delete()
    db.commit()


# ── Serializer ────────────────────────────────────────────────────────────────
def _to_dict(n: Notification) -> dict:
    return {
        "id":         n.id,
        "company_id": n.company_id,
        "title":      n.title,
        "message":    n.message,
        "type":       n.type,
        "category":   n.category,
        "is_read":    n.is_read,
        "link":       n.link,
        "created_at": str(n.created_at),
    }