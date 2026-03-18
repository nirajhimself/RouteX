from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Shipment, Driver, Vehicle, Warehouse, Booking, Invoice, Inventory
from helpers import resolve_company_id

router = APIRouter(prefix="", tags=["Dashboard"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/dashboard/stats/{company_id}")
def dashboard_stats(company_id: str, db: Session = Depends(get_db)):
    cid = resolve_company_id(company_id, db)

    # Shipments
    all_shipments  = db.query(Shipment).filter(Shipment.company_id == cid).all()
    pending        = [s for s in all_shipments if s.status == "Pending"]
    delivered      = [s for s in all_shipments if s.status == "Delivered"]
    in_transit     = [s for s in all_shipments if s.status == "In Transit"]

    # Drivers & Vehicles
    all_drivers    = db.query(Driver).filter(Driver.company_id == cid).all()
    all_vehicles   = db.query(Vehicle).filter(Vehicle.company_id == cid).all()

    # Bookings
    all_bookings   = db.query(Booking).filter(Booking.company_id == cid).all()
    total_revenue  = sum(b.carrier_rate for b in all_bookings)
    booked         = [b for b in all_bookings if b.status == "Booked"]
    booking_delivered = [b for b in all_bookings if b.status == "Delivered"]

    # Invoices
    all_invoices   = db.query(Invoice).all()
    paid_invoices  = [i for i in all_invoices if i.status == "paid"]
    overdue_inv    = [i for i in all_invoices if i.status == "overdue"]

    # Warehouses
    all_warehouses = db.query(Warehouse).filter(Warehouse.company_id == cid).all()

    return {
        "shipments": {
            "total":      len(all_shipments),
            "pending":    len(pending),
            "in_transit": len(in_transit),
            "delivered":  len(delivered),
        },
        "drivers": {
            "total":     len(all_drivers),
            "available": sum(1 for d in all_drivers if d.is_available),
            "on_trip":   sum(1 for d in all_drivers if not d.is_available),
        },
        "vehicles": {
            "total":     len(all_vehicles),
            "available": sum(1 for v in all_vehicles if v.is_available),
            "in_use":    sum(1 for v in all_vehicles if not v.is_available),
        },
        "bookings": {
            "total":     len(all_bookings),
            "booked":    len(booked),
            "delivered": len(booking_delivered),
            "revenue":   round(total_revenue, 2),
        },
        "invoices": {
            "total":           len(all_invoices),
            "paid_amount":     round(sum(i.total for i in paid_invoices), 2),
            "overdue_count":   len(overdue_inv),
            "overdue_amount":  round(sum(i.total for i in overdue_inv), 2),
        },
        "warehouses": {
            "total":          len(all_warehouses),
            "total_capacity": round(sum(w.capacity for w in all_warehouses), 2),
        },
    }