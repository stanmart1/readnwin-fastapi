from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from core.storage import storage
from models.about_content import AboutContent
from models.user import User
from typing import Dict, Any
import bleach
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/")
def get_about_content(db: Session = Depends(get_db)):
    """Get about content for public page"""
    try:
        # Try to get content from database
        content_sections = db.query(AboutContent).filter(AboutContent.is_active == True).all()
        
        # If no content exists, return empty object
        if not content_sections:
            return {}
        
        # Build response from database content
        result = {}
        for section in content_sections:
            result[section.section] = section.content
        
        return result
    except Exception as e:
        print(f"Error in get_about_content: {e}")
        # Return empty object on error
        return {}

@router.get("/admin")
def get_admin_about_content(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get about content for admin management"""
    check_admin_access(current_user)
    
    try:
        content_sections = db.query(AboutContent).all()
        result = {}
        for section in content_sections:
            result[section.section] = section.content
        return result
    except Exception as e:
        print(f"Error fetching admin about content: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch about content")

def sanitize_html_content(content):
    """Sanitize HTML content to prevent XSS"""
    if isinstance(content, str):
        # Allow basic formatting tags but strip dangerous ones
        allowed_tags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
        allowed_attributes = {}
        return bleach.clean(content, tags=allowed_tags, attributes=allowed_attributes, strip=True)
    elif isinstance(content, dict):
        return {k: sanitize_html_content(v) for k, v in content.items()}
    elif isinstance(content, list):
        return [sanitize_html_content(item) for item in content]
    return content

@router.post("/upload-image")
async def upload_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user_from_token)
):
    """Upload image for about section"""
    check_admin_access(current_user)
    
    try:
        print(f"📸 Uploading about image: {image.filename}")
        
        # Read file content first for validation
        file_content = await image.read()
        file_size = len(file_content)
        print(f"📏 File size: {file_size} bytes")
        
        # Validate file size (max 5MB)
        if file_size > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")
        
        # CRITICAL: Reset file pointer after reading
        await image.seek(0)
        print(f"🔄 File pointer reset to position 0")
        
        # Save image using storage manager
        image_path = await storage.save_image(image, subfolder="about")
        print(f"✅ Image saved successfully: {image_path}")
        
        # Return full URL
        url = storage.get_url(image_path)
        print(f"🔗 Image URL: {url}")
        return {"url": url}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error uploading image: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")

@router.put("/admin")
def save_admin_about_content(
    content_data: Dict[str, Any],
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Save about content from admin"""
    check_admin_access(current_user)
    
    try:
        # Sanitize content before saving
        sanitized_content = sanitize_html_content(content_data)
        
        for section_name, section_content in sanitized_content.items():
            section = db.query(AboutContent).filter(AboutContent.section == section_name).first()
            if section:
                section.content = section_content
            else:
                new_section = AboutContent(section=section_name, content=section_content)
                db.add(new_section)
        
        db.commit()
        return {"message": "About content saved successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error saving admin about content: {e}")
        raise HTTPException(status_code=500, detail="Failed to save about content")
