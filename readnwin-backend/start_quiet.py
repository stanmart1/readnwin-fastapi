#!/usr/bin/env python3
"""
Start the FastAPI server with reduced logging for 401 errors
"""
import uvicorn
import logging
import sys
from logging_config import CustomAccessFormatter

class QuietUvicornServer:
    def __init__(self):
        # Configure logging to reduce 401 noise
        self.setup_quiet_logging()
    
    def setup_quiet_logging(self):
        """Setup logging to filter out noisy 401 errors"""
        # Get uvicorn access logger
        access_logger = logging.getLogger("uvicorn.access")
        
        # Create custom handler that filters 401 errors for notification stats
        class FilteredHandler(logging.StreamHandler):
            def emit(self, record):
                # Filter out 401 errors for notification stats endpoint
                if hasattr(record, 'getMessage'):
                    message = record.getMessage()
                    if "401 Unauthorized" in message and "/admin/notifications/stats" in message:
                        return  # Don't log this
                super().emit(record)
        
        # Remove existing handlers and add filtered one
        for handler in access_logger.handlers[:]:
            access_logger.removeHandler(handler)
        
        filtered_handler = FilteredHandler(sys.stdout)
        filtered_handler.setFormatter(CustomAccessFormatter())
        access_logger.addHandler(filtered_handler)
        access_logger.setLevel(logging.INFO)
    
    def run(self):
        """Start the server"""
        uvicorn.run(
            "main:app",
            host="127.0.0.1",
            port=9000,
            reload=True,
            log_level="info"
        )

if __name__ == "__main__":
    server = QuietUvicornServer()
    server.run()