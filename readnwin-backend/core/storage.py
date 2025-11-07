import os
import shutil
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException
import uuid
from datetime import datetime


class StorageManager:
    """Local file storage management system"""
    
    # Allowed file extensions
    ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    ALLOWED_BOOK_EXTENSIONS = {".pdf", ".epub", ".mobi", ".html"}
    
    # Max file sizes (in bytes)
    MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_BOOK_SIZE = 500 * 1024 * 1024  # 500MB
    
    def __init__(self):
        """Initialize local storage manager"""
        self.env = os.getenv("ENVIRONMENT", "")
        
        if self.env == "production":
            self.base_dir = Path("/app/storage")
            self.url_prefix = "/uploads"  # HTTP endpoint is always /uploads
        else:
            self.base_dir = Path("uploads")
            self.url_prefix = "/uploads"
        
        # Subdirectories
        self.covers_dir = self.base_dir / "covers"
        self.books_dir = self.base_dir / "books"
        self.samples_dir = self.base_dir / "samples"
        self.images_dir = self.base_dir / "images"
        
        self._init_directories()
    
    def _init_directories(self):
        """Create all required directories"""
        for directory in [self.base_dir, self.covers_dir, self.books_dir, self.samples_dir, self.images_dir]:
            try:
                directory.mkdir(parents=True, exist_ok=True)
            except (OSError, PermissionError) as e:
                if self.env == "production":
                    print(f"⚠️ Directory creation skipped in production: {directory} ({e})")
                else:
                    raise
    
    def _get_file_extension(self, filename: str) -> str:
        """Get file extension from filename"""
        return Path(filename).suffix.lower()
    
    def _generate_unique_filename(self, original_filename: str) -> str:
        """Generate unique filename with timestamp and UUID"""
        ext = self._get_file_extension(original_filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        return f"{timestamp}_{unique_id}{ext}"
    
    def _validate_image(self, file: UploadFile):
        """Validate image file"""
        ext = self._get_file_extension(file.filename)
        if ext not in self.ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image format. Allowed: {', '.join(self.ALLOWED_IMAGE_EXTENSIONS)}"
            )
    
    def _validate_book(self, file: UploadFile):
        """Validate book file"""
        ext = self._get_file_extension(file.filename)
        if ext not in self.ALLOWED_BOOK_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid book format. Allowed: {', '.join(self.ALLOWED_BOOK_EXTENSIONS)}"
            )
    
    async def _save_file(self, file: UploadFile, destination: Path) -> str:
        """Save uploaded file to destination"""
        try:
            with destination.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            return str(destination)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        finally:
            file.file.close()
    
    async def save_cover(self, file: UploadFile) -> str:
        """Save book cover"""
        self._validate_image(file)
        
        filename = self._generate_unique_filename(file.filename)
        file_path = self.covers_dir / filename
        await self._save_file(file, file_path)
        return f"covers/{filename}"
    
    async def save_book(self, file: UploadFile) -> str:
        """Save book file and return relative path"""
        self._validate_book(file)
        
        filename = self._generate_unique_filename(file.filename)
        file_path = self.books_dir / filename
        await self._save_file(file, file_path)
        return f"books/{filename}"
    
    async def save_sample(self, file: UploadFile) -> str:
        """Save sample file and return relative path"""
        self._validate_book(file)
        filename = self._generate_unique_filename(file.filename)
        file_path = self.samples_dir / filename
        await self._save_file(file, file_path)
        return f"samples/{filename}"
    
    async def save_image(self, file: UploadFile, subfolder: Optional[str] = None) -> str:
        """Save general image and return relative path"""
        self._validate_image(file)
        filename = self._generate_unique_filename(file.filename)
        
        if subfolder:
            target_dir = self.images_dir / subfolder
            target_dir.mkdir(parents=True, exist_ok=True)
            file_path = target_dir / filename
            await self._save_file(file, file_path)
            return f"images/{subfolder}/{filename}"
        else:
            file_path = self.images_dir / filename
            await self._save_file(file, file_path)
            return f"images/{filename}"
    
    def delete_file(self, relative_path: str) -> bool:
        """Delete a file from storage"""
        try:
            full_path = self.base_dir / relative_path
            if full_path.exists():
                full_path.unlink()
                return True
            return False
        except Exception as e:
            print(f"Error deleting file {relative_path}: {e}")
            return False
    
    def get_file_path(self, relative_path: str) -> Path:
        """Get full file path from relative path"""
        return self.base_dir / relative_path
    
    def file_exists(self, relative_path: str) -> bool:
        """Check if file exists"""
        return self.get_file_path(relative_path).exists()
    
    def get_file_size(self, relative_path: str) -> int:
        """Get file size in bytes"""
        file_path = self.get_file_path(relative_path)
        return file_path.stat().st_size if file_path.exists() else 0
    
    def get_url(self, relative_path: str) -> str:
        """Get URL for accessing file"""
        if not relative_path:
            return None
        
        # Clean the path
        clean_path = relative_path.lstrip('/').replace('uploads/', '', 1)
        return f"{self.url_prefix}/{clean_path}"
    
    def get_absolute_path(self, relative_path: str) -> str:
        """Get absolute filesystem path for a file"""
        if not relative_path:
            return None
        
        # Remove any leading slashes and 'uploads/' prefix
        clean_path = relative_path.lstrip('/').replace('uploads/', '', 1)
        return str(self.base_dir / clean_path)


# Global instance
storage = StorageManager()


# Backward compatibility functions
def init_storage():
    """Initialize storage (for backward compatibility)"""
    pass  # Already initialized in StorageManager.__init__

async def save_cover_image(file: UploadFile) -> str:
    """Save cover image (backward compatibility)"""
    return await storage.save_cover(file)

async def save_book_file(file: UploadFile) -> str:
    """Save book file (backward compatibility)"""
    return await storage.save_book(file)

async def save_sample_file(file: UploadFile) -> str:
    """Save sample file (backward compatibility)"""
    return await storage.save_sample(file)

async def save_image(file: UploadFile, subfolder: Optional[str] = None) -> str:
    """Save image (backward compatibility)"""
    return await storage.save_image(file, subfolder)

def delete_file(file_path: str) -> bool:
    """Delete file (backward compatibility)"""
    return storage.delete_file(file_path)

def get_file_url(relative_path: str) -> str:
    """Get file URL (backward compatibility)"""
    return storage.get_url(relative_path)

def file_exists(relative_path: str) -> bool:
    """Check if file exists (backward compatibility)"""
    return storage.file_exists(relative_path)
