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

app = FastAPI(title="ReadnWin API", version="1.0.0")

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
        from services.achievement_service import initialize_default_achievements
        db = next(get_db())
        try:
            initialize_default_achievements(db)
        finally:
            db.close()
        
    except Exception as e:
        print(f"❌ Database startup failed: {str(e)[:100]}")
        print("🔄 API will run in limited mode without database")

# CORS configuration - update for production
allowed_origins = [
    "http://localhost:3000",  # Development
    "http://127.0.0.1:3000",  # Development
    # Add production domains here:
    # "https://yourdomain.com",
    # "https://www.yourdomain.com"
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

# Import new comprehensive analytics router
try:
    from routers import analytics_comprehensive
except ImportError:
    analytics_comprehensive = None

# Authentication and Authorization
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(auth_log.router, prefix="/auth", tags=["auth"])
app.include_router(rbac.router, prefix="/rbac", tags=["rbac"])
app.include_router(csrf.router, prefix="/auth", tags=["auth"])

# Enhanced Features
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(reading_goals.router, prefix="/reading-goals", tags=["reading-goals"])
app.include_router(reading_enhanced.router, tags=["reading"])
app.include_router(admin_enhanced.router, prefix="/admin", tags=["admin"])
app.include_router(admin_email.router, prefix="/admin/email", tags=["admin"])
app.include_router(orders_enhanced.router, prefix="/orders", tags=["orders"])
app.include_router(shopping_enhanced.router, prefix="/shopping", tags=["shopping"])
app.include_router(analytics.router, tags=["analytics"])
if analytics_comprehensive:
    app.include_router(analytics_comprehensive.router, tags=["analytics"])
app.include_router(user.router, prefix="/user", tags=["user"])
app.include_router(user_library.router, tags=["user-library"])

# Image Optimization
app.include_router(images.router, tags=["images"])

# Core Features
app.include_router(books.router, prefix="/books", tags=["books"])
app.include_router(ereader.router, tags=["ereader"])
app.include_router(ereader_enhanced.router, tags=["ereader-enhanced"])
app.include_router(reader_settings.router, tags=["reader"])
app.include_router(cart.router, prefix="/cart", tags=["cart"])
app.include_router(checkout.router, prefix="/checkout-legacy", tags=["checkout"])
app.include_router(checkout_enhanced.router, prefix="/checkout-enhanced", tags=["checkout"])
app.include_router(checkout_fixed.router, prefix="/checkout-fixed", tags=["checkout"])
app.include_router(checkout_unified.router, tags=["checkout"])
app.include_router(test_checkout.router, tags=["test"])
app.include_router(payment_verification.router, prefix="/payment", tags=["payment"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
app.include_router(reading.router, tags=["reading"])
app.include_router(payment.router, tags=["payment"])
app.include_router(flutterwave.router, tags=["payment"])
app.include_router(bank_transfer.router, tags=["payment"])
app.include_router(payment_completion.router, tags=["payment"])
app.include_router(upload.router, tags=["upload"])
app.include_router(file_upload.router, tags=["upload"])

# Admin Features
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(admin_payment_proofs.router, prefix="/admin", tags=["admin"])
app.include_router(admin_stats.router, tags=["admin"])
app.include_router(admin_stats_fast.router, prefix="/admin/stats", tags=["admin"])
app.include_router(admin_books.router, tags=["admin"])
app.include_router(admin_payment_settings.router, tags=["admin"])
app.include_router(payment_settings.router, tags=["payment"])  # Public endpoints
app.include_router(shipping.router, tags=["shipping"])
app.include_router(admin_shipping.router, tags=["admin"])
app.include_router(admin_reviews.router, tags=["admin"])
app.include_router(admin_reports.router, tags=["admin"])
app.include_router(admin_notifications.router, tags=["admin"])
app.include_router(admin_email_templates.router, tags=["admin"])
app.include_router(admin_email_test.router, prefix="/admin/email-templates", tags=["admin"])
app.include_router(admin_email_categories.router, tags=["admin"])
app.include_router(admin_email_functions.router, tags=["admin"])
app.include_router(admin_email_gateways.router, tags=["admin"])
app.include_router(admin_system_settings.router, tags=["admin"])
app.include_router(admin_authors_categories.router, tags=["admin"])
app.include_router(test_simple.router, tags=["admin"])
app.include_router(receipts.router, prefix="/admin", tags=["admin"])
app.include_router(admin_works.router, tags=["admin"])
app.include_router(admin_blog.router, tags=["admin"])
app.include_router(users.router, prefix="/users", tags=["users"])

# User Features
app.include_router(contact.router, prefix="/contact", tags=["contact"])
app.include_router(user_activation.router, tags=["user"])
app.include_router(email.router, tags=["email"])

# Content Features
app.include_router(blog.router, prefix="/blog", tags=["blog"])
app.include_router(about.router, prefix="/about", tags=["about"])
app.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])
app.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
app.include_router(faq.router, prefix="/faq", tags=["faq"])

# Testing (only for development)
if app.debug:
    app.include_router(testing.router, prefix="/testing", tags=["testing"])

@app.get("/")
def read_root():
    return {"message": "ReadnWin API is running"}

@app.get("/health")
def health_check():
    """Health check endpoint for API status"""
    from datetime import datetime
    return {
        "status": "healthy",
        "message": "ReadnWin API is running",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }