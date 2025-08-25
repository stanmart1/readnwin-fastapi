import os
import uuid
from pathlib import Path
from fastapi import UploadFile
import aiofiles
import shutil

UPLOAD_DIR = Path("uploads")
COVER_IMAGES_DIR = UPLOAD_DIR / "cover_images"
EBOOKS_DIR = UPLOAD_DIR / "ebooks"

# Create directories if they don't exist
COVER_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
EBOOKS_DIR.mkdir(parents=True, exist_ok=True)

async def upload_file(file: UploadFile, directory: Path) -> str:
    """
    Upload a file to the specified directory and return its filename
    """
    # Generate unique filename
    ext = file.filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = directory / filename
    
    # Save the file
    async with aiofiles.open(file_path, 'wb') as out_file:
        while content := await file.read(1024 * 1024):  # Read in 1MB chunks
            await out_file.write(content)
            
    return filename

def delete_file(filename: str, directory: Path) -> None:
    """
    Delete a file from the specified directory
    """
    file_path = directory / filename
    if file_path.exists():
        file_path.unlink()
