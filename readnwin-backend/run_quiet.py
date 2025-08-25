#!/usr/bin/env python3
"""
Start the server with filtered logging to reduce 401 noise
"""
import uvicorn
import logging
import sys
import re

class FilteredAccessLogger(logging.Logger):
    """Custom logger that filters out noisy 401 errors"""
    
    def info(self, message, *args, **kwargs):
        # Filter out 401 errors for notification stats
        if isinstance(message, str) and "401 Unauthorized" in message and "/admin/notifications/stats" in message:
            return
        super().info(message, *args, **kwargs)

# Replace the uvicorn access logger
logging.setLoggerClass(FilteredAccessLogger)
access_logger = logging.getLogger("uvicorn.access")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1", 
        port=9000,
        reload=True,
        log_level="info"
    )