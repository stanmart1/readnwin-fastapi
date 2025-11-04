#!/usr/bin/env python3
"""Initialize default system settings"""
import sys
sys.path.insert(0, '.')

from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.system_settings import SystemSetting

def init_system_settings():
    """Initialize default system settings in database"""
    db = SessionLocal()
    try:
        print("=" * 60)
        print("INITIALIZING SYSTEM SETTINGS")
        print("=" * 60)
        
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
            {"key": "session_timeout_minutes", "value": "40", "data_type": "integer", "category": "security", "description": "Session timeout in minutes", "is_public": True},
            {"key": "auto_backup", "value": "true", "data_type": "boolean", "category": "security", "description": "Enable automatic backups"},
            {"key": "backup_frequency", "value": "daily", "data_type": "string", "category": "security", "description": "Backup frequency"},
            {"key": "max_file_size_mb", "value": "10", "data_type": "integer", "category": "security", "description": "Maximum file upload size in MB"},
            {"key": "allowed_file_types", "value": '["pdf", "epub", "mobi"]', "data_type": "json", "category": "security", "description": "Allowed file types for upload"},
            
            # Redis Settings
            {"key": "redis_enabled", "value": "true", "data_type": "boolean", "category": "cache", "description": "Enable Redis caching and rate limiting"},
        ]
        
        created_count = 0
        updated_count = 0
        
        for setting_data in default_settings:
            existing = db.query(SystemSetting).filter(SystemSetting.key == setting_data["key"]).first()
            if not existing:
                setting = SystemSetting(**setting_data)
                db.add(setting)
                created_count += 1
                print(f"✅ Created: {setting_data['key']}")
            else:
                updated_count += 1
                print(f"⏭️  Already exists: {setting_data['key']}")
        
        db.commit()
        
        print("\n" + "=" * 60)
        print(f"✅ Created {created_count} new settings")
        print(f"⏭️  Skipped {updated_count} existing settings")
        print("=" * 60)
        
        # Verify
        all_settings = db.query(SystemSetting).all()
        print(f"\nTotal settings in database: {len(all_settings)}")
        print("\n✅ System settings initialized successfully!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = init_system_settings()
    sys.exit(0 if success else 1)
