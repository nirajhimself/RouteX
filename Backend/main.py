from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Session
from datetime import datetime
import random
import string
import joblib
from route_optimizer import optimize_route_vrp
from ai_route_optimizer import optimize_vrp
from database import engine, SessionLocal
from models import Base, RouteHistory, Company, Shipment, Driver, Vehicle, Warehouse, Inventory

# =====================================================
# FASTAPI APP
# =====================================================

app = FastAPI(title="RouteX AI Logistics Platform")

live_locations = {}  # in-memory GPS store


# =====================================================
# CORS
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# NEW MODELS — defined BEFORE Base.metadata.create_all
# =====================================================

class Client(Base):
    __tablename__ = "clients"
    id           = Column(Integer, primary_key=True, index=True)
    company_id   = Column(Integer, ForeignKey("companies.id"))
    type         = Column(String)
    name         = Column(String)
    email        = Column(String, nullable=True)
    phone        = Column(String, nullable=True)
    address      = Column(String, nullable=True)
    city         = Column(String, nullable=True)
    pincode      = Column(String, nullable=True)
    gst_number   = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow)


class Booking(Base):
    __tablename__ = "bookings"
    id               = Column(Integer, primary_key=True, index=True)
    company_id       = Column(Integer, ForeignKey("companies.id"))
    tracking_number  = Column(String, unique=True, index=True)
    booking_type     = Column(String)
    sender_name      = Column(String, nullable=True)
    sender_address   = Column(String, nullable=True)
    sender_city      = Column(String, nullable=True)
    sender_pincode   = Column(String, nullable=True)
    client_id        = Column(Integer, ForeignKey("clients.id"), nullable=True)
    receiver_name    = Column(String)
    receiver_phone   = Column(String, nullable=True)
    receiver_address = Column(String)
    receiver_city    = Column(String)
    receiver_pincode = Column(String)
    product_name     = Column(String, nullable=True)
    description      = Column(String, nullable=True)
    weight_kg        = Column(Float)
    length_cm        = Column(Float, nullable=True)
    width_cm         = Column(Float, nullable=True)
    height_cm        = Column(Float, nullable=True)
    declared_value   = Column(Float, nullable=True)
    carrier          = Column(String)
    service_type     = Column(String)
    carrier_rate     = Column(Float)
    estimated_days   = Column(Integer)
    status           = Column(String, default="Booked")
    qr_data          = Column(String, nullable=True)
    created_at       = Column(DateTime, default=datetime.utcnow)


# =====================================================
# DATABASE INIT — AFTER all models are defined
# =====================================================

Base.metadata.create_all(bind=engine)


# =====================================================
# LOAD AI MODEL
# =====================================================

try:
    delay_model = joblib.load("delay_model.pkl")
    print("✅ Delay prediction model loaded")
except:
    delay_model = None
    print("⚠ Delay model not found")


# =====================================================
# DATABASE DEPENDENCY
# =====================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =====================================================
# HELPERS
# =====================================================

