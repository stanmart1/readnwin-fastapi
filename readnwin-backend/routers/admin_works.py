from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.user import User
from models.portfolio import Portfolio
from pydantic import BaseModel
from typing import Optional
import os
import uuid
from pathlib import Path

router = APIRouter(prefix="/admin/works", tags=["admin", "works"])

class WorkResponse(BaseModel):
    id: int
    title: str
    description: str
    image_path: str
    alt_text: str
    order_index: int
    is_active: bool
    created_at: str
    updated_at: str

@router.get("")
def get_works(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get all works for admin management"""
    check_admin_access(current_user)
    
    try:
        works = db.query(Portfolio).order_by(Portfolio.order_index).all()
        
        return {
            "success": True,
            "works": [
                {
                    "id": work.id,
                    "title": work.title,
                    "description": work.description or "",
                    "image_path": work.image_url or "",
                    "alt_text": work.title,  # Use title as alt text
                    "order_index": work.order_index,
                    "is_active": work.is_active,
                    "created_at": work.created_at.isoformat() if work.created_at else "",
                    "updated_at": work.updated_at.isoformat() if work.updated_at else ""
                }
                for work in works
            ]
        }
    except Exception as e:
        print(f"Error fetching works: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch works")

@router.post("")
async def create_work(
    title: str = Form(...),
    description: str = Form(""),
    alt_text: str = Form(...),
    order_index: int = Form(0),
    is_active: bool = Form(True),
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new work"""
    check_admin_access(current_user)
    
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = Path("uploads/works")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = upload_dir / filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await image.read()
            buffer.write(content)
        
        # Create database record
        new_work = Portfolio(
            title=title,
            description=description,
            image_url=f"/uploads/works/{filename}",
            order_index=order_index,
            is_active=is_active
        )
        
        db.add(new_work)
        db.commit()
        db.refresh(new_work)
        
        return {
            "success": True,
            "message": "Work created successfully",
            "id": new_work.id
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating work: {e}")
        raise HTTPException(status_code=500, detail="Failed to create work")

@router.put("/{work_id}")
async def update_work(
    work_id: int,
    title: str = Form(...),
    description: str = Form(""),
    alt_text: str = Form(...),
    order_index: int = Form(0),
    is_active: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update a work"""
    check_admin_access(current_user)
    
    try:
        work = db.query(Portfolio).filter(Portfolio.id == work_id).first()
        if not work:
            raise HTTPException(status_code=404, detail="Work not found")
        
        # Update fields
        work.title = title
        work.description = description
        work.order_index = order_index
        work.is_active = is_active
        
        # Handle image update if provided
        if image:
            upload_dir = Path("uploads/works")
            upload_dir.mkdir(parents=True, exist_ok=True)
            
            file_extension = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
            filename = f"{uuid.uuid4()}.{file_extension}"
            file_path = upload_dir / filename
            
            with open(file_path, "wb") as buffer:
                content = await image.read()
                buffer.write(content)
            
            work.image_url = f"/uploads/works/{filename}"
        
        db.commit()
        
        return {
            "success": True,
            "message": "Work updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating work: {e}")
        raise HTTPException(status_code=500, detail="Failed to update work")

@router.delete("/{work_id}")
def delete_work(
    work_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete a work"""
    check_admin_access(current_user)
    
    try:
        work = db.query(Portfolio).filter(Portfolio.id == work_id).first()
        if not work:
            raise HTTPException(status_code=404, detail="Work not found")
        
        db.delete(work)
        db.commit()
        
        return {
            "success": True,
            "message": "Work deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting work: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete work")

@router.patch("/{work_id}/toggle")
def toggle_work_status(
    work_id: int,
    is_active: bool = Form(...),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Toggle work active status"""
    check_admin_access(current_user)
    
    try:
        work = db.query(Portfolio).filter(Portfolio.id == work_id).first()
        if not work:
            raise HTTPException(status_code=404, detail="Work not found")
        
        work.is_active = is_active
        db.commit()
        
        return {
            "success": True,
            "message": "Work status updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating work status: {e}")
        raise HTTPException(status_code=500, detail="Failed to update work status")