#!/usr/bin/env python3
"""
Standalone script for token cleanup - Can be run via system cron
Usage: python cron_cleanup_tokens.py
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.token_cleanup_service import cleanup_expired_tokens

if __name__ == "__main__":
    print("Starting token cleanup...")
    result = cleanup_expired_tokens()
    
    if result["success"]:
        print(f"✅ Success: Deleted {result['deleted_count']} expired tokens")
        sys.exit(0)
    else:
        print(f"❌ Failed: {result['error']}")
        sys.exit(1)
