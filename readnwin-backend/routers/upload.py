from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pathlib import Path
from core.database import get_db
from core.security import get_current_user_from_token
from core.secure_upload import validate_file, secure_save_file

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    file_type: str = "image",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Upload file with security validation"""
    
    # Read file content
    file_content = await file.read()
    
    # Validate file
    is_valid, error_msg = validate_file(file_content, file.filename, file_type)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Securely save file
    try:
        file_path = secure_save_file(file_content, file.filename, str(UPLOAD_DIR))
        filename = Path(file_path).name
        file_url = f"/uploads/{filename}"
        
        return {
            "url": file_url,
            "filename": filename,
            "original_name": file.filename,
            "size": len(file_content)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))