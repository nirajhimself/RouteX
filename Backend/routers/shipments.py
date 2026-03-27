from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Shipment
from schemas import ShipmentCreate, StatusUpdate, AssignDriver, ProofUpload
from helpers import resolve_company_id

router = APIRouter(prefix="", tags=["Shipments"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/create-shipment")
def create_shipment(data: ShipmentCreate, db: Session = Depends(get_db)):
    cid = resolve_company_id(data.company_id, db)
    shipment = Shipment(
        company_id=cid, pickup_location=data.pickup_location,
        delivery_location=data.delivery_location, weight=data.weight, status="Pending"
    )
    db.add(shipment); db.commit(); db.refresh(shipment)
    return shipment


@router.get("/shipments/{company_id}")
def get_shipments(company_id: str, db: Session = Depends(get_db)):
    try:
        cid = int(company_id)
        data = db.query(Shipment).filter(Shipment.company_id == cid).all()
        return data
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "trace": traceback.format_exc()
        }


@router.patch("/shipment/{shipment_id}/status")
def update_shipment_status(shipment_id: int, data: StatusUpdate, db: Session = Depends(get_db)):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    shipment.status = data.status
    db.commit(); db.refresh(shipment)
    return {"id": shipment.id, "status": shipment.status}


@router.patch("/shipment/{shipment_id}/assign")
def assign_driver(shipment_id: int, data: AssignDriver, db: Session = Depends(get_db)):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    shipment.driver_id = data.driver_id
    db.commit(); db.refresh(shipment)
    return {"id": shipment.id, "driver_id": shipment.driver_id}


@router.post("/shipment/{shipment_id}/proof")
def upload_proof(shipment_id: int, data: ProofUpload, db: Session = Depends(get_db)):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    shipment.proof_photo = data.photo
    shipment.status = "Delivered"
    db.commit()
    return {"status": "ok", "message": "Proof uploaded and shipment marked as Delivered"}