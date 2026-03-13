from sqlalchemy import Column, Integer, Float, DateTime, JSON, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime


# -----------------------------
# Company
# -----------------------------
class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    routes = relationship("RouteHistory", back_populates="company")


# -----------------------------
# Shipment
# -----------------------------
class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    route_id = Column(Integer, ForeignKey("route_history.id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)  # ✅ ADD THIS
    
    pickup_location = Column(String)
    delivery_location = Column(String)
    weight = Column(Float)
    status = Column(String, default="Pending")
    proof_photo = Column(String, nullable=True)   # ✅ ADD THIS (base64 image)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# -----------------------------
# Driver
# -----------------------------
class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    name = Column(String, nullable=False)
    phone = Column(String)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# -----------------------------
# Vehicle
# -----------------------------
class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    vehicle_number = Column(String, unique=True)
    vehicle_type = Column(String)
    capacity = Column(Float)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# -----------------------------
# Route History
# -----------------------------
class RouteHistory(Base):
    __tablename__ = "route_history"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(Integer, ForeignKey("companies.id"))
    driver_id = Column(Integer, ForeignKey("drivers.id"))
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))

    total_distance = Column(Float)
    num_vehicles = Column(Integer)
    routes_data = Column(JSON)
    fuel_cost = Column(Float)

    status = Column(String, default="Dispatched")

    # GPS Simulation Fields
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    company = relationship("Company", back_populates="routes")
    
class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    name = Column(String)
    location = Column(String)
    capacity = Column(Float)


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    product_name = Column(String)
    quantity = Column(Integer)