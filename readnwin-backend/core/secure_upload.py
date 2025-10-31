"""Secure file upload handling with validation"""
import os
import hashlib
from pathlib import Path
from typing import Tuple, Set
from werkzeug.utils import secure_filename

# Allowed file extensions by category
ALLOWED_EXTENSIONS = {
    'image': {'jpg', 'jpeg', 'png', 'gif', 'webp'},
    'ebook': {'epub', 'pdf', 'mobi'},
    'document': {'pdf', 'doc', 'docx'},
    'proof': {'jpg', 'jpeg', 'png', 'pdf'}
}

# Allowed MIME types
ALLOWED_MIMETYPES = {
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/epub+zip', 'application/pdf',
    'application/x-mobipocket-ebook'
}

# Maximum file size (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024


def validate_file(file_content: bytes, filename: str, file_type: str) -> Tuple[bool, str]:
    """Validate file by content and extension
    
    Args:
        file_content: File content as bytes
        filename: Original filename
        file_type: Type category (image, ebook, document, proof)
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check file size
    if len(file_content) > MAX_FILE_SIZE:
        return False, f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
    
    # Validate extension
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    allowed_exts = ALLOWED_EXTENSIONS.get(file_type, set())
    
    if ext not in allowed_exts:
        return False, f"Invalid file extension: .{ext}. Allowed: {', '.join(allowed_exts)}"
    
    # Basic content validation (check magic bytes)
    if not _validate_file_content(file_content, ext):
        return False, f"File content doesn't match extension .{ext}"
    
    return True, "Valid"


def _validate_file_content(content: bytes, ext: str) -> bool:
    """Validate file content matches extension using magic bytes"""
    if len(content) < 4:
        return False
    
    # Check magic bytes for common formats
    magic_bytes = {
        'jpg': [b'\xFF\xD8\xFF'],
        'jpeg': [b'\xFF\xD8\xFF'],
        'png': [b'\x89PNG'],
        'gif': [b'GIF87a', b'GIF89a'],
        'pdf': [b'%PDF'],
        'epub': [b'PK\x03\x04'],  # EPUB is a ZIP file
    }
    
    if ext in magic_bytes:
        return any(content.startswith(magic) for magic in magic_bytes[ext])
    
    return True  # Allow if no magic byte check defined


def secure_save_file(file_content: bytes, filename: str, upload_dir: str) -> str:
    """Securely save file with sanitized name
    
    Args:
        file_content: File content as bytes
        filename: Original filename
        upload_dir: Directory to save file
    
    Returns:
        Absolute path to saved file
    
    Raises:
        ValueError: If path validation fails
    """
    # Sanitize filename
    safe_name = secure_filename(filename)
    if not safe_name:
        raise ValueError("Invalid filename")
    
    # Generate unique filename with hash
    hash_suffix = hashlib.sha256(file_content).hexdigest()[:8]
    name, ext = os.path.splitext(safe_name)
    unique_name = f"{name}_{hash_suffix}{ext}"
    
    # Ensure upload directory is safe
    upload_path = Path(upload_dir).resolve()
    file_path = (upload_path / unique_name).resolve()
    
    # Prevent path traversal
    if not str(file_path).startswith(str(upload_path)):
        raise ValueError("Invalid file path - path traversal detected")
    
    # Create directory if it doesn't exist
    upload_path.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_path.write_bytes(file_content)
    
    return str(file_path)


def get_file_hash(file_content: bytes) -> str:
    """Get SHA256 hash of file content"""
    return hashlib.sha256(file_content).hexdigest()
