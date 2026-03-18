import random
import string
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models import Company


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