from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import SessionLocal
from models import Shipment, Booking, Driver, Vehicle, Invoice
from helpers import resolve_company_id
from datetime import datetime, timedelta
from collections import defaultdict

router = APIRouter(prefix="", tags=["Analytics"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/analytics/summary/{company_id}")
def analytics_summary(company_id: str, db: Session = Depends(get_db)):
    cid      = resolve_company_id(company_id, db)
    bookings = db.query(Booking).filter(Booking.company_id == cid).all()
    shipments = db.query(Shipment).filter(Shipment.company_id == cid).all()

    # Revenue by carrier
    carrier_revenue = defaultdict(float)
    carrier_count   = defaultdict(int)
    for b in bookings:
        carrier_revenue[b.carrier] += b.carrier_rate or 0
        carrier_count[b.carrier]   += 1

    # Revenue by month (last 6 months)
    monthly = defaultdict(float)
    monthly_count = defaultdict(int)
    for b in bookings:
        if b.created_at:
            key = b.created_at.strftime("%b %Y")
            monthly[key]       += b.carrier_rate or 0
            monthly_count[key] += 1

    # Booking status distribution
    status_dist = defaultdict(int)
    for b in bookings:
        status_dist[b.status] += 1

    # Shipment status distribution
    ship_dist = defaultdict(int)
    for s in shipments:
        ship_dist[s.status] += 1

    # Top cities by delivery volume
    city_count = defaultdict(int)
    for b in bookings:
        if b.receiver_city:
            city_count[b.receiver_city] += 1
    top_cities = sorted(city_count.items(), key=lambda x: x[1], reverse=True)[:8]

    # Weight distribution buckets
    weight_buckets = {"0-1kg": 0, "1-5kg": 0, "5-20kg": 0, "20kg+": 0}
    for b in bookings:
        w = b.weight_kg or 0
        if w <= 1:    weight_buckets["0-1kg"]  += 1
        elif w <= 5:  weight_buckets["1-5kg"]  += 1
        elif w <= 20: weight_buckets["5-20kg"] += 1
        else:         weight_buckets["20kg+"]  += 1

    # Total revenue & avg order value
    total_revenue = sum(b.carrier_rate or 0 for b in bookings)
    avg_order_val = round(total_revenue / len(bookings), 2) if bookings else 0

    # Delivery success rate
    delivered = sum(1 for b in bookings if b.status == "Delivered")
    success_rate = round((delivered / len(bookings)) * 100, 1) if bookings else 0

    return {
        "summary": {
            "total_bookings":   len(bookings),
            "total_revenue":    round(total_revenue, 2),
            "avg_order_value":  avg_order_val,
            "success_rate":     success_rate,
            "total_shipments":  len(shipments),
        },
        "revenue_by_carrier": [
            {"carrier": k, "revenue": round(v, 2), "count": carrier_count[k]}
            for k, v in sorted(carrier_revenue.items(), key=lambda x: x[1], reverse=True)
        ],
        "monthly_revenue": [
            {"month": k, "revenue": round(v, 2), "bookings": monthly_count[k]}
            for k, v in sorted(monthly.items())
        ],
        "booking_status": [
            {"status": k, "count": v} for k, v in status_dist.items()
        ],
        "shipment_status": [
            {"status": k, "count": v} for k, v in ship_dist.items()
        ],
        "top_cities": [
            {"city": c, "count": n} for c, n in top_cities
        ],
        "weight_distribution": [
            {"range": k, "count": v} for k, v in weight_buckets.items()
        ],
    }


@router.get("/analytics/revenue/{company_id}")
def revenue_trend(company_id: str, days: int = 30, db: Session = Depends(get_db)):
    """Daily revenue for last N days."""
    cid      = resolve_company_id(company_id, db)
    since    = datetime.utcnow() - timedelta(days=days)
    bookings = db.query(Booking).filter(
        Booking.company_id == cid,
        Booking.created_at >= since
    ).all()

    daily = defaultdict(float)
    for b in bookings:
        if b.created_at:
            day = b.created_at.strftime("%Y-%m-%d")
            daily[day] += b.carrier_rate or 0

    return {
        "days": days,
        "daily_revenue": [
            {"date": k, "revenue": round(v, 2)}
            for k, v in sorted(daily.items())
        ],
        "total": round(sum(daily.values()), 2),
    }


@router.get("/analytics/drivers/{company_id}")
def driver_performance(company_id: str, db: Session = Depends(get_db)):
    """Per-driver delivery counts and performance."""
    cid     = resolve_company_id(company_id, db)
    drivers = db.query(Driver).filter(Driver.company_id == cid).all()

    result = []
    for d in drivers:
        ships = db.query(Shipment).filter(Shipment.driver_id == d.id).all()
        delivered = sum(1 for s in ships if s.status == "Delivered")
        result.append({
            "driver_id":    d.id,
            "name":         d.name,
            "phone":        d.phone,
            "is_available": d.is_available,
            "total_trips":  len(ships),
            "delivered":    delivered,
            "pending":      len(ships) - delivered,
            "success_rate": round((delivered / len(ships)) * 100, 1) if ships else 0,
        })

    return sorted(result, key=lambda x: x["delivered"], reverse=True)