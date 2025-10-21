from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError
from core.error_handlers import (
    http_exception_handler,
    validation_exception_handler,
    sqlalchemy_exception_handler,
    general_exception_handler
)
from logging_config import setup_logging
# Database tables will be created when first accessed

app = FastAPI(
    title="ReadnWin API",
    version="1.0.0",
    description="E-book platform API with reading, purchasing, and management features",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json"
)

@app.on_event("startup")
async def startup_event():
    try:
        # Setup custom logging to reduce 401 noise
        setup_logging()
        
        from core.database import engine, Base, get_db, test_database_connection
        
        # Test database connection first
        if not test_database_connection():
            print("❌ Database connection failed - API starting in limited mode")
            return
        
        # Import all models to ensure they're registered
        from models import user, role, book, order, cart, contact, contact_settings, blog, faq, portfolio, review, notification, reading_session, user_library, auth_log, payment, payment_settings, shipping, enhanced_shopping, email, email_templates, author, about_content, email_gateway, reader_settings, achievement, system_settings, token_blacklist, security_log
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        
        # Initialize default achievements
        try:
            from services.achievement_service import initialize_default_achievements
            db = next(get_db())
            try:
                initialize_default_achievements(db)
            finally:
                db.close()
        except Exception as e:
            print(f"⚠️  Achievement initialization skipped: {e}")
        
        # Start background scheduler for token cleanup (optional)
        try:
            from services.scheduler import start_scheduler
            start_scheduler()
            print("✅ Background scheduler started")
        except Exception as e:
            print(f"⚠️  Scheduler not available: {e}")
        
        # Initialize Redis connection (optional)
        try:
            from services.redis_service import get_redis_client
            redis_client = get_redis_client()
            if redis_client:
                print("✅ Redis connected successfully")
            else:
                print("⚠️  Redis connection failed - using fallback")
        except Exception as e:
            print(f"⚠️  Redis not available: {e}")
        
    except Exception as e:
        print(f"❌ Startup error: {str(e)[:100]}")
        print("🔄 API will run in limited mode")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        from services.scheduler import stop_scheduler
        stop_scheduler()
        print("✅ Background scheduler stopped")
    except Exception:
        pass

# CORS configuration
allowed_origins = [
    "http://localhost:3000",  # Development
    "http://127.0.0.1:3000",  # Development
    "https://readnwin.com",  # Production
    "https://www.readnwin.com",  # Production with www
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With", "X-CSRF-Token"],
)

