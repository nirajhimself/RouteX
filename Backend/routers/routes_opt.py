import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Shipment, Driver, Vehicle
from schemas import OptimizeRequest, MultiStopRequest, DelayPrediction
from helpers import resolve_company_id
from ai_route_optimizer import optimize_vrp
from route_optimizer import optimize_route_vrp
import joblib

router = APIRouter(prefix="", tags=["Routes"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Load AI delay model once
try:
    delay_model = joblib.load("delay_model.pkl")
    print("✅ Delay prediction model loaded")
except:
    delay_model = None
    print("⚠ Delay model not found")


@router.post("/optimize-route")
def optimize_route(request: OptimizeRequest, db: Session = Depends(get_db)):
    cid       = resolve_company_id(request.company_id, db)
    shipments = db.query(Shipment).filter(Shipment.company_id == cid, Shipment.status == "Pending").all()
    driver    = db.query(Driver).filter(Driver.company_id == cid, Driver.is_available == True).first()
    vehicle   = db.query(Vehicle).filter(Vehicle.company_id == cid, Vehicle.is_available == True).first()

    locations = [[28.7041, 77.1025]]; demands = [0]
    for s in (shipments or [None]):
        locations.append([28.5 + random.uniform(-0.05, 0.05), 77.2 + random.uniform(-0.05, 0.05)])
        demands.append(int(s.weight) if s else 1)

    vehicle_capacity = int(vehicle.capacity) if vehicle else 100
    result = optimize_vrp(locations, demands, vehicle_capacity, 1)
    result["origin"]      = request.origin
    result["destination"] = request.destination
    result["driver"]      = driver.name if driver else "No driver assigned"
    result["vehicle"]     = vehicle.vehicle_number if vehicle else "No vehicle assigned"
    result["waypoints"]   = [request.origin, request.destination]
    return result


@router.post("/optimize-multi-stop")
async def optimize_multi_stop(request: MultiStopRequest, db: Session = Depends(get_db)):
    cid = resolve_company_id(request.company_id, db)
    if len(request.stops) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 stops")
    driver  = db.query(Driver).filter(Driver.company_id == cid, Driver.is_available == True).first()
    vehicle = db.query(Vehicle).filter(Vehicle.company_id == cid, Vehicle.is_available == True).first()
    try:
        result = await optimize_route_vrp(
            locations=request.stops,
            vehicle_type=request.vehicle_type,
            priority=request.priority,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")
    result["driver"]     = driver.name if driver else "No driver assigned"
    result["vehicle"]    = vehicle.vehicle_number if vehicle else "No vehicle assigned"
    result["company_id"] = cid
    return result


@router.post("/predict-delay")
def predict_delay(data: DelayPrediction):
    if delay_model is None:
        raise HTTPException(status_code=500, detail="Delay model not loaded")
    prediction = delay_model.predict([[data.distance, data.traffic, data.vehicle_type]])
    return {"delay_prediction": int(prediction[0])}