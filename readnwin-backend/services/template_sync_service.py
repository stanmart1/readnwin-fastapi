"""
Email Template Synchronization Service
Keeps database templates and filesystem templates in sync
"""
import os
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from models.email_templates import AdminEmailTemplate
from core.path_validator import sanitize_filename

logger = logging.getLogger(__name__)


class TemplateSyncService:
    """Manages synchronization between database and filesystem templates"""
    
    TEMPLATES_DIR = Path(__file__).parent.parent / "templates" / "emails"
    
    @staticmethod
    def ensure_templates_dir():
        """Create templates directory if it doesn't exist"""
        TemplateSyncService.TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
    
    @staticmethod
    def get_template_filename(slug: str) -> str:
        """Convert slug to filename with sanitization"""
        safe_slug = sanitize_filename(slug)
        return f"{safe_slug}.html"
    
    @staticmethod
    def get_template_filepath(slug: str) -> Path:
        """Get full filepath for a template with validation"""
        from core.path_validator import validate_path
        
        filename = TemplateSyncService.get_template_filename(slug)
        safe_path = validate_path(str(TemplateSyncService.TEMPLATES_DIR), filename)
        
        if not safe_path:
            raise ValueError(f"Invalid template path for slug: {slug}")
        
        return safe_path
    
    @staticmethod
    def save_to_filesystem(slug: str, html_content: str) -> bool:
        """Save template HTML to filesystem"""
        try:
            TemplateSyncService.ensure_templates_dir()
            filepath = TemplateSyncService.get_template_filepath(slug)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            logger.info(f"✅ Template saved to filesystem: {slug}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to save template to filesystem: {e}")
            return False
    
    @staticmethod
    def load_from_filesystem(slug: str) -> Optional[str]:
        """Load template HTML from filesystem"""
        try:
            filepath = TemplateSyncService.get_template_filepath(slug)
            
            if not filepath.exists():
                logger.warning(f"Template not found in filesystem: {slug}")
                return None
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            return content
        except Exception as e:
            logger.error(f"❌ Failed to load template from filesystem: {e}")
            return None
    
    @staticmethod
    def delete_from_filesystem(slug: str) -> bool:
        """Delete template from filesystem"""
        try:
            filepath = TemplateSyncService.get_template_filepath(slug)
            
            if filepath.exists():
                filepath.unlink()
                logger.info(f"✅ Template deleted from filesystem: {slug}")
                return True
            
            logger.warning(f"Template not found in filesystem: {slug}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to delete template from filesystem: {e}")
            return False
    
    @staticmethod
    def sync_db_to_filesystem(db: Session, slug: Optional[str] = None) -> bool:
        """Sync database templates to filesystem"""
        try:
            if slug:
                # Sync single template
                template = db.query(AdminEmailTemplate).filter(
                    AdminEmailTemplate.slug == slug
                ).first()
                
                if not template:
                    logger.warning(f"Template not found in database: {slug}")
                    return False
                
                return TemplateSyncService.save_to_filesystem(
                    template.slug,
                    template.html_content
                )
            else:
                # Sync all templates
                templates = db.query(AdminEmailTemplate).filter(
                    AdminEmailTemplate.is_active == True
                ).all()
                
                success_count = 0
                for template in templates:
                    if TemplateSyncService.save_to_filesystem(
                        template.slug,
                        template.html_content
                    ):
                        success_count += 1
                
                logger.info(f"✅ Synced {success_count}/{len(templates)} templates to filesystem")
                return True
        except Exception as e:
            logger.error(f"❌ Failed to sync database to filesystem: {e}")
            return False
    
    @staticmethod
    def sync_filesystem_to_db(db: Session, slug: Optional[str] = None) -> bool:
        """Sync filesystem templates to database"""
        try:
            TemplateSyncService.ensure_templates_dir()
            
            if slug:
                # Sync single template from filesystem
                html_content = TemplateSyncService.load_from_filesystem(slug)
                
                if not html_content:
                    logger.warning(f"Template not found in filesystem: {slug}")
                    return False
                
                template = db.query(AdminEmailTemplate).filter(
                    AdminEmailTemplate.slug == slug
                ).first()
                
                if template:
                    template.html_content = html_content
                    db.commit()
                    logger.info(f"✅ Updated database template from filesystem: {slug}")
                else:
                    logger.warning(f"Template not found in database: {slug}")
                    return False
                
                return True
            else:
                # Sync all templates from filesystem
                template_files = list(TemplateSyncService.TEMPLATES_DIR.glob("*.html"))
                success_count = 0
                
                for filepath in template_files:
                    slug = filepath.stem  # Get filename without extension
                    html_content = TemplateSyncService.load_from_filesystem(slug)
                    
                    if html_content:
                        template = db.query(AdminEmailTemplate).filter(
                            AdminEmailTemplate.slug == slug
                        ).first()
                        
                        if template:
                            template.html_content = html_content
                            db.commit()
                            success_count += 1
                        else:
                            # Create new template in database from filesystem
                            new_template = AdminEmailTemplate(
                                name=slug.replace("_", " ").title(),
                                slug=slug,
                                subject=f"Subject for {slug}",
                                html_content=html_content,
                                category="general",
                                is_active=True
                            )
                            db.add(new_template)
                            db.commit()
                            success_count += 1
                
                logger.info(f"✅ Synced {success_count}/{len(template_files)} templates to database")
                return True
        except Exception as e:
            logger.error(f"❌ Failed to sync filesystem to database: {e}")
            return False
    
    @staticmethod
    def full_sync(db: Session, direction: str = "both") -> Dict[str, bool]:
        """
        Perform full synchronization
        
        Args:
            db: Database session
            direction: "db_to_fs" (database to filesystem), 
                      "fs_to_db" (filesystem to database), 
                      or "both" (bidirectional)
        
        Returns:
            Dict with sync results
        """
        results = {
            "db_to_fs": False,
            "fs_to_db": False
        }
        
        try:
            if direction in ["db_to_fs", "both"]:
                results["db_to_fs"] = TemplateSyncService.sync_db_to_filesystem(db)
            
            if direction in ["fs_to_db", "both"]:
                results["fs_to_db"] = TemplateSyncService.sync_filesystem_to_db(db)
            
            return results
        except Exception as e:
            logger.error(f"❌ Full sync failed: {e}")
            return results


def get_template_sync_service() -> TemplateSyncService:
    """Get template sync service instance"""
    return TemplateSyncService()
