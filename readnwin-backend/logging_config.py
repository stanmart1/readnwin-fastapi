import logging
import uvicorn
from uvicorn.logging import DefaultFormatter

class CustomAccessFormatter(DefaultFormatter):
    """Custom formatter to reduce noise from frequent admin endpoints"""
    
    def format(self, record):
        # Skip logging for notification stats and authors endpoints
        if hasattr(record, 'args') and len(record.args) >= 2:
            path = record.args[1] if len(record.args) > 1 else ""
            
            # Suppress logs for these endpoints
            if any(endpoint in str(path) for endpoint in [
                "/admin/notifications/stats",
                "/admin/authors"
            ]):
                return ""  # Don't log these
        
        return super().format(record)

def setup_logging():
    """Setup custom logging configuration"""
    # Configure uvicorn access logger
    access_logger = logging.getLogger("uvicorn.access")
    
    # Remove existing handlers
    for handler in access_logger.handlers[:]:
        access_logger.removeHandler(handler)
    
    # Add custom handler with our formatter
    handler = logging.StreamHandler()
    handler.setFormatter(CustomAccessFormatter())
    access_logger.addHandler(handler)
    access_logger.setLevel(logging.WARNING)  # Reduce log level to WARNING
    
    return access_logger