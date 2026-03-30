from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Vehicle
from schemas import VehicleCreate
from helpers import resolve_company_id

router = APIRouter(prefix="", tags=["Vehicles"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/create-vehicle")
def create_vehicle(data: VehicleCreate, db: Session = Depends(get_db)):
    cid = resolve_company_id(data.company_id, db)
    vehicle = Vehicle(
        company_id=cid,
        vehicle_number=data.vehicle_number,
        vehicle_type=data.vehicle_type,
        capacity=data.capacity,
        fuel_type=data.fuel_type,        # ✅ add this
        is_available=True
    )
    db.add(vehicle); db.commit(); db.refresh(vehicle)
    return vehicle


@router.get("/vehicles/{company_id}")
def get_vehicles(company_id: str, db: Session = Depends(get_db)):
    try:
        cid = int(company_id)
        data = db.query(Vehicle).filter(Vehicle.company_id == cid).all()
        return data
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "trace": traceback.format_exc()
        }