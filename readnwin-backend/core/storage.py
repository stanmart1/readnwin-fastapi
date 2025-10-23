import os
import shutil
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException
import uuid
from datetime import datetime

# Determine base upload directory based on environment
ENV = os.getenv("ENVIRONMENT", "development")

if ENV == "production":
    BASE_UPLOAD_DIR = Path("/app/storage")
else:
    BASE_UPLOAD_DIR = Path("uploads")

# Upload subdirectories
UPLOAD_DIR = BASE_UPLOAD_DIR
COVERS_DIR = UPLOAD_DIR / "covers"
BOOKS_DIR = UPLOAD_DIR / "books"
SAMPLES_DIR = UPLOAD_DIR / "samples"
IMAGES_DIR = UPLOAD_DIR / "images"

# Allowed file extensions
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_BOOK_EXTENSIONS = {".pdf", ".epub", ".mobi"}

# Max file sizes (in bytes)
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_BOOK_SIZE = 500 * 1024 * 1024  # 500MB

def init_storage():
    """Initialize storage directories"""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    COVERS_DIR.mkdir(parents=True, exist_ok=True)
    BOOKS_DIR.mkdir(parents=True, exist_ok=True)
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

def get_file_extension(filename: str) -> str:
    """Get file extension from filename"""
    return Path(filename).suffix.lower()

def generate_unique_filename(original_filename: str) -> str:
    """Generate unique filename with timestamp and UUID"""
    ext = get_file_extension(original_filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    return f"{timestamp}_{unique_id}{ext}"

def validate_image_file(file: UploadFile) -> None:
    """Validate image file"""
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image format. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
        )

def validate_book_file(file: UploadFile) -> None:
    """Validate book file"""
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_BOOK_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid book format. Allowed: {', '.join(ALLOWED_BOOK_EXTENSIONS)}"
        )

async def save_upload_file(file: UploadFile, destination: Path) -> str:
    """Save uploaded file to destination"""
    try:
        with destination.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return str(destination)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    finally:
        file.file.close()

async def save_cover_image(file: UploadFile) -> str:
    """Save book cover image and return filename"""
    validate_image_file(file)
    
    filename = generate_unique_filename(file.filename)
    file_path = COVERS_DIR / filename
    
    await save_upload_file(file, file_path)
    return filename

async def save_book_file(file: UploadFile) -> str:
    """Save book file and return filename"""
    validate_book_file(file)
    
    filename = generate_unique_filename(file.filename)
    file_path = BOOKS_DIR / filename
    
    await save_upload_file(file, file_path)
    return filename

async def save_sample_file(file: UploadFile) -> str:
    """Save sample book file and return filename"""
    validate_book_file(file)
    
    filename = generate_unique_filename(file.filename)
    file_path = SAMPLES_DIR / filename
    
    await save_upload_file(file, file_path)
    return filename

async def save_image(file: UploadFile, subfolder: Optional[str] = None) -> str:
    """Save general image and return filename"""
    validate_image_file(file)
    
    filename = generate_unique_filename(file.filename)
    
    if subfolder:
        target_dir = IMAGES_DIR / subfolder
        target_dir.mkdir(parents=True, exist_ok=True)
        file_path = target_dir / filename
    else:
        file_path = IMAGES_DIR / filename
    
    await save_upload_file(file, file_path)
    return str(file_path.relative_to(UPLOAD_DIR))

def delete_file(file_path: str) -> bool:
    """Delete a file from storage"""
    try:
        full_path = UPLOAD_DIR / file_path
        if full_path.exists():
            full_path.unlink()
            return True
        return False
    except Exception as e:
        print(f"Error deleting file {file_path}: {e}")
        return False

def get_file_path(filename: str, file_type: str = "cover") -> Path:
    """Get full file path based on type"""
    if file_type == "cover":
        return COVERS_DIR / filename
    elif file_type == "book":
        return BOOKS_DIR / filename
    elif file_type == "sample":
        return SAMPLES_DIR / filename
    elif file_type == "image":
        return IMAGES_DIR / filename
    else:
        return UPLOAD_DIR / filename

def file_exists(filename: str, file_type: str = "cover") -> bool:
    """Check if file exists"""
    file_path = get_file_path(filename, file_type)
    return file_path.exists()

