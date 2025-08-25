from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.about_content import AboutContent
from models.user import User
from typing import Dict, Any
import os
import uuid
import bleach
from pathlib import Path

router = APIRouter()

@router.get("/")
def get_about_content(db: Session = Depends(get_db)):
    """Get about content for public page"""
    try:
        # Get all about content sections from database
        content_sections = db.query(AboutContent).filter(AboutContent.is_active == True).all()
        
        # If no content exists, return default content structure
        if not content_sections:
            return {
                "hero": {
                    "title": "About ReadnWin",
                    "subtitle": "Revolutionizing the way people discover, read, and engage with books through innovative technology and community-driven experiences."
                },
                "mission": {
                    "title": "Our Mission",
                    "description": "At ReadnWin, we believe that reading should be accessible, engaging, and rewarding for everyone.",
                    "features": ["Discover new books", "Win exciting prizes", "Join reading communities", "Track your progress"]
                },
                "missionGrid": [
                    {"icon": "ri-book-line", "title": "Digital Library", "description": "Access millions of books", "color": "text-blue-600"},
                    {"icon": "ri-brain-line", "title": "Smart Learning", "description": "AI-powered insights", "color": "text-purple-600"},
                    {"icon": "ri-group-line", "title": "Community", "description": "Connect with readers", "color": "text-cyan-600"},
                    {"icon": "ri-device-line", "title": "Multi-Platform", "description": "Read anywhere", "color": "text-green-600"}
                ],
                "stats": [
                    {"number": "10K+", "label": "Active Readers"},
                    {"number": "5K+", "label": "Books Available"},
                    {"number": "1M+", "label": "Pages Read"},
                    {"number": "500+", "label": "Prizes Won"}
                ],
                "values": [
                    {"icon": "ri-book-open-line", "title": "Accessibility", "description": "Making reading accessible to everyone"},
                    {"icon": "ri-lightbulb-line", "title": "Innovation", "description": "Cutting-edge technology"},
                    {"icon": "ri-heart-line", "title": "Community", "description": "Building connections"},
                    {"icon": "ri-shield-check-line", "title": "Quality", "description": "Highest standards"}
                ],
                "story": {
                    "title": "Our Story",
                    "description": "ReadnWin was born from a vision to democratize reading through technology.",
                    "timeline": [
                        {"year": "2019", "title": "Founded", "description": "Started with a vision"},
                        {"year": "2021", "title": "Growth", "description": "Reached 10,000 readers"},
                        {"year": "2023", "title": "Innovation", "description": "Launched AI features"},
                        {"year": "2025", "title": "Expansion", "description": "Global platform"}
                    ]
                },
                "team": [
                    {"name": "Sarah Johnson", "role": "CEO", "bio": "Passionate about reading", "image": null, "linkedin": "#", "twitter": "#"}
                ],
                "cta": {
                    "title": "Join the Reading Revolution",
                    "description": "Start your journey with ReadnWin today.",
                    "primaryButton": "Get Started Free",
                    "secondaryButton": "Learn More"
                }
            }
        
        # Build response from database content
        result = {}
        for section in content_sections:
            result[section.section] = section.content
        
        return result
    except Exception as e:
        print(f"Error fetching about content: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch about content")

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
    
    # Validate file type
    if not image.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Validate file size (5MB max)
    if image.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")
    
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = Path("../public/images/uploads")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
        unique_filename = f"about-section-{uuid.uuid4().hex[:16]}.{file_extension}"
        file_path = upload_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await image.read()
            buffer.write(content)
        
        # Return URL path
        return {"url": f"/images/uploads/{unique_filename}"}
    
    except Exception as e:
        print(f"Error uploading image: {e}")
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