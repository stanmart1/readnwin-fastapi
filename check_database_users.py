#!/usr/bin/env python3
"""
Database inspection script to check users in the database
"""

import sys
import os
sys.path.append('readnwin-backend')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from core.config import settings
from models.user import User
from models.role import Role

def check_database_users():
    """Check users in the database"""
    try:
        # Create database connection
        engine = create_engine(settings.database_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()

        print("🔗 Connected to database successfully")
        print(f"📊 Database URL: {settings.database_url.replace(settings.db_password, '***')}")
        print("=" * 60)

        # Check if users table exists
        try:
            result = db.execute(text("SELECT COUNT(*) FROM users"))
            total_users = result.scalar()
            print(f"👥 Total users in database: {total_users}")
        except Exception as e:
            print(f"❌ Error accessing users table: {e}")
            print("🔍 Checking if users table exists...")

            # Check table existence
            result = db.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name LIKE '%user%'
            """))
            tables = result.fetchall()
            print(f"📋 User-related tables found: {[t[0] for t in tables]}")
            return

        # Get all users with basic info
        if total_users > 0:
            print("\n👤 Users in database:")
            print("-" * 60)

            users = db.query(User).all()
            for i, user in enumerate(users, 1):
                print(f"{i}. ID: {user.id}")
                print(f"   Email: {user.email}")
                print(f"   Username: {user.username}")
                print(f"   Name: {user.first_name} {user.last_name}")
                print(f"   Active: {user.is_active}")
                print(f"   Email Verified: {user.is_email_verified}")
                print(f"   Role ID: {user.role_id}")
                print(f"   Created: {user.created_at}")
                print(f"   Last Login: {user.last_login}")

                # Get role info
                if user.role_id:
                    role = db.query(Role).filter(Role.id == user.role_id).first()
                    if role:
                        print(f"   Role: {role.display_name} ({role.name})")
                print()
        else:
            print("\n⚠️  No users found in database")
            print("🔍 This might explain why the admin users endpoint returns empty results")

        # Check roles table
        print("\n🏷️  Roles in database:")
        print("-" * 60)
        try:
            roles = db.query(Role).all()
            if roles:
                for role in roles:
                    print(f"- ID: {role.id}, Name: {role.name}, Display: {role.display_name}")
            else:
                print("⚠️  No roles found in database")
        except Exception as e:
            print(f"❌ Error accessing roles table: {e}")

        # Check if admin user exists
        print("\n🔐 Checking for admin users:")
        print("-" * 60)
        try:
            admin_users = db.query(User).join(Role).filter(
                Role.name.in_(['admin', 'super_admin'])
            ).all()

            if admin_users:
                for admin in admin_users:
                    print(f"✅ Admin found: {admin.email} (Role: {admin.role.name})")
            else:
                print("⚠️  No admin users found")

                # Check for users with admin email pattern
                admin_emails = db.query(User).filter(
                    User.email.like('%admin%')
                ).all()

                if admin_emails:
                    print("🔍 Users with 'admin' in email:")
                    for user in admin_emails:
                        print(f"   - {user.email} (Role ID: {user.role_id})")

        except Exception as e:
            print(f"❌ Error checking admin users: {e}")

        # Database schema info
        print("\n📋 Database Schema Info:")
        print("-" * 60)
        try:
            # Check table structure
            result = db.execute(text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'users'
                ORDER BY ordinal_position
            """))
            columns = result.fetchall()

            print("Users table columns:")
            for col in columns:
                print(f"   - {col[0]}: {col[1]} (nullable: {col[2]})")

        except Exception as e:
            print(f"❌ Error checking schema: {e}")

        db.close()
        print("\n✅ Database inspection complete")

    except Exception as e:
        print(f"❌ Database connection error: {e}")
        print("🔧 Please check your database configuration in .env file")

if __name__ == "__main__":
    print("🔍 ReadnWin Database User Inspection")
    print("=" * 60)
    check_database_users()