# Serve uploaded files
import os
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
else:
    os.makedirs("uploads", exist_ok=True)
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register exception handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(ValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

from routers import (
    auth, auth_log, books, cart, checkout, checkout_fixed, checkout_unified, test_checkout, payment_verification, orders, orders_enhanced, admin, blog, contact,
    faq, user, about, portfolio, reviews, rbac, users, dashboard, reading_goals,
    reading, reading_enhanced, admin_enhanced, admin_email,
    analytics, payment, shopping_enhanced, testing, ereader, ereader_enhanced, upload,
    reader_settings, payment_settings, shipping, admin_shipping, admin_payment_settings, admin_reviews, admin_reports, admin_notifications, admin_email_templates, admin_authors_categories, test_simple, admin_books, receipts, user_library, checkout_enhanced, flutterwave, file_upload, bank_transfer, payment_completion, user_activation, email, admin_works, admin_blog, admin_email_test, admin_email_categories, admin_email_functions, admin_email_gateways, admin_stats, admin_stats_fast, images, admin_system_settings, admin_payment_proofs, csrf
)

# Import optional routers
try:
    from routers import admin_maintenance
except ImportError:
    admin_maintenance = None

try:
    from routers import admin_redis
except ImportError:
    admin_redis = None

# Import new comprehensive analytics router
try:
    from routers import analytics_comprehensive
except ImportError:
    analytics_comprehensive = None

# API Version prefix
API_V1_PREFIX = "/api/v1"

# Authentication and Authorization
app.include_router(auth.router, prefix=f"{API_V1_PREFIX}/auth", tags=["auth"])
app.include_router(auth_log.router, prefix=f"{API_V1_PREFIX}/auth", tags=["auth"])
app.include_router(rbac.router, prefix=f"{API_V1_PREFIX}/rbac", tags=["rbac"])
app.include_router(csrf.router, prefix=f"{API_V1_PREFIX}/auth", tags=["auth"])

# Enhanced Features
app.include_router(dashboard.router, prefix=f"{API_V1_PREFIX}/dashboard", tags=["dashboard"])
app.include_router(reading_goals.router, prefix=f"{API_V1_PREFIX}/reading-goals", tags=["reading-goals"])
app.include_router(reading_enhanced.router, prefix=API_V1_PREFIX, tags=["reading"])
app.include_router(admin_enhanced.router, prefix=f"{API_V1_PREFIX}/admin", tags=["admin"])
app.include_router(admin_email.router, prefix=f"{API_V1_PREFIX}/admin/email", tags=["admin"])
app.include_router(orders_enhanced.router, prefix=f"{API_V1_PREFIX}/orders", tags=["orders"])
app.include_router(shopping_enhanced.router, prefix=f"{API_V1_PREFIX}/shopping", tags=["shopping"])
app.include_router(analytics.router, prefix=API_V1_PREFIX, tags=["analytics"])
if analytics_comprehensive:
    app.include_router(analytics_comprehensive.router, prefix=API_V1_PREFIX, tags=["analytics"])
app.include_router(user.router, prefix=f"{API_V1_PREFIX}/user", tags=["user"])
app.include_router(user_library.router, prefix=API_V1_PREFIX, tags=["user-library"])

# Image Optimization
app.include_router(images.router, prefix=API_V1_PREFIX, tags=["images"])

# Core Features
app.include_router(books.router, prefix=f"{API_V1_PREFIX}/books", tags=["books"])
app.include_router(ereader.router, prefix=API_V1_PREFIX, tags=["ereader"])
app.include_router(ereader_enhanced.router, prefix=API_V1_PREFIX, tags=["ereader-enhanced"])
app.include_router(reader_settings.router, prefix=API_V1_PREFIX, tags=["reader"])
app.include_router(cart.router, prefix=f"{API_V1_PREFIX}/cart", tags=["cart"])
app.include_router(checkout.router, prefix=f"{API_V1_PREFIX}/checkout-legacy", tags=["checkout"])
app.include_router(checkout_enhanced.router, prefix=f"{API_V1_PREFIX}/checkout-enhanced", tags=["checkout"])
app.include_router(checkout_fixed.router, prefix=f"{API_V1_PREFIX}/checkout-fixed", tags=["checkout"])
app.include_router(checkout_unified.router, prefix=API_V1_PREFIX, tags=["checkout"])
app.include_router(test_checkout.router, prefix=API_V1_PREFIX, tags=["test"])
app.include_router(payment_verification.router, prefix=f"{API_V1_PREFIX}/payment", tags=["payment"])
app.include_router(orders.router, prefix=f"{API_V1_PREFIX}/orders", tags=["orders"])
app.include_router(reading.router, prefix=API_V1_PREFIX, tags=["reading"])
app.include_router(payment.router, prefix=API_V1_PREFIX, tags=["payment"])
app.include_router(flutterwave.router, prefix=API_V1_PREFIX, tags=["payment"])
app.include_router(bank_transfer.router, prefix=API_V1_PREFIX, tags=["payment"])
app.include_router(payment_completion.router, prefix=API_V1_PREFIX, tags=["payment"])
app.include_router(upload.router, prefix=API_V1_PREFIX, tags=["upload"])
app.include_router(file_upload.router, prefix=API_V1_PREFIX, tags=["upload"])

# Admin Features
app.include_router(admin.router, prefix=f"{API_V1_PREFIX}/admin", tags=["admin"])
app.include_router(admin_payment_proofs.router, prefix=f"{API_V1_PREFIX}/admin", tags=["admin"])
app.include_router(admin_stats.router, prefix=API_V1_PREFIX, tags=["admin"])
app.include_router(admin_stats_fast.router, prefix=f"{API_V1_PREFIX}/admin/stats", tags=["admin"])
app.include_router(admin_books.router, prefix=API_V1_PREFIX, tags=["admin"])
app.include_router(admin_payment_settings.router, prefix=API_V1_PREFIX, tags=["admin"])
app.include_router(payment_settings.router, prefix=API_V1_PREFIX, tags=["payment"])  # Public endpoints
app.include_router(shipping.router, prefix=API_V1_PREFIX, tags=["shipping"])
app.include_router(admin_shipping.router, prefix=API_V1_PREFIX, tags=["admin"])
app.include_router(admin_reviews.router, prefix=API_V1_PREFIX, tags=["admin"])
app.include_router(admin_reports.router, prefix=API_V1_PREFIX, tags=["admin"])
app.include_router(admin_notifications.router, prefix=API_V1_PREFIX, tags=["admin"])
app.include_router(admin_email_templates.router, prefix=API_V1_PREFIX, tags=["admin"])
app.include_router(admin_email_test.router, prefix=f"{API_V1_PREFIX}/admin/email-templates", tags=["admin"])
app.include_router(admin_email_categories.router, prefix=API_V1_PREFIX, tags=["admin"])
app.include_router(admin_email_functions.router, prefix=API_V1_PREFIX, tags=["admin"])
app.include_router(admin_email_gateways.router, prefix=API_V1_PREFIX, tags=["admin"])
app.include_router(admin_system_settings.router, prefix=API_V1_PREFIX, tags=["admin"])
app.include_router(admin_authors_categories.router, prefix=API_V1_PREFIX, tags=["admin"])
app.include_router(test_simple.router, prefix=API_V1_PREFIX, tags=["admin"])
app.include_router(receipts.router, prefix=f"{API_V1_PREFIX}/admin", tags=["admin"])
app.include_router(admin_works.router, prefix=API_V1_PREFIX, tags=["admin"])
app.include_router(admin_blog.router, prefix=API_V1_PREFIX, tags=["admin"])
if admin_maintenance:
    app.include_router(admin_maintenance.router, prefix=API_V1_PREFIX, tags=["admin"])
if admin_redis:
    app.include_router(admin_redis.router, prefix=API_V1_PREFIX, tags=["admin"])
app.include_router(users.router, prefix=f"{API_V1_PREFIX}/users", tags=["users"])

# User Features
app.include_router(contact.router, prefix=f"{API_V1_PREFIX}/contact", tags=["contact"])
app.include_router(user_activation.router, prefix=API_V1_PREFIX, tags=["user"])
app.include_router(email.router, prefix=API_V1_PREFIX, tags=["email"])

# Content Features
app.include_router(blog.router, prefix=f"{API_V1_PREFIX}/blog", tags=["blog"])
app.include_router(about.router, prefix=f"{API_V1_PREFIX}/about", tags=["about"])
app.include_router(portfolio.router, prefix=f"{API_V1_PREFIX}/portfolio", tags=["portfolio"])
app.include_router(reviews.router, prefix=f"{API_V1_PREFIX}/reviews", tags=["reviews"])
app.include_router(faq.router, prefix=f"{API_V1_PREFIX}/faq", tags=["faq"])

# Testing (only for development)
if app.debug:
    app.include_router(testing.router, prefix=f"{API_V1_PREFIX}/testing", tags=["testing"])

@app.get("/")
def read_root():
    return {
        "message": "ReadnWin API is running",
        "version": "1.0.0",
        "docs": "/api/v1/docs",
        "redoc": "/api/v1/redoc"
    }

@app.get("/health")
def health_check():
    """Health check endpoint for API status - always returns success"""
    from datetime import datetime
    try:
        # Try to check database connection
        from core.database import test_database_connection
        db_status = "connected" if test_database_connection() else "disconnected"
    except Exception:
        db_status = "unknown"
    
    return {
        "status": "healthy",
        "message": "ReadnWin API is running",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }