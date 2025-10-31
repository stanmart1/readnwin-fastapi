"""Path validation to prevent path traversal attacks"""
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def validate_path(base_dir: str, requested_path: str, allow_absolute: bool = False) -> Optional[Path]:
    """Validate that requested path is within base directory
    
    Args:
        base_dir: Base directory that files must be within
        requested_path: User-provided path to validate
        allow_absolute: Whether to allow absolute paths (default: False)
    
    Returns:
        Resolved Path object if valid, None if invalid
    
    Example:
        >>> validate_path('/var/uploads', 'user/file.txt')
        Path('/var/uploads/user/file.txt')
        
        >>> validate_path('/var/uploads', '../etc/passwd')
        None
    """
    try:
        # Reject absolute paths unless explicitly allowed
        if not allow_absolute and Path(requested_path).is_absolute():
            logger.warning(f"Absolute path not allowed: {requested_path}")
            return None
        
        # Resolve base directory
        base = Path(base_dir).resolve()
        
        # Resolve target path relative to base
        if Path(requested_path).is_absolute():
            target = Path(requested_path).resolve()
        else:
            target = (base / requested_path).resolve()
        
        # Ensure target is within base directory
        if not str(target).startswith(str(base)):
            logger.warning(f"Path traversal attempt: {requested_path} -> {target}")
            return None
        
        return target
        
    except (ValueError, OSError) as e:
        logger.error(f"Path validation error: {e}")
        return None


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal
    
    Args:
        filename: Original filename
    
    Returns:
        Sanitized filename with dangerous characters removed
    """
    # Remove path separators and parent directory references
    filename = filename.replace('..', '').replace('/', '').replace('\\', '')
    
    # Remove null bytes
    filename = filename.replace('\x00', '')
    
    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:250] + ('.' + ext if ext else '')
    
    return filename
