from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User
import os
import uuid
from pathlib import Path
import shutil

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = Path("uploads")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".pdf"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    type: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """Upload file (proof of payment, etc.)"""
    try:
        # Validate file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed."
            )

        # Read file content to check size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail="File size too large. Maximum size is 5MB."
            )

        # Create upload directory if it doesn't exist
        upload_path = UPLOAD_DIR / type
        upload_path.mkdir(parents=True, exist_ok=True)

        # Generate filename using old format: hash + original filename
        import hashlib
        file_hash = hashlib.md5(content).hexdigest()[:16]
        unique_filename = f"{file_hash}_{file.filename}"
        file_path = upload_path / unique_filename

        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        # Return file URL
        file_url = f"/uploads/{type}/{unique_filename}"
        
        return {
            "success": True,
            "url": file_url,
            "filename": file.filename,
            "size": len(content)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")