def resolve_company_id(company_id: str, db: Session) -> int:
    try:
        return int(company_id)
    except ValueError:
        company = db.query(Company).filter(Company.name == company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        return company.id


def generate_tracking_number(carrier: str) -> str:
    prefixes = {"Delhivery": "DLV", "DTDC": "DTC", "DHL": "DHL"}
    prefix = prefixes.get(carrier, "TRK")
    suffix = ''.join(random.choices(string.digits, k=10))
    return f"{prefix}{suffix}"


def calculate_carrier_rates(weight_kg: float, dest_city: str, origin_city: str = "Mumbai") -> list:
    w = max(weight_kg, 0.5)
    metro_cities = ["mumbai", "delhi", "bangalore", "chennai", "hyderabad", "kolkata", "pune", "ahmedabad"]
    is_metro = any(city in dest_city.lower() for city in metro_cities)
    zone_factor = 1.0 if is_metro else 1.4
    rates = [
        {
            "carrier": "Delhivery", "logo": "🟦", "service_type": "Express",
            "rate": round((35 + w * 18) * zone_factor),
            "estimated_days": 2 if is_metro else 3,
            "features": ["Door pickup", "Live tracking", "COD available"],
            "color": "#60a5fa",
        },
        {
            "carrier": "Delhivery", "logo": "🟦", "service_type": "Standard",
            "rate": round((25 + w * 12) * zone_factor),
            "estimated_days": 4 if is_metro else 6,
            "features": ["Door pickup", "Basic tracking"],
            "color": "#60a5fa",
        },
        {
            "carrier": "DTDC", "logo": "🟧", "service_type": "Express",
            "rate": round((30 + w * 16) * zone_factor),
            "estimated_days": 2 if is_metro else 4,
            "features": ["Wide network", "COD available", "SMS alerts"],
            "color": "#f97316",
        },
        {
            "carrier": "DTDC", "logo": "🟧", "service_type": "Economy",
            "rate": round((20 + w * 10) * zone_factor),
            "estimated_days": 5 if is_metro else 8,
            "features": ["Budget option", "Basic tracking"],
            "color": "#f97316",
        },
        {
            "carrier": "DHL", "logo": "🟨", "service_type": "Express",
            "rate": round((80 + w * 45) * zone_factor),
            "estimated_days": 1 if is_metro else 2,
            "features": ["Priority delivery", "International capable", "Full insurance"],
            "color": "#fbbf24",
        },
        {
            "carrier": "DHL", "logo": "🟨", "service_type": "Standard",
            "rate": round((55 + w * 28) * zone_factor),
            "estimated_days": 3 if is_metro else 5,
            "features": ["Reliable", "Full tracking", "Signature on delivery"],
            "color": "#fbbf24",
        },
    ]
    return sorted(rates, key=lambda x: x["rate"])


# =====================================================
# SCHEMAS
# =====================================================

class CompanyCreate(BaseModel):
    name: str

class ShipmentCreate(BaseModel):
    company_id: str
    pickup_location: str
    delivery_location: str
    weight: float
class BookingStatusUpdate(BaseModel):
    status: str

class DriverCreate(BaseModel):
    company_id: str
    name: str
    phone: str

class VehicleCreate(BaseModel):
    company_id: str
    vehicle_number: str
    vehicle_type: str
    capacity: float

class WarehouseCreate(BaseModel):
    company_id: str
    name: str
    location: str
    capacity: float

class InventoryCreate(BaseModel):
    warehouse_id: int
    product_name: str
    quantity: int

class OptimizeRequest(BaseModel):
    company_id: str
    origin: str = ""
    destination: str = ""
    vehicle_type: str = "Heavy Truck"
    priority: str = "time"

class MultiStopRequest(BaseModel):
    company_id: str
    stops: list
    vehicle_type: str = "Heavy Truck"
    priority: str = "time"

class LocationUpdate(BaseModel):
    vehicle_id: str
    latitude: float
    longitude: float
    speed: float = 0

class StatusUpdate(BaseModel):
    status: str

class DelayPrediction(BaseModel):
    distance: float
    traffic: float
    vehicle_type: int

class DriverLogin(BaseModel):
    name: str
    phone: str

class ProofUpload(BaseModel):
    photo: str

class AssignDriver(BaseModel):
    driver_id: int

class ClientCreate(BaseModel):
    company_id:   str
    type:         str
    name:         str
    email:        str = None
    phone:        str = None
    address:      str = None
    city:         str = None
    pincode:      str = None
    gst_number:   str = None
    company_name: str = None

class BookingCreate(BaseModel):
    company_id:       str
    booking_type:     str
    sender_name:      str = None
    sender_address:   str = None
    sender_city:      str = None
    sender_pincode:   str = None
    client_id:        int = None
    receiver_name:    str
    receiver_phone:   str = None
    receiver_address: str
    receiver_city:    str
    receiver_pincode: str
    product_name:     str = None
    description:      str = None
    weight_kg:        float
    length_cm:        float = None
    width_cm:         float = None
    height_cm:        float = None
    declared_value:   float = None
    carrier:          str
    service_type:     str
    carrier_rate:     float
    estimated_days:   int
    
    
# =====================================================
# HEALTH CHECK
# =====================================================

@app.get("/")
def root():
    return {"message": "RouteX AI Logistics Platform Running 🚀"}

@app.get("/health")
def health_check():
    return {"status": "ok", "api": "running", "database": "connected", "service": "RouteX Backend"}


# =====================================================
# COMPANY
# =====================================================

@app.post("/create-company")
def create_company(company: CompanyCreate, db: Session = Depends(get_db)):
    existing = db.query(Company).filter(Company.name == company.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company already exists")
    new_company = Company(name=company.name)
    db.add(new_company); db.commit(); db.refresh(new_company)
    return new_company


# =====================================================
# DRIVERS
# =====================================================

@app.post("/create-driver")
def create_driver(data: DriverCreate, db: Session = Depends(get_db)):
    cid = resolve_company_id(data.company_id, db)
    driver = Driver(company_id=cid, name=data.name, phone=data.phone, is_available=True)
    db.add(driver); db.commit(); db.refresh(driver)
    return driver

@app.get("/drivers/{company_id}")
def get_drivers(company_id: str, db: Session = Depends(get_db)):
    cid = resolve_company_id(company_id, db)
    return db.query(Driver).filter(Driver.company_id == cid).all()


# =====================================================
# VEHICLES
# =====================================================

@app.post("/create-vehicle")
def create_vehicle(data: VehicleCreate, db: Session = Depends(get_db)):
    cid = resolve_company_id(data.company_id, db)
    vehicle = Vehicle(
        company_id=cid, vehicle_number=data.vehicle_number,
        vehicle_type=data.vehicle_type, capacity=data.capacity, is_available=True
    )
    db.add(vehicle); db.commit(); db.refresh(vehicle)
    return vehicle

@app.get("/vehicles/{company_id}")
def get_vehicles(company_id: str, db: Session = Depends(get_db)):
    cid = resolve_company_id(company_id, db)
    return db.query(Vehicle).filter(Vehicle.company_id == cid).all()


# =====================================================
# SHIPMENTS
# =====================================================

@app.post("/create-shipment")
def create_shipment(data: ShipmentCreate, db: Session = Depends(get_db)):
    cid = resolve_company_id(data.company_id, db)
    shipment = Shipment(
        company_id=cid, pickup_location=data.pickup_location,
        delivery_location=data.delivery_location, weight=data.weight, status="Pending"
    )
    db.add(shipment); db.commit(); db.refresh(shipment)
    return shipment

@app.get("/shipments/{company_id}")
def get_shipments(company_id: str, db: Session = Depends(get_db)):
    cid = resolve_company_id(company_id, db)
    return db.query(Shipment).filter(Shipment.company_id == cid).all()

@app.patch("/shipment/{shipment_id}/status")
def update_shipment_status(shipment_id: int, data: StatusUpdate, db: Session = Depends(get_db)):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    shipment.status = data.status
    db.commit(); db.refresh(shipment)
    return {"id": shipment.id, "status": shipment.status}

@app.patch("/shipment/{shipment_id}/assign")
def assign_driver(shipment_id: int, data: AssignDriver, db: Session = Depends(get_db)):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    shipment.driver_id = data.driver_id
    db.commit(); db.refresh(shipment)
    return {"id": shipment.id, "driver_id": shipment.driver_id}

@app.post("/shipment/{shipment_id}/proof")
def upload_proof(shipment_id: int, data: ProofUpload, db: Session = Depends(get_db)):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    shipment.proof_photo = data.photo
    shipment.status = "Delivered"
    db.commit()
    return {"status": "ok", "message": "Proof uploaded and shipment marked as Delivered"}


# =====================================================
# WAREHOUSES & INVENTORY
# =====================================================

@app.post("/create-warehouse")
def create_warehouse(data: WarehouseCreate, db: Session = Depends(get_db)):
    cid = resolve_company_id(data.company_id, db)
    warehouse = Warehouse(company_id=cid, name=data.name, location=data.location, capacity=data.capacity)
    db.add(warehouse); db.commit(); db.refresh(warehouse)
    return warehouse

@app.get("/warehouses/{company_id}")
def get_warehouses(company_id: str, db: Session = Depends(get_db)):
    cid = resolve_company_id(company_id, db)
    return db.query(Warehouse).filter(Warehouse.company_id == cid).all()

@app.post("/add-inventory")
def add_inventory(data: InventoryCreate, db: Session = Depends(get_db)):
    inventory = Inventory(warehouse_id=data.warehouse_id, product_name=data.product_name, quantity=data.quantity)
    db.add(inventory); db.commit(); db.refresh(inventory)
    return inventory

@app.get("/warehouse-inventory/{warehouse_id}")
def get_inventory(warehouse_id: int, db: Session = Depends(get_db)):
    return db.query(Inventory).filter(Inventory.warehouse_id == warehouse_id).all()


# =====================================================
# LIVE TRACKING
# =====================================================

@app.post("/update-location")
def update_location(data: LocationUpdate, db: Session = Depends(get_db)):
    live_locations[data.vehicle_id] = {
        "vehicle_id": data.vehicle_id, "lat": data.latitude,
        "lng": data.longitude, "speed": data.speed,
        "updated_at": str(datetime.utcnow()),
    }
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_number == data.vehicle_id).first()
    if vehicle:
        vehicle.is_available = False; db.commit()
    return {"status": "ok", "vehicle_id": data.vehicle_id}

@app.get("/live-vehicles/{company_id}")
def get_live_vehicles(company_id: str, db: Session = Depends(get_db)):
    cid = resolve_company_id(company_id, db)
    vehicles = db.query(Vehicle).filter(Vehicle.company_id == cid).all()
    result = []
    for v in vehicles:
        loc = live_locations.get(v.vehicle_number, {})
        result.append({
            "id": v.vehicle_number, "vehicle_number": v.vehicle_number,
            "vehicle_type": v.vehicle_type,
            "status": "Moving" if loc.get("speed", 0) > 0 else ("Active" if loc else "Parked"),
            "lat": loc.get("lat"), "lng": loc.get("lng"),
            "speed": loc.get("speed", 0), "updated_at": loc.get("updated_at"),
            "has_location": bool(loc),
        })
    return result


# =====================================================
# ROUTE OPTIMIZATION
# =====================================================

@app.post("/optimize-route")
def optimize_route(request: OptimizeRequest, db: Session = Depends(get_db)):
    cid = resolve_company_id(request.company_id, db)
    shipments = db.query(Shipment).filter(Shipment.company_id == cid, Shipment.status == "Pending").all()
    driver = db.query(Driver).filter(Driver.company_id == cid, Driver.is_available == True).first()
    vehicle = db.query(Vehicle).filter(Vehicle.company_id == cid, Vehicle.is_available == True).first()

    locations = [[28.7041, 77.1025]]; demands = [0]
    for s in (shipments or [None]):
        locations.append([28.5 + random.uniform(-0.05, 0.05), 77.2 + random.uniform(-0.05, 0.05)])
        demands.append(int(s.weight) if s else 1)

    vehicle_capacity = int(vehicle.capacity) if vehicle else 100
    result = optimize_vrp(locations, demands, vehicle_capacity, 1)
    result["origin"] = request.origin
    result["destination"] = request.destination
    result["driver"] = driver.name if driver else "No driver assigned"
    result["vehicle"] = vehicle.vehicle_number if vehicle else "No vehicle assigned"
    result["waypoints"] = [request.origin, request.destination]
    return result

@app.post("/optimize-multi-stop")
async def optimize_multi_stop(request: MultiStopRequest, db: Session = Depends(get_db)):
    cid = resolve_company_id(request.company_id, db)
    if len(request.stops) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 stops")
    driver = db.query(Driver).filter(Driver.company_id == cid, Driver.is_available == True).first()
    vehicle = db.query(Vehicle).filter(Vehicle.company_id == cid, Vehicle.is_available == True).first()
    try:
        result = await optimize_route_vrp(
            locations=request.stops, vehicle_type=request.vehicle_type, priority=request.priority,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")
    result["driver"] = driver.name if driver else "No driver assigned"
    result["vehicle"] = vehicle.vehicle_number if vehicle else "No vehicle assigned"
    result["company_id"] = cid
    return result


# =====================================================
# AI DELAY PREDICTION
# =====================================================

@app.post("/predict-delay")
def predict_delay(data: DelayPrediction):
    if delay_model is None:
        raise HTTPException(status_code=500, detail="Delay model not loaded")
    prediction = delay_model.predict([[data.distance, data.traffic, data.vehicle_type]])
    return {"delay_prediction": int(prediction[0])}


# =====================================================
# DRIVER ENDPOINTS
# =====================================================

@app.post("/driver/login")
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

@app.get("/driver/{driver_id}/shipments")
def get_driver_shipments(driver_id: int, db: Session = Depends(get_db)):
    from sqlalchemy import text
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


# =====================================================
# CLIENTS (B2B / B2C)
# =====================================================

@app.post("/clients/create")
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

@app.get("/clients/{company_id}")
def get_clients(company_id: str, db: Session = Depends(get_db)):
    cid = resolve_company_id(company_id, db)
    return db.query(Client).filter(Client.company_id == cid).order_by(Client.created_at.desc()).all()


# =====================================================
# CARRIER RATES
# =====================================================

@app.get("/carrier-rates")
def get_carrier_rates(weight: float, destination: str, origin: str = "Mumbai"):
    rates = calculate_carrier_rates(weight, destination, origin)
    return {"rates": rates, "weight_kg": weight, "destination": destination}


# =====================================================
# BOOKINGS
# =====================================================

@app.post("/bookings/create")
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
        "id": booking.id,
        "tracking_number": booking.tracking_number,
        "qr_data": booking.qr_data,
        "carrier": booking.carrier,
        "service_type": booking.service_type,
        "carrier_rate": booking.carrier_rate,
        "estimated_days": booking.estimated_days,
        "status": booking.status,
        "created_at": str(booking.created_at),
    }

@app.get("/bookings/{company_id}")
def get_bookings(company_id: str, db: Session = Depends(get_db)):
    cid = resolve_company_id(company_id, db)
    return db.query(Booking).filter(Booking.company_id == cid).order_by(Booking.created_at.desc()).all()

@app.get("/booking/track/{tracking_number}")
def track_booking(tracking_number: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.tracking_number == tracking_number).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Tracking number not found")
    return {
        "tracking_number": booking.tracking_number,
        "status": booking.status,
        "carrier": booking.carrier,
        "service_type": booking.service_type,
        "estimated_days": booking.estimated_days,
        "receiver_name": booking.receiver_name,
        "receiver_city": booking.receiver_city,
"product_name": booking.product_name,
        "created_at": str(booking.created_at),
    }

@app.patch("/booking/{booking_id}/status")
def update_booking_status(booking_id: int, data: BookingStatusUpdate, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = data.status
    db.commit()
    db.refresh(booking)
    return {"id": booking.id, "tracking_number": booking.tracking_number, "new_status": booking.status}