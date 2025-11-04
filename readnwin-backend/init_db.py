#!/usr/bin/env python3
"""Initialize database tables"""
import sys
sys.path.insert(0, '.')

from core.database import engine, Base

# Import all models to ensure they're registered
from models import (
    user, role, book, order, cart, contact, contact_settings, blog, faq, 
    portfolio, review, notification, reading_session, user_library, auth_log, 
    payment, payment_settings, shipping, enhanced_shopping, email, email_templates, 
    author, about_content, email_gateway, reader_settings, achievement, 
    system_settings, token_blacklist, security_log, reading, audit_log
)

print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("✅ Database tables created successfully!")

# Verify audit_logs table was created
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
if 'audit_logs' in tables:
    print("✅ audit_logs table created successfully!")
else:
    print("❌ audit_logs table was NOT created!")

print(f"\nTotal tables created: {len(tables)}")
