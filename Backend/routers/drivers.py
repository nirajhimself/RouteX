from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import SessionLocal
from models import Driver
from schemas import DriverCreate, DriverLogin
from helpers import resolve_company_id

router = APIRouter(prefix="", tags=["Drivers"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/create-driver")
def create_driver(data: DriverCreate, db: Session = Depends(get_db)):
    cid = resolve_company_id(data.company_id, db)
    driver = Driver(company_id=cid, name=data.name, phone=data.phone, is_available=True)
    db.add(driver); db.commit(); db.refresh(driver)
    return driver


@router.get("/drivers/{company_id}")
def get_drivers(company_id: str, db: Session = Depends(get_db)):
    try:
        cid = int(company_id)
        drivers = db.query(Driver).filter(Driver.company_id == cid).all()
        return drivers
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "trace": traceback.format_exc()
        }
    
@router.post("/driver/login")
def driver_login(data: DriverLogin, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.name == data.name, Driver.phone == data.phone).first()
    if not driver:
        driver = db.query(Driver).filter(Driver.name == data.name).first()
    if not driver:
        driver = db.query(Driver).filter(Driver.name.ilike(f"%{data.name}%")).first()
    if not driver:
        raise HTTPException(status_code=404, detail=f"Driver '{data.name}' not found.")
    return {"id": driver.id, "name": driver.name, "phone": driver.phone,
            "company_id": driver.company_id, "is_available": driver.is_available}


@router.get("/driver/{driver_id}/shipments")
def get_driver_shipments(driver_id: int, db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT id, pickup_location, delivery_location, weight, status,
               driver_id, proof_photo, created_at
        FROM shipments WHERE driver_id = :driver_id
        ORDER BY created_at DESC
    """), {"driver_id": driver_id}).fetchall()
    return [
        {"id": r[0], "pickup_location": r[1], "delivery_location": r[2],
         "weight": r[3], "status": r[4], "driver_id": r[5],
         "has_proof": bool(r[6]), "created_at": str(r[7])}
        for r in rows
    ]