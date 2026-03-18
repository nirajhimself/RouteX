from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Booking, Client
from schemas import BookingCreate, BookingStatusUpdate, ClientCreate
from helpers import resolve_company_id, generate_tracking_number, calculate_carrier_rates

router = APIRouter(prefix="", tags=["Bookings"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Carrier Rates ─────────────────────────────────────────────────────────────
@router.get("/carrier-rates")
def get_carrier_rates(weight: float, destination: str, origin: str = "Mumbai"):
    rates = calculate_carrier_rates(weight, destination, origin)
    return {"rates": rates, "weight_kg": weight, "destination": destination}


# ── Clients ───────────────────────────────────────────────────────────────────
@router.post("/clients/create")
def create_client(data: ClientCreate, db: Session = Depends(get_db)):
    cid = resolve_company_id(data.company_id, db)
    client = Client(
        company_id=cid, type=data.type, name=data.name,
        email=data.email, phone=data.phone, address=data.address,
        city=data.city, pincode=data.pincode,
        gst_number=data.gst_number, company_name=data.company_name,
    )
    db.add(client); db.commit(); db.refresh(client)
    return client


@router.get("/clients/{company_id}")
def get_clients(company_id: str, db: Session = Depends(get_db)):
    cid = resolve_company_id(company_id, db)
    return db.query(Client).filter(Client.company_id == cid).order_by(Client.created_at.desc()).all()


# ── Bookings ──────────────────────────────────────────────────────────────────
@router.post("/bookings/create")
def create_booking(data: BookingCreate, db: Session = Depends(get_db)):
    cid = resolve_company_id(data.company_id, db)
    tracking_number = generate_tracking_number(data.carrier)
    while db.query(Booking).filter(Booking.tracking_number == tracking_number).first():
        tracking_number = generate_tracking_number(data.carrier)

    booking = Booking(
        company_id=cid, tracking_number=tracking_number,
        booking_type=data.booking_type,
        sender_name=data.sender_name, sender_address=data.sender_address,
        sender_city=data.sender_city, sender_pincode=data.sender_pincode,
        client_id=data.client_id,
        receiver_name=data.receiver_name, receiver_phone=data.receiver_phone,
        receiver_address=data.receiver_address, receiver_city=data.receiver_city,
        receiver_pincode=data.receiver_pincode,
        product_name=data.product_name, description=data.description,
        weight_kg=data.weight_kg, length_cm=data.length_cm,
        width_cm=data.width_cm, height_cm=data.height_cm,
        declared_value=data.declared_value,
        carrier=data.carrier, service_type=data.service_type,
        carrier_rate=data.carrier_rate, estimated_days=data.estimated_days,
        qr_data=tracking_number, status="Booked",
    )
    db.add(booking); db.commit(); db.refresh(booking)
    return {
        "id":             booking.id,
        "tracking_number": booking.tracking_number,
        "qr_data":        booking.qr_data,
        "carrier":        booking.carrier,
        "service_type":   booking.service_type,
        "carrier_rate":   booking.carrier_rate,
        "estimated_days": booking.estimated_days,
        "status":         booking.status,
        "created_at":     str(booking.created_at),
    }


@router.get("/bookings/{company_id}")
def get_bookings(company_id: str, db: Session = Depends(get_db)):
    cid = resolve_company_id(company_id, db)
    return db.query(Booking).filter(Booking.company_id == cid).order_by(Booking.created_at.desc()).all()


@router.get("/booking/track/{tracking_number}")
def track_booking(tracking_number: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.tracking_number == tracking_number).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Tracking number not found")
    return {
        "tracking_number": booking.tracking_number,
        "status":          booking.status,
        "carrier":         booking.carrier,
        "service_type":    booking.service_type,
        "estimated_days":  booking.estimated_days,
        "receiver_name":   booking.receiver_name,
        "receiver_city":   booking.receiver_city,
        "product_name":    booking.product_name,
        "created_at":      str(booking.created_at),
    }


@router.patch("/booking/{booking_id}/status")
def update_booking_status(booking_id: int, data: BookingStatusUpdate, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = data.status
    db.commit(); db.refresh(booking)
    return {"id": booking.id, "tracking_number": booking.tracking_number, "new_status": booking.status}