from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from .config import settings
import logging

logger = logging.getLogger(__name__)

# Production-ready database configuration
engine_config = {
    "pool_size": 20,
    "max_overflow": 30,
    "pool_pre_ping": True,
    "pool_recycle": 3600,  # 1 hour
    "connect_args": {
        "connect_timeout": 10,
        "application_name": "readnwin_api"
    }
}

# Add SSL configuration for production
if settings.is_production:
    engine_config["connect_args"]["sslmode"] = "require"

engine = create_engine(
    settings.database_url,
    poolclass=QueuePool,
    **engine_config
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {str(e)[:100]}")
        db.rollback()
        raise
    finally:
        db.close()

def test_database_connection():
    """Test database connectivity"""
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✅ Database connection successful")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {str(e)[:100]}")
        return False