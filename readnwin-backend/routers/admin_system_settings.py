from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.user import User
from models.system_settings import SystemSetting
from pydantic import BaseModel
from typing import Dict, Any, Optional
import json

router = APIRouter(prefix="/admin/system-settings", tags=["admin-system-settings"])

class SettingUpdate(BaseModel):
    value: Any
    description: Optional[str] = None

@router.get("")
def get_system_settings(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get all system settings"""
    check_admin_access(current_user)
    
    query = db.query(SystemSetting)
    if category:
        query = query.filter(SystemSetting.category == category)
    
    settings = query.all()
    
    result = {}
    for setting in settings:
        # Parse value based on data type
        if setting.data_type == "boolean":
            value = setting.value.lower() == "true" if setting.value else False
        elif setting.data_type == "integer":
            value = int(setting.value) if setting.value else 0
        elif setting.data_type == "float":
            value = float(setting.value) if setting.value else 0.0
        elif setting.data_type == "json":
            value = json.loads(setting.value) if setting.value else {}
        else:
            value = setting.value
        
        result[setting.key] = {
            "value": value,
            "data_type": setting.data_type,
            "category": setting.category,
            "description": setting.description,
            "is_public": setting.is_public
        }
    
    return {"settings": result}

@router.put("/{key}")
def update_system_setting(
    key: str,
    setting_data: SettingUpdate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update a system setting"""
    check_admin_access(current_user)
    
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    # Convert value to string based on data type
    if setting.data_type == "json":
        setting.value = json.dumps(setting_data.value)
    else:
        setting.value = str(setting_data.value)
    
    if setting_data.description:
        setting.description = setting_data.description
    
    db.commit()
    
    return {"message": "Setting updated successfully"}

@router.post("/initialize")
def initialize_default_settings(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Initialize default system settings"""
    check_admin_access(current_user)
    
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
        
        # Email Gateway API Keys
        {"key": "resend_api_key", "value": "", "data_type": "string", "category": "email", "description": "Resend API key"},
        {"key": "smtp_host", "value": "mail.readnwin.com", "data_type": "string", "category": "email", "description": "SMTP server host"},
        {"key": "smtp_port", "value": "465", "data_type": "integer", "category": "email", "description": "SMTP server port"},
        {"key": "smtp_username", "value": "portal@readnwin.com", "data_type": "string", "category": "email", "description": "SMTP username"},
        {"key": "smtp_password", "value": "", "data_type": "string", "category": "email", "description": "SMTP password"},
        {"key": "smtp_use_tls", "value": "true", "data_type": "boolean", "category": "email", "description": "Use TLS for SMTP"},
        
        # Payment Gateway API Keys
        {"key": "flutterwave_public_key", "value": "", "data_type": "string", "category": "payment", "description": "Flutterwave public key"},
        {"key": "flutterwave_secret_key", "value": "", "data_type": "string", "category": "payment", "description": "Flutterwave secret key"},
        {"key": "flutterwave_hash", "value": "", "data_type": "string", "category": "payment", "description": "Flutterwave hash"},
        {"key": "payment_test_mode", "value": "true", "data_type": "boolean", "category": "payment", "description": "Enable payment test mode"},
        
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
    
    db.commit()
    
    return {"message": f"Initialized {created_count} default settings"}

@router.post("/sync-env")
def sync_environment_variables(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Sync API keys from environment variables to system settings"""
    check_admin_access(current_user)
    
    import os
    
    # Environment variable mappings
    env_mappings = {
        'resend_api_key': 'RESEND_API_KEY',
        'smtp_host': 'SMTP_HOST',
        'smtp_port': 'SMTP_PORT',
        'smtp_username': 'SMTP_USER',
        'smtp_password': 'SMTP_PASS',
        'flutterwave_public_key': 'RAVE_LIVE_PUBLIC_KEY',
        'flutterwave_secret_key': 'RAVE_LIVE_SECRET_KEY',
        'flutterwave_hash': 'RAVE_HASH'
    }
    
    updated_count = 0
    for setting_key, env_key in env_mappings.items():
        env_value = os.getenv(env_key)
        if env_value:
            setting = db.query(SystemSetting).filter(SystemSetting.key == setting_key).first()
            if setting:
                setting.value = env_value
                updated_count += 1
    
    db.commit()
    
    return {"message": f"Synced {updated_count} settings from environment variables"}

@router.get("/public")
def get_public_settings(db: Session = Depends(get_db)):
    """Get public system settings (no auth required)"""
    settings = db.query(SystemSetting).filter(SystemSetting.is_public == True).all()
    
    result = {}
    for setting in settings:
        if setting.data_type == "boolean":
            value = setting.value.lower() == "true" if setting.value else False
        elif setting.data_type == "integer":
            value = int(setting.value) if setting.value else 0
        elif setting.data_type == "float":
            value = float(setting.value) if setting.value else 0.0
        elif setting.data_type == "json":
            value = json.loads(setting.value) if setting.value else {}
        else:
            value = setting.value
        
        result[setting.key] = value
    
    return {"settings": result}