from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
import uuid
from pathlib import Path
from core.database import get_db
from core.security import get_current_user_from_token

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    file_type: str = "general",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Upload file and return URL"""
    
    # Validate file type
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Validate file size (5MB max)
    max_size = 5 * 1024 * 1024
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(status_code=400, detail="File too large")
    
    # Generate filename using old format: hash + original filename
    import hashlib
    file_hash = hashlib.md5(file_content).hexdigest()[:16]
    unique_filename = f"{file_hash}_{file.filename}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Return file URL
    file_url = f"/uploads/{unique_filename}"
    
    return {
        "url": file_url,
        "filename": unique_filename,
        "original_name": file.filename,
        "size": len(file_content)
    }