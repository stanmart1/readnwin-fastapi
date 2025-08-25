#!/usr/bin/env python3
"""
Migration script to add missing fields to roles and permissions tables
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from core.database import engine

def migrate_roles():
    """Add missing fields to roles and permissions tables"""
    try:
        with engine.connect() as connection:
            trans = connection.begin()
            
            try:
                # Add missing columns to roles table
                print("Adding is_system_role column to roles...")
                connection.execute(text("ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system_role BOOLEAN DEFAULT FALSE"))
                
                print("Adding created_at column to roles...")
                connection.execute(text("ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"))
                
                # Add missing columns to permissions table
                print("Adding action column to permissions...")
                connection.execute(text("ALTER TABLE permissions ADD COLUMN IF NOT EXISTS action VARCHAR DEFAULT '*'"))
                
                print("Adding scope column to permissions...")
                connection.execute(text("ALTER TABLE permissions ADD COLUMN IF NOT EXISTS scope VARCHAR DEFAULT '*'"))
                
                print("Adding created_at column to permissions...")
                connection.execute(text("ALTER TABLE permissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"))
                
                # Add created_at to role_permissions table
                print("Adding created_at column to role_permissions...")
                connection.execute(text("ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"))
                
                # Update existing records with default values
                print("Updating existing records...")
                connection.execute(text("UPDATE roles SET is_system_role = FALSE WHERE is_system_role IS NULL"))
                connection.execute(text("UPDATE roles SET created_at = NOW() WHERE created_at IS NULL"))
                connection.execute(text("UPDATE permissions SET action = '*' WHERE action IS NULL"))
                connection.execute(text("UPDATE permissions SET scope = '*' WHERE scope IS NULL"))
                connection.execute(text("UPDATE permissions SET created_at = NOW() WHERE created_at IS NULL"))
                connection.execute(text("UPDATE role_permissions SET created_at = NOW() WHERE created_at IS NULL"))
                
                # Mark system roles
                print("Marking system roles...")
                connection.execute(text("UPDATE roles SET is_system_role = TRUE WHERE name IN ('super_admin', 'admin', 'reader')"))
                
                trans.commit()
                print("✅ Role migration completed successfully!")
                
            except Exception as e:
                trans.rollback()
                print(f"❌ Migration failed: {e}")
                raise
                
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate_roles()