from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

# ── Existing models ──────────────────────────────────────────────────────────

class Company(Base):
    __tablename__ = "companies"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Driver(Base):
    __tablename__ = "drivers"
    id           = Column(Integer, primary_key=True, index=True)
    company_id   = Column(Integer, ForeignKey("companies.id"))
    name         = Column(String)
    phone        = Column(String)
    is_available = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)


class Vehicle(Base):
    __tablename__ = "vehicles"
    id             = Column(Integer, primary_key=True, index=True)
    company_id     = Column(Integer, ForeignKey("companies.id"))
    vehicle_number = Column(String)
    vehicle_type   = Column(String)
    capacity       = Column(Float)
    is_available   = Column(Boolean, default=True)
    created_at     = Column(DateTime, default=datetime.utcnow)


class Shipment(Base):
    __tablename__ = "shipments"
    id                = Column(Integer, primary_key=True, index=True)
    company_id        = Column(Integer, ForeignKey("companies.id"))
    pickup_location   = Column(String)
    delivery_location = Column(String)
    weight            = Column(Float)
    status            = Column(String, default="Pending")
    driver_id         = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    proof_photo       = Column(Text, nullable=True)
    created_at        = Column(DateTime, default=datetime.utcnow)


class Warehouse(Base):
    __tablename__ = "warehouses"
    id         = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    name       = Column(String)
    location   = Column(String)
    capacity   = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


class Inventory(Base):
    __tablename__ = "inventory"
    id           = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    product_name = Column(String)
    quantity     = Column(Integer)
    created_at   = Column(DateTime, default=datetime.utcnow)


class RouteHistory(Base):
    __tablename__ = "route_history"
    id         = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    origin     = Column(String)
    destination = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── New models ───────────────────────────────────────────────────────────────

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


class Invoice(Base):
    __tablename__ = "invoices"
    id             = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    invoice_number = Column(String, unique=True, index=True)
    client_name    = Column(String)
    client_email   = Column(String, nullable=True)
    client_address = Column(String, nullable=True)
    issue_date     = Column(String)
    due_date       = Column(String)
    items          = Column(Text, default="[]")
    tax_rate       = Column(Float, default=0.0)
    subtotal       = Column(Float, default=0.0)
    tax            = Column(Float, default=0.0)
    total          = Column(Float, default=0.0)
    notes          = Column(Text, nullable=True)
    status         = Column(String, default="draft")
    created_at     = Column(DateTime, default=datetime.utcnow)
    updated_at     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    company_id      = Column(Integer, ForeignKey("companies.id"))
    email           = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role            = Column(String, default="admin")  # admin | manager | driver | customer
    created_at      = Column(DateTime, default=datetime.utcnow)