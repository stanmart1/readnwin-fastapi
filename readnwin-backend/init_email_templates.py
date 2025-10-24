#!/usr/bin/env python3
"""
Initialize email templates in database from existing filesystem templates
Run this once to populate the database with existing templates
"""
import sys
from pathlib import Path

# Add parent directory to Python path
sys.path.append(str(Path(__file__).parent))

from core.database import SessionLocal
from services.template_sync_service import TemplateSyncService
from models.email_templates import AdminEmailTemplate
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_templates():
    """Initialize database templates from filesystem"""
    db = SessionLocal()
    
    try:
        logger.info("🔄 Initializing email templates from filesystem...")
        
        # Get existing filesystem templates
        templates_dir = Path(__file__).parent / "templates" / "emails"
        template_files = list(templates_dir.glob("*.html"))
        
        logger.info(f"Found {len(template_files)} template files")
        
        for template_file in template_files:
            slug = template_file.stem
            
            # Check if template already exists in database
            existing = db.query(AdminEmailTemplate).filter(
                AdminEmailTemplate.slug == slug
            ).first()
            
            if existing:
                logger.info(f"⚠️  Template already exists in database: {slug}")
                continue
            
            # Read template content
            try:
                with open(template_file, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                # Create template in database
                template = AdminEmailTemplate(
                    name=slug.replace("_", " ").title(),
                    slug=slug,
                    subject=f"Subject for {slug.replace('_', ' ').title()}",
                    html_content=html_content,
                    description=f"Auto-imported template for {slug}",
                    category=get_template_category(slug),
                    is_active=True
                )
                
                db.add(template)
                db.commit()
                logger.info(f"✅ Created database template: {slug}")
                
            except Exception as e:
                logger.error(f"❌ Failed to create template {slug}: {e}")
        
        logger.info("🎉 Template initialization completed!")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize templates: {e}")
        db.rollback()
    finally:
        db.close()

def get_template_category(slug: str) -> str:
    """Determine template category based on slug"""
    auth_templates = ['welcome', 'email_verification', 'password_reset', 'password_changed', 'login_alert']
    transaction_templates = ['order_confirmation', 'payment_confirmation', 'refund_processed']
    notification_templates = ['security_alert', 'system_maintenance', 'goal_achieved']
    marketing_templates = ['promotional_offer', 'new_book_release', 'newsletter_subscription']
    
    if slug in auth_templates:
        return "authentication"
    elif slug in transaction_templates:
        return "transactional"
    elif slug in notification_templates:
        return "notifications"
    elif slug in marketing_templates:
        return "marketing"
    else:
        return "general"

if __name__ == "__main__":
    init_templates()