import os
import sys
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# ── Get DATABASE_URL from environment ───────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL is not set in environment variables")

# ── Fix: postgres:// / postgresql:// → postgresql+psycopg2:// ────────
# SQLAlchemy 2.1+ defaults bare postgresql:// to psycopg (v3), which isn't installed
for prefix in ("postgres://", "postgresql://"):
    if DATABASE_URL.startswith(prefix):
        DATABASE_URL = DATABASE_URL.replace(prefix, "postgresql+psycopg2://", 1)
        break

# ── Create Engine ───────────────────────────────────────────────────
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={
        "prepare_threshold": None   # ✅ required for pgBouncer
    }
)

# ── Session ─────────────────────────────────────────────────────────
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ── Base ────────────────────────────────────────────────────────────
Base = declarative_base()