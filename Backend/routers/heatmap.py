from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Booking, Shipment
from helpers import resolve_company_id
from collections import defaultdict
import random

router = APIRouter(prefix="", tags=["Heatmap"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Real Indian city coordinates
CITY_COORDS = {
    "mumbai":    (19.0760,  72.8777),
    "delhi":     (28.7041,  77.1025),
    "bangalore": (12.9716,  77.5946),
    "bengaluru": (12.9716,  77.5946),
    "chennai":   (13.0827,  80.2707),
    "hyderabad": (17.3850,  78.4867),
    "kolkata":   (22.5726,  88.3639),
    "pune":      (18.5204,  73.8567),
    "ahmedabad": (23.0225,  72.5714),
    "jaipur":    (26.9124,  75.7873),
    "lucknow":   (26.8467,  80.9462),
    "surat":     (21.1702,  72.8311),
    "nagpur":    (21.1458,  79.0882),
    "indore":    (22.7196,  75.8577),
    "bhopal":    (23.2599,  77.4126),
    "chandigarh":(30.7333,  76.7794),
    "patna":     (25.5941,  85.1376),
    "kochi":     (9.9312,   76.2673),
    "coimbatore":(11.0168,  76.9558),
    "vizag":     (17.6868,  83.2185),
}

def _city_to_coords(city_name: str):
    """Return (lat, lng) for a city, with slight jitter for heatmap density."""
    key = city_name.lower().strip()
    for city_key, coords in CITY_COORDS.items():
        if city_key in key or key in city_key:
            lat = coords[0] + random.uniform(-0.08, 0.08)
            lng = coords[1] + random.uniform(-0.08, 0.08)
            return round(lat, 4), round(lng, 4)
    return None


@router.get("/heatmap/data/{company_id}")
def heatmap_data(company_id: str, db: Session = Depends(get_db)):
    """
    Returns heatmap points from real booking delivery cities.
    Each point: { lat, lng, weight }
    weight = number of deliveries to that area (drives intensity on map).
    """
    cid      = resolve_company_id(company_id, db)
    bookings = db.query(Booking).filter(Booking.company_id == cid).all()

    # Count deliveries per city
    city_counts = defaultdict(int)
    for b in bookings:
        if b.receiver_city:
            city_counts[b.receiver_city.strip().lower()] += 1

    # Also count pickup cities
    for b in bookings:
        if b.sender_city:
            city_counts[b.sender_city.strip().lower()] += 0.5  # lower weight for pickups

    points = []
    for city, count in city_counts.items():
        # Generate multiple scatter points per city based on count
        for _ in range(max(1, int(count))):
            coords = _city_to_coords(city)
            if coords:
                points.append({
                    "lat":    coords[0],
                    "lng":    coords[1],
                    "weight": round(count, 1),
                    "city":   city.title(),
                })

    # If no real data yet, return sample Indian logistics heatmap
    if not points:
        sample_cities = [
            ("Mumbai",    19.0760, 72.8777, 45),
            ("Delhi",     28.7041, 77.1025, 38),
            ("Bangalore", 12.9716, 77.5946, 32),
            ("Hyderabad", 17.3850, 78.4867, 28),
            ("Chennai",   13.0827, 80.2707, 22),
            ("Kolkata",   22.5726, 88.3639, 18),
            ("Pune",      18.5204, 73.8567, 25),
            ("Ahmedabad", 23.0225, 72.5714, 20),
            ("Jaipur",    26.9124, 75.7873, 15),
            ("Lucknow",   26.8467, 80.9462, 12),
        ]
        for name, lat, lng, weight in sample_cities:
            for _ in range(weight // 3):
                points.append({
                    "lat":    round(lat + random.uniform(-0.12, 0.12), 4),
                    "lng":    round(lng + random.uniform(-0.12, 0.12), 4),
                    "weight": weight,
                    "city":   name,
                })

    # City-level summary
    city_summary = []
    seen = set()
    for p in points:
        if p["city"] not in seen:
            seen.add(p["city"])
            city_summary.append({"city": p["city"], "weight": p["weight"]})
    city_summary = sorted(city_summary, key=lambda x: x["weight"], reverse=True)

    return {
        "points":       points,
        "total_points": len(points),
        "city_summary": city_summary,
        "has_real_data": bool(bookings),
    }


@router.get("/heatmap/routes/{company_id}")
def heatmap_routes(company_id: str, db: Session = Depends(get_db)):
    """Origin → Destination flow data for route heatmap."""
    cid      = resolve_company_id(company_id, db)
    bookings = db.query(Booking).filter(Booking.company_id == cid).all()

    route_counts = defaultdict(int)
    for b in bookings:
        if b.sender_city and b.receiver_city:
            key = f"{b.sender_city.strip().title()}→{b.receiver_city.strip().title()}"
            route_counts[key] += 1

    routes = []
    for route, count in sorted(route_counts.items(), key=lambda x: x[1], reverse=True)[:20]:
        origin, dest = route.split("→")
        o_coords = _city_to_coords(origin)
        d_coords = _city_to_coords(dest)
        if o_coords and d_coords:
            routes.append({
                "route":        route,
                "count":        count,
                "origin":       origin,
                "destination":  dest,
                "origin_lat":   o_coords[0],
                "origin_lng":   o_coords[1],
                "dest_lat":     d_coords[0],
                "dest_lng":     d_coords[1],
            })

    return {"routes": routes, "total_routes": len(routes)}