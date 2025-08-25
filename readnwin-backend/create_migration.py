#!/usr/bin/env python3
"""
Create a new Alembic migration for security models
"""

import os
import subprocess
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_migration():
    """Create a new migration for security models"""
    try:
        print("🔄 Creating migration for security models...")
        
        # Run alembic revision command
        result = subprocess.run([
            "alembic", "revision", "--autogenerate", 
            "-m", "Add security models (token_blacklist, security_log)"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Migration created successfully")
            print(result.stdout)
        else:
            print("❌ Migration creation failed")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Error creating migration: {e}")
        return False
    
    return True

def run_migration():
    """Run pending migrations"""
    try:
        print("🔄 Running migrations...")
        
        result = subprocess.run([
            "alembic", "upgrade", "head"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Migrations completed successfully")
            print(result.stdout)
        else:
            print("❌ Migration failed")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Error running migration: {e}")
        return False
    
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "run":
        run_migration()
    else:
        create_migration()