from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from database import SessionLocal
from models import Vehicle
from schemas import LocationUpdate
from helpers import resolve_company_id

router = APIRouter(prefix="", tags=["Tracking"])

# Shared in-memory GPS store — imported by main.py too
live_locations: dict = {}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/update-location")
def update_location(data: LocationUpdate, db: Session = Depends(get_db)):
    live_locations[data.vehicle_id] = {
        "vehicle_id": data.vehicle_id,
        "lat": data.latitude,
        "lng": data.longitude,
        "speed": data.speed,
        "updated_at": str(datetime.utcnow()),
    }
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_number == data.vehicle_id).first()
    if vehicle:
        vehicle.is_available = False
        db.commit()
    return {"status": "ok", "vehicle_id": data.vehicle_id}


@router.get("/live-vehicles/{company_id}")
def get_live_vehicles(company_id: str, db: Session = Depends(get_db)):
    cid = resolve_company_id(company_id, db)
    vehicles = db.query(Vehicle).filter(Vehicle.company_id == cid).all()
    result = []
    for v in vehicles:
        loc = live_locations.get(v.vehicle_number, {})
        result.append({
            "id":             v.vehicle_number,
            "vehicle_number": v.vehicle_number,
            "vehicle_type":   v.vehicle_type,
            "status":         "Moving" if loc.get("speed", 0) > 0 else ("Active" if loc else "Parked"),
            "lat":            loc.get("lat"),
            "lng":            loc.get("lng"),
            "speed":          loc.get("speed", 0),
            "updated_at":     loc.get("updated_at"),
            "has_location":   bool(loc),
        })
    return result