from pydantic import BaseModel
from typing import List, Optional


# ── Company ──────────────────────────────────────────────────────────────────
class CompanyCreate(BaseModel):
    name: str


# ── Auth ─────────────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    company_name: str
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str


# ── Driver ───────────────────────────────────────────────────────────────────
class DriverCreate(BaseModel):
    company_id: str
    name: str
    phone: str
    license_number: Optional[str] = None
    vehicle_id: Optional[str] = None

class DriverLogin(BaseModel):
    name: str
    phone: str


# ── Vehicle ──────────────────────────────────────────────────────────────────
class VehicleCreate(BaseModel):
    company_id: str
    vehicle_number: str
    vehicle_type: str
    capacity: float
    fuel_type: Optional[str] = "Diesel"


# ── Shipment ─────────────────────────────────────────────────────────────────
class ShipmentCreate(BaseModel):
    company_id: str
    pickup_location: str
    delivery_location: str
    weight: float

class StatusUpdate(BaseModel):
    status: str

class AssignDriver(BaseModel):
    driver_id: int

class ProofUpload(BaseModel):
    photo: str


# ── Warehouse & Inventory ────────────────────────────────────────────────────
class WarehouseCreate(BaseModel):
    company_id: str
    name: str
    location: str
    capacity: float
    address: Optional[str] = None 

class InventoryCreate(BaseModel):
    warehouse_id: int
    product_name: str
    quantity: int


# ── Tracking ─────────────────────────────────────────────────────────────────
class LocationUpdate(BaseModel):
    vehicle_id: str
    latitude: float
    longitude: float
    speed: float = 0


# ── Route Optimization ───────────────────────────────────────────────────────
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


# ── AI Delay ─────────────────────────────────────────────────────────────────
class DelayPrediction(BaseModel):
    distance: float
    traffic: float
    vehicle_type: int


# ── Client ───────────────────────────────────────────────────────────────────
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


# ── Booking ──────────────────────────────────────────────────────────────────
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

class BookingStatusUpdate(BaseModel):
    status: str


# ── Negotiation ──────────────────────────────────────────────────────────────
class NegotiateRequest(BaseModel):
    carrier_id:      str
    weight_kg:       float
    sender_city:     str   = "Mumbai"
    receiver_city:   str   = "Delhi"
    declared_value:  float = 0
    tracking_number: str   = "N/A"
    booking_type:    str   = "B2C"
    is_recurring:    bool  = False
    target_rate:     float = 0
    priority:        str   = "balanced"


# ── Invoice ──────────────────────────────────────────────────────────────────
class InvoiceItemSchema(BaseModel):
    description: str
    quantity:    float
    unit_price:  float

class InvoiceCreate(BaseModel):
    invoice_number: str
    client_name:    str
    client_email:   Optional[str] = ""
    client_address: Optional[str] = ""
    issue_date:     str
    due_date:       str
    items:          List[InvoiceItemSchema]
    tax_rate:       Optional[float] = 0.0
    notes:          Optional[str]   = ""
    status:         Optional[str]   = "draft"

class InvoiceStatusUpdate(BaseModel):
    status: str