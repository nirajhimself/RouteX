from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models import Base

# ── Create all DB tables ──────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="RouteX AI Logistics Platform")

# ── CORS — allow all 3 frontend apps ─────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Admin Panel
        "http://localhost:3001",   # Driver App
        "http://localhost:3002",   # Customer App
        "http://localhost:5173",   # Vite default
        "http://localhost:5174",   # Vite fallback
        "http://localhost:4173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
from routers.drivers       import router as drivers_router
from routers.vehicles      import router as vehicles_router
from routers.shipments     import router as shipments_router
from routers.warehouses    import router as warehouses_router
from routers.tracking      import router as tracking_router
from routers.bookings      import router as bookings_router
from routers.invoices      import router as invoices_router
from routers.routes_opt    import router as routes_router
from routers.negotiation   import router as negotiation_router
from routers.dashboard     import router as dashboard_router
from routers.analytics     import router as analytics_router
from routers.heatmap       import router as heatmap_router
from routers.notifications import router as notifications_router

app.include_router(drivers_router)
app.include_router(vehicles_router)
app.include_router(shipments_router)
app.include_router(warehouses_router)
app.include_router(tracking_router)
app.include_router(bookings_router)
app.include_router(invoices_router)
app.include_router(routes_router)
app.include_router(negotiation_router)
app.include_router(dashboard_router)
app.include_router(analytics_router)
app.include_router(heatmap_router)
app.include_router(notifications_router)


# ── Company (kept here — simple, no separate file needed) ────────────────────
from fastapi import Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Company
from schemas import CompanyCreate
from fastapi import HTTPException

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/create-company")
def create_company(company: CompanyCreate, db: Session = Depends(get_db)):
    existing = db.query(Company).filter(Company.name == company.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company already exists")
    new_company = Company(name=company.name)
    db.add(new_company); db.commit(); db.refresh(new_company)
    return new_company


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "RouteX AI Logistics Platform Running 🚀"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "RouteX Backend", "apps": ["admin:3000", "driver:3001", "customer:3002"]}