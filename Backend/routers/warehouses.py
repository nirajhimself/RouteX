from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Warehouse, Inventory
from schemas import WarehouseCreate, InventoryCreate
from helpers import resolve_company_id

router = APIRouter(prefix="", tags=["Warehouses"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/create-warehouse")
def create_warehouse(data: WarehouseCreate, db: Session = Depends(get_db)):
    cid = resolve_company_id(data.company_id, db)
    warehouse = Warehouse(company_id=cid, name=data.name, location=data.location, capacity=data.capacity)
    db.add(warehouse); db.commit(); db.refresh(warehouse)
    return warehouse


@router.get("/warehouses/{company_id}")
def get_warehouses(company_id: str, db: Session = Depends(get_db)):
    cid = resolve_company_id(company_id, db)
    return db.query(Warehouse).filter(Warehouse.company_id == cid).all()


@router.post("/add-inventory")
def add_inventory(data: InventoryCreate, db: Session = Depends(get_db)):
    inventory = Inventory(warehouse_id=data.warehouse_id, product_name=data.product_name, quantity=data.quantity)
    db.add(inventory); db.commit(); db.refresh(inventory)
    return inventory


@router.get("/warehouse-inventory/{warehouse_id}")
def get_inventory(warehouse_id: int, db: Session = Depends(get_db)):
    return db.query(Inventory).filter(Inventory.warehouse_id == warehouse_id).all()