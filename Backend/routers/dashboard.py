from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Shipment, Driver, Vehicle, Warehouse, Booking, Invoice

router = APIRouter(prefix="", tags=["Dashboard"])


# ── DB Dependency ─────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Dashboard Stats ───────────────────────────────────────────
@router.get("/dashboard/stats/{company_id}")
def dashboard_stats(company_id: str, db: Session = Depends(get_db)):
    try:
        # ✅ SAFE company_id handling (no crash)
        cid = int(company_id)

        # ── Shipments ─────────────────────────────────────────
        all_shipments = db.query(Shipment).filter(Shipment.company_id == cid).all()

        pending    = [s for s in all_shipments if getattr(s, "status", "") == "Pending"]
        delivered  = [s for s in all_shipments if getattr(s, "status", "") == "Delivered"]
        in_transit = [s for s in all_shipments if getattr(s, "status", "") == "In Transit"]

        # ── Drivers & Vehicles ────────────────────────────────
        all_drivers  = db.query(Driver).filter(Driver.company_id == cid).all()
        all_vehicles = db.query(Vehicle).filter(Vehicle.company_id == cid).all()

        # ── Bookings ──────────────────────────────────────────
        all_bookings = db.query(Booking).filter(Booking.company_id == cid).all()

        total_revenue = sum(getattr(b, "carrier_rate", 0) or 0 for b in all_bookings)

        booked = [b for b in all_bookings if getattr(b, "status", "") == "Booked"]
        booking_delivered = [b for b in all_bookings if getattr(b, "status", "") == "Delivered"]

        # ── Invoices ──────────────────────────────────────────
        all_invoices = db.query(Invoice).all()

        paid_invoices = [i for i in all_invoices if getattr(i, "status", "") == "paid"]
        overdue_inv   = [i for i in all_invoices if getattr(i, "status", "") == "overdue"]

        # ── Warehouses ────────────────────────────────────────
        all_warehouses = db.query(Warehouse).filter(Warehouse.company_id == cid).all()

        # ── RESPONSE ──────────────────────────────────────────
        return {
            "shipments": {
                "total": len(all_shipments),
                "pending": len(pending),
                "in_transit": len(in_transit),
                "delivered": len(delivered),
            },
            "drivers": {
                "total": len(all_drivers),
                "available": sum(1 for d in all_drivers if getattr(d, "is_available", False)),
                "on_trip": sum(1 for d in all_drivers if not getattr(d, "is_available", True)),
            },
            "vehicles": {
                "total": len(all_vehicles),
                "available": sum(1 for v in all_vehicles if getattr(v, "is_available", False)),
                "in_use": sum(1 for v in all_vehicles if not getattr(v, "is_available", True)),
            },
            "bookings": {
                "total": len(all_bookings),
                "booked": len(booked),
                "delivered": len(booking_delivered),
                "revenue": round(total_revenue, 2),
            },
            "invoices": {
                "total": len(all_invoices),
                "paid_amount": round(sum(getattr(i, "total", 0) or 0 for i in paid_invoices), 2),
                "overdue_count": len(overdue_inv),
                "overdue_amount": round(sum(getattr(i, "total", 0) or 0 for i in overdue_inv), 2),
            },
            "warehouses": {
                "total": len(all_warehouses),
                "total_capacity": round(sum(getattr(w, "capacity", 0) or 0 for w in all_warehouses), 2),
            },
        }

    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "trace": traceback.format_exc()
        }