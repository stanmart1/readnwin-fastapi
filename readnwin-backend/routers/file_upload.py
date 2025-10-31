from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token
from core.secure_upload import validate_file, secure_save_file
from core.path_validator import sanitize_filename
from models.user import User
from pathlib import Path

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = Path("uploads")

@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    type: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """Upload file with security validation"""
    try:
        # Sanitize type parameter to prevent path traversal
        safe_type = sanitize_filename(type)
        if not safe_type or safe_type != type:
            raise HTTPException(status_code=400, detail="Invalid upload type")
        
        # Map type to file category
        file_category = "proof" if safe_type == "proofs" else "image"
        
        # Read file content
        content = await file.read()
        
        # Validate file
        is_valid, error_msg = validate_file(content, file.filename, file_category)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Create upload directory
        upload_path = UPLOAD_DIR / safe_type
        upload_path.mkdir(parents=True, exist_ok=True)
        
        # Securely save file
        file_path = secure_save_file(content, file.filename, str(upload_path))
        filename = Path(file_path).name
        file_url = f"/uploads/{safe_type}/{filename}"
        
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