def get_file_size(filename: str, file_type: str = "cover") -> int:
    """Get file size in bytes"""
    file_path = get_file_path(filename, file_type)
    if file_path.exists():
        return file_path.stat().st_size
    return 0

def get_file_url(filename: str, file_type: str = "cover") -> str:
    """Get URL for accessing file"""
    if file_type == "cover":
        return f"/uploads/covers/{filename}"
    elif file_type == "book":
        return f"/uploads/books/{filename}"
    elif file_type == "sample":
        return f"/uploads/samples/{filename}"
    elif file_type == "image":
        return f"/uploads/images/{filename}"
    else:
        return f"/uploads/{filename}"


def get_file_extension(filename: str) -> str:
    """Get file extension from filename"""
    return Path(filename).suffix.lower()

def generate_unique_filename(original_filename: str) -> str:
    """Generate unique filename with timestamp and UUID"""
    ext = get_file_extension(original_filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    return f"{timestamp}_{unique_id}{ext}"

def validate_image_file(file: UploadFile) -> None:
    """Validate image file"""
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image format. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
        )

def validate_book_file(file: UploadFile) -> None:
    """Validate book file"""
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_BOOK_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid book format. Allowed: {', '.join(ALLOWED_BOOK_EXTENSIONS)}"
        )

async def save_upload_file(file: UploadFile, destination: Path) -> str:
    """Save uploaded file to destination"""
    try:
        with destination.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return str(destination)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    finally:
        file.file.close()

async def save_cover_image(file: UploadFile) -> str:
    """Save book cover image and return filename"""
    validate_image_file(file)
    
    filename = generate_unique_filename(file.filename)
    file_path = COVERS_DIR / filename
    
    await save_upload_file(file, file_path)
    return filename

async def save_book_file(file: UploadFile) -> str:
    """Save book file and return filename"""
    validate_book_file(file)
    
    filename = generate_unique_filename(file.filename)
    file_path = BOOKS_DIR / filename
    
    await save_upload_file(file, file_path)
    return filename

async def save_sample_file(file: UploadFile) -> str:
    """Save sample book file and return filename"""
    validate_book_file(file)
    
    filename = generate_unique_filename(file.filename)
    file_path = SAMPLES_DIR / filename
    
    await save_upload_file(file, file_path)
    return filename

async def save_image(file: UploadFile, subfolder: Optional[str] = None) -> str:
    """Save general image and return filename"""
    validate_image_file(file)
    
    filename = generate_unique_filename(file.filename)
    
    if subfolder:
        target_dir = IMAGES_DIR / subfolder
        target_dir.mkdir(exist_ok=True)
        file_path = target_dir / filename
    else:
        file_path = IMAGES_DIR / filename
    
    await save_upload_file(file, file_path)
    return str(file_path.relative_to(UPLOAD_DIR))

def delete_file(file_path: str) -> bool:
    """Delete a file from storage"""
    try:
        full_path = UPLOAD_DIR / file_path
        if full_path.exists():
            full_path.unlink()
            return True
        return False
    except Exception as e:
        print(f"Error deleting file {file_path}: {e}")
        return False

def get_file_path(filename: str, file_type: str = "cover") -> Path:
    """Get full file path based on type"""
    if file_type == "cover":
        return COVERS_DIR / filename
    elif file_type == "book":
        return BOOKS_DIR / filename
    elif file_type == "sample":
        return SAMPLES_DIR / filename
    elif file_type == "image":
        return IMAGES_DIR / filename
    else:
        return UPLOAD_DIR / filename

def file_exists(filename: str, file_type: str = "cover") -> bool:
    """Check if file exists"""
    file_path = get_file_path(filename, file_type)
    return file_path.exists()

def get_file_size(filename: str, file_type: str = "cover") -> int:
    """Get file size in bytes"""
    file_path = get_file_path(filename, file_type)
    if file_path.exists():
        return file_path.stat().st_size
    return 0

def get_file_url(filename: str, file_type: str = "cover") -> str:
    """Get URL for accessing file"""
    if file_type == "cover":
        return f"/uploads/covers/{filename}"
    elif file_type == "book":
        return f"/uploads/books/{filename}"
    elif file_type == "sample":
        return f"/uploads/samples/{filename}"
    elif file_type == "image":
        return f"/uploads/images/{filename}"
    else:
        return f"/uploads/{filename}"
