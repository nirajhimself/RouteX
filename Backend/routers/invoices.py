import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import SessionLocal
from models import Invoice
from schemas import InvoiceCreate, InvoiceStatusUpdate
from typing import List

router = APIRouter(prefix="", tags=["Invoices"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _compute_totals(items, tax_rate: float):
    subtotal = sum(i.quantity * i.unit_price for i in items)
    tax      = subtotal * ((tax_rate or 0) / 100)
    return round(subtotal, 2), round(tax, 2), round(subtotal + tax, 2)


def _to_dict(inv: Invoice) -> dict:
    return {
        "id":             inv.id,
        "invoice_number": inv.invoice_number,
        "client_name":    inv.client_name,
        "client_email":   inv.client_email,
        "client_address": inv.client_address,
        "issue_date":     inv.issue_date,
        "due_date":       inv.due_date,
        "items":          json.loads(inv.items or "[]"),
        "tax_rate":       inv.tax_rate,
        "subtotal":       inv.subtotal,
        "tax":            inv.tax,
        "total":          inv.total,
        "notes":          inv.notes,
        "status":         inv.status,
        "created_at":     str(inv.created_at),
        "updated_at":     str(inv.updated_at),
    }


@router.get("/invoices")
def get_invoices(db: Session = Depends(get_db)):
    return [_to_dict(i) for i in db.query(Invoice).order_by(Invoice.created_at.desc()).all()]


@router.get("/invoices/summary/stats")
def invoice_stats(db: Session = Depends(get_db)):
    all_inv = db.query(Invoice).all()
    return {
        "total_count":       len(all_inv),
        "draft_count":       sum(1 for i in all_inv if i.status == "draft"),
        "sent_count":        sum(1 for i in all_inv if i.status == "sent"),
        "paid_total":        sum(i.total for i in all_inv if i.status == "paid"),
        "outstanding_total": sum(i.total for i in all_inv if i.status in ("sent", "overdue")),
        "overdue_count":     sum(1 for i in all_inv if i.status == "overdue"),
    }


@router.get("/invoices/{invoice_id}")
def get_invoice(invoice_id: str, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return _to_dict(inv)


@router.post("/invoices", status_code=201)
def create_invoice(payload: InvoiceCreate, db: Session = Depends(get_db)):
    if db.query(Invoice).filter(Invoice.invoice_number == payload.invoice_number).first():
        raise HTTPException(status_code=400, detail="Invoice number already exists")
    subtotal, tax, total = _compute_totals(payload.items, payload.tax_rate or 0)
    inv = Invoice(
        id=str(uuid.uuid4()),
        invoice_number=payload.invoice_number,
        client_name=payload.client_name,
        client_email=payload.client_email,
        client_address=payload.client_address,
        issue_date=payload.issue_date,
        due_date=payload.due_date,
        items=json.dumps([i.dict() for i in payload.items]),
        tax_rate=payload.tax_rate,
        subtotal=subtotal, tax=tax, total=total,
        notes=payload.notes,
        status=payload.status or "draft",
    )
    db.add(inv); db.commit(); db.refresh(inv)
    return _to_dict(inv)


@router.put("/invoices/{invoice_id}")
def update_invoice(invoice_id: str, payload: InvoiceCreate, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    subtotal, tax, total = _compute_totals(payload.items, payload.tax_rate or 0)
    inv.invoice_number = payload.invoice_number
    inv.client_name    = payload.client_name
    inv.client_email   = payload.client_email
    inv.client_address = payload.client_address
    inv.issue_date     = payload.issue_date
    inv.due_date       = payload.due_date
    inv.items          = json.dumps([i.dict() for i in payload.items])
    inv.tax_rate       = payload.tax_rate
    inv.subtotal       = subtotal
    inv.tax            = tax
    inv.total          = total
    inv.notes          = payload.notes
    inv.status         = payload.status
    inv.updated_at     = datetime.utcnow()
    db.commit(); db.refresh(inv)
    return _to_dict(inv)


@router.patch("/invoices/{invoice_id}/status")
def update_invoice_status(invoice_id: str, body: InvoiceStatusUpdate, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    valid = {"draft", "sent", "paid", "overdue", "cancelled"}
    if body.status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid}")
    inv.status     = body.status
    inv.updated_at = datetime.utcnow()
    db.commit(); db.refresh(inv)
    return _to_dict(inv)


@router.delete("/invoices/{invoice_id}", status_code=204)
def delete_invoice(invoice_id: str, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(inv); db.commit()