"""
Secure path validation utilities
"""
from pathlib import Path
import os

def validate_path(base_dir: str, file_path: str) -> Path:
    """
    Validate and resolve file path securely to prevent path traversal attacks
    
    Args:
        base_dir: Base directory to restrict access to
        file_path: Relative file path to validate
    
    Returns:
        Resolved Path object if valid, None if invalid
    """
    try:
        # Convert to Path objects
        base = Path(base_dir).resolve()
        
        # Clean the file path - remove any directory traversal attempts
        clean_path = file_path.replace('..', '').replace('//', '/').strip('/')
        
        # Join with base directory
        full_path = (base / clean_path).resolve()
        
        # Ensure the resolved path is within the base directory
        if not str(full_path).startswith(str(base)):
            return None
        
        return full_path
    except Exception:
        return None

def is_safe_filename(filename: str) -> bool:
    """
    Check if filename is safe (no path traversal, special chars, etc.)
    """
    if not filename or filename in ('.', '..'):
        return False
    
    # Check for path traversal attempts
    if '..' in filename or '/' in filename or '\\' in filename:
        return False
    
    # Check for null bytes
    if '\x00' in filename:
        return False
    
    # Check for control characters
    if any(ord(c) < 32 for c in filename):
        return False
    
    return True

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename by removing dangerous characters
    """
    if not filename:
        return ""
    
    # Remove path separators and dangerous characters
    sanitized = filename.replace('..', '').replace('/', '').replace('\\', '')
    sanitized = sanitized.replace('\x00', '')
    
    # Remove control characters
    sanitized = ''.join(c for c in sanitized if ord(c) >= 32)
    
    return sanitized.strip()