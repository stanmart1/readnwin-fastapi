#!/usr/bin/env python3
"""
Migration script to create system_settings table and initialize default settings
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from core.database import engine, get_db
from models.system_settings import SystemSetting

def create_system_settings_table():
    """Create system_settings table"""
    try:
        with engine.connect() as connection:
            trans = connection.begin()
            
            try:
                # Create system_settings table
                print("Creating system_settings table...")
                connection.execute(text("""
                    CREATE TABLE IF NOT EXISTS system_settings (
                        id SERIAL PRIMARY KEY,
                        key VARCHAR(255) UNIQUE NOT NULL,
                        value TEXT,
                        data_type VARCHAR(50) NOT NULL DEFAULT 'string',
                        category VARCHAR(100) NOT NULL DEFAULT 'general',
                        description TEXT,
                        is_public BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                """))
                
                # Create indexes
                print("Creating indexes...")
                connection.execute(text("CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key)"))
                connection.execute(text("CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category)"))
                connection.execute(text("CREATE INDEX IF NOT EXISTS idx_system_settings_is_public ON system_settings(is_public)"))
                
                trans.commit()
                print("✅ System settings table created successfully!")
                
            except Exception as e:
                trans.rollback()
                print(f"❌ Table creation failed: {e}")
                raise
                
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

def initialize_default_settings():
    """Initialize default system settings"""
    try:
        db = next(get_db())
        
        default_settings = [
            # General Settings
            {"key": "site_name", "value": "ReadnWin", "data_type": "string", "category": "general", "description": "Site name", "is_public": True},
            {"key": "site_description", "value": "Your digital library for endless reading", "data_type": "string", "category": "general", "description": "Site description", "is_public": True},
            {"key": "maintenance_mode", "value": "false", "data_type": "boolean", "category": "general", "description": "Enable maintenance mode"},
            {"key": "user_registration", "value": "true", "data_type": "boolean", "category": "general", "description": "Allow user registration", "is_public": True},
            {"key": "email_notifications", "value": "true", "data_type": "boolean", "category": "general", "description": "Enable email notifications"},
            {"key": "double_opt_in", "value": "true", "data_type": "boolean", "category": "general", "description": "Require email verification"},
            {"key": "review_moderation", "value": "true", "data_type": "boolean", "category": "general", "description": "Moderate reviews before publishing"},
            
            # Security Settings
            {"key": "session_timeout_minutes", "value": "40", "data_type": "integer", "category": "security", "description": "Session timeout in minutes"},
            {"key": "max_login_attempts", "value": "5", "data_type": "integer", "category": "security", "description": "Maximum login attempts before lockout"},
            {"key": "lockout_duration_minutes", "value": "15", "data_type": "integer", "category": "security", "description": "Account lockout duration in minutes"},
            {"key": "password_min_length", "value": "8", "data_type": "integer", "category": "security", "description": "Minimum password length"},
            {"key": "require_password_complexity", "value": "true", "data_type": "boolean", "category": "security", "description": "Require complex passwords"},
            {"key": "auto_backup", "value": "true", "data_type": "boolean", "category": "security", "description": "Enable automatic backups"},
            {"key": "backup_frequency", "value": "daily", "data_type": "string", "category": "security", "description": "Backup frequency"},
            {"key": "max_file_size_mb", "value": "10", "data_type": "integer", "category": "security", "description": "Maximum file upload size in MB"},
            {"key": "allowed_file_types", "value": '["pdf", "epub", "mobi"]', "data_type": "json", "category": "security", "description": "Allowed file types for upload"},
            
            # Payment Settings
            {"key": "default_currency", "value": "NGN", "data_type": "string", "category": "payment", "description": "Default currency", "is_public": True},
            {"key": "tax_rate", "value": "8.5", "data_type": "float", "category": "payment", "description": "Tax rate percentage"},
            {"key": "free_shipping_threshold", "value": "50", "data_type": "float", "category": "payment", "description": "Free shipping threshold amount"},
            {"key": "default_shipping_cost", "value": "5.99", "data_type": "float", "category": "payment", "description": "Default shipping cost"},
            
            # Reading Settings
            {"key": "default_reading_goal", "value": "12", "data_type": "integer", "category": "reading", "description": "Default annual reading goal"},
            {"key": "reading_streak_enabled", "value": "true", "data_type": "boolean", "category": "reading", "description": "Enable reading streak tracking"},
            {"key": "achievement_system_enabled", "value": "true", "data_type": "boolean", "category": "reading", "description": "Enable achievement system"},
            
            # Email Settings
            {"key": "email_from_name", "value": "ReadnWin", "data_type": "string", "category": "email", "description": "Email sender name"},
            {"key": "email_from_address", "value": "noreply@readnwin.com", "data_type": "string", "category": "email", "description": "Email sender address"},
            {"key": "email_reply_to", "value": "support@readnwin.com", "data_type": "string", "category": "email", "description": "Email reply-to address"},
            
            # Content Settings
            {"key": "books_per_page", "value": "20", "data_type": "integer", "category": "content", "description": "Books displayed per page", "is_public": True},
            {"key": "featured_books_count", "value": "8", "data_type": "integer", "category": "content", "description": "Number of featured books to display", "is_public": True},
            {"key": "new_releases_count", "value": "12", "data_type": "integer", "category": "content", "description": "Number of new releases to display", "is_public": True},
            {"key": "enable_reviews", "value": "true", "data_type": "boolean", "category": "content", "description": "Enable book reviews", "is_public": True},
            {"key": "enable_ratings", "value": "true", "data_type": "boolean", "category": "content", "description": "Enable book ratings", "is_public": True}
        ]
        
        created_count = 0
        for setting_data in default_settings:
            existing = db.query(SystemSetting).filter(SystemSetting.key == setting_data["key"]).first()
            if not existing:
                setting = SystemSetting(**setting_data)
                db.add(setting)
                created_count += 1
                print(f"✅ Created setting: {setting_data['key']}")
            else:
                print(f"⚠️ Setting already exists: {setting_data['key']}")
        
        db.commit()
        print(f"\n✅ Initialized {created_count} default settings!")
        
        # Print summary
        total_settings = db.query(SystemSetting).count()
        print(f"📊 Total settings in database: {total_settings}")
        
    except Exception as e:
        print(f"❌ Error initializing settings: {e}")
        if 'db' in locals():
            db.rollback()
        sys.exit(1)
    finally:
        if 'db' in locals():
            db.close()

def main():
    """Main migration function"""
    print("🔄 Starting system settings migration...")
    
    # Create table first
    create_system_settings_table()
    
    # Initialize default settings
    print("\n📋 Initializing default settings...")
    initialize_default_settings()
    
    print("\n✅ System settings migration completed successfully!")

if __name__ == "__main__":
    main()