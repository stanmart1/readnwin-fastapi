#!/usr/bin/env python3
"""
Comprehensive Database Review Script for ReadnWin
This script will review the entire database and list all users with their details
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from core.database import get_db, engine, Base
from models.user import User
from models.role import Role, Permission, RolePermission
from datetime import datetime
import json

def print_separator(title):
    """Print a formatted separator with title"""
    print("\n" + "=" * 80)
    print(f" {title} ".center(80, "="))
    print("=" * 80)

def print_subsection(title):
    """Print a formatted subsection header"""
    print(f"\n{'-' * 60}")
    print(f" {title} ")
    print(f"{'-' * 60}")

def check_database_connection():
    """Check if database connection is working"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            return True, "Database connection successful"
    except Exception as e:
        return False, f"Database connection failed: {str(e)}"

def get_database_info():
    """Get basic database information"""
    try:
        with engine.connect() as conn:
            # Get database version
            try:
                version_result = conn.execute(text("SELECT version()"))
                db_version = version_result.fetchone()[0]
            except:
                db_version = "Unknown"

            # Get current database name
            try:
                db_name_result = conn.execute(text("SELECT current_database()"))
                db_name = db_name_result.fetchone()[0]
            except:
                db_name = "Unknown"

            return {
                "database_url": str(engine.url).replace(str(engine.url.password), "***") if engine.url.password else str(engine.url),
                "database_name": db_name,
                "database_version": db_version,
                "connection_pool_size": engine.pool.size() if hasattr(engine.pool, 'size') else "Unknown"
            }
    except Exception as e:
        return {"error": str(e)}

def get_table_info():
    """Get information about all tables in the database"""
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        table_info = {}
        with engine.connect() as conn:
            for table in tables:
                try:
                    # Get row count
                    count_result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    row_count = count_result.fetchone()[0]

                    # Get column info
                    columns = inspector.get_columns(table)
                    column_names = [col['name'] for col in columns]

                    table_info[table] = {
                        "row_count": row_count,
                        "columns": column_names,
                        "column_count": len(column_names)
                    }
                except Exception as e:
                    table_info[table] = {"error": str(e)}

        return table_info
    except Exception as e:
        return {"error": str(e)}

def get_all_users():
    """Get all users from the database with detailed information"""
    db = next(get_db())
    try:
        users = db.query(User).all()
        user_list = []

        for user in users:
            user_data = {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_active": user.is_active,
                "is_email_verified": user.is_email_verified,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "role_id": user.role_id,
                "role_name": user.role.name if user.role else None,
                "role_display_name": user.role.display_name if user.role else None,
                "has_verification_token": bool(user.verification_token),
                "verification_token_expires": user.verification_token_expires.isoformat() if user.verification_token_expires else None
            }
            user_list.append(user_data)

        return user_list
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

def get_all_roles():
    """Get all roles and their permissions"""
    db = next(get_db())
    try:
        roles = db.query(Role).all()
        role_list = []

        for role in roles:
            # Get permissions for this role
            permissions = []
            if hasattr(role, 'permissions') and role.permissions:
                permissions = [perm.permission.name for perm in role.permissions if perm.permission]

            role_data = {
                "id": role.id,
                "name": role.name,
                "display_name": role.display_name,
                "description": getattr(role, 'description', None),
                "priority": getattr(role, 'priority', None),
                "permissions": permissions,
                "user_count": len(role.users) if hasattr(role, 'users') and role.users else 0
            }
            role_list.append(role_data)

        return role_list
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

def get_user_statistics():
    """Get various user statistics"""
    db = next(get_db())
    try:
        stats = {}

        # Total users
        stats["total_users"] = db.query(User).count()

        # Active users
        stats["active_users"] = db.query(User).filter(User.is_active == True).count()

        # Verified users
        stats["verified_users"] = db.query(User).filter(User.is_email_verified == True).count()

        # Users by role
        role_stats = {}
        roles = db.query(Role).all()
        for role in roles:
            role_stats[role.name] = db.query(User).filter(User.role_id == role.id).count()
        stats["users_by_role"] = role_stats

        # Recent registrations (last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.now() - timedelta(days=30)
        stats["recent_registrations"] = db.query(User).filter(User.created_at >= thirty_days_ago).count()

        # Users with recent login (last 30 days)
        stats["recent_logins"] = db.query(User).filter(User.last_login >= thirty_days_ago).count()

        return stats
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

def check_admin_users():
    """Check for admin users and their status"""
    db = next(get_db())
    try:
        admin_roles = db.query(Role).filter(Role.name.in_(["admin", "super_admin"])).all()
        admin_role_ids = [role.id for role in admin_roles]

        admin_users = db.query(User).filter(User.role_id.in_(admin_role_ids)).all()

        admin_list = []
        for admin in admin_users:
            admin_data = {
                "id": admin.id,
                "email": admin.email,
                "username": admin.username,
                "role": admin.role.name if admin.role else None,
                "is_active": admin.is_active,
                "is_verified": admin.is_email_verified,
                "last_login": admin.last_login.isoformat() if admin.last_login else "Never",
                "created_at": admin.created_at.isoformat() if admin.created_at else None
            }
            admin_list.append(admin_data)

        return admin_list
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

def main():
    """Main function to run comprehensive database review"""
    print_separator("ReadnWin Database Comprehensive Review")
    print(f"Review conducted at: {datetime.now().isoformat()}")

    # Check database connection
    print_subsection("Database Connection Status")
    is_connected, connection_msg = check_database_connection()
    if is_connected:
        print("✅ " + connection_msg)
    else:
        print("❌ " + connection_msg)
        print("Cannot proceed with database review. Please check your database configuration.")
        return

    # Database information
    print_subsection("Database Information")
    db_info = get_database_info()
    if "error" in db_info:
        print(f"❌ Error getting database info: {db_info['error']}")
    else:
        print(f"📊 Database URL: {db_info.get('database_url', 'Unknown')}")
        print(f"🏷️  Database Name: {db_info.get('database_name', 'Unknown')}")
        print(f"🔧 Database Version: {db_info.get('database_version', 'Unknown')}")
        print(f"🔗 Connection Pool Size: {db_info.get('connection_pool_size', 'Unknown')}")

    # Table information
    print_subsection("Table Information")
    table_info = get_table_info()
    if "error" in table_info:
        print(f"❌ Error getting table info: {table_info['error']}")
    else:
        print(f"📋 Total Tables: {len(table_info)}")
        for table, info in table_info.items():
            if "error" in info:
                print(f"   ❌ {table}: Error - {info['error']}")
            else:
                print(f"   📄 {table}: {info['row_count']} rows, {info['column_count']} columns")

    # User statistics
    print_subsection("User Statistics")
    stats = get_user_statistics()
    if "error" in stats:
        print(f"❌ Error getting user statistics: {stats['error']}")
    else:
        print(f"👥 Total Users: {stats.get('total_users', 0)}")
        print(f"✅ Active Users: {stats.get('active_users', 0)}")
        print(f"📧 Verified Users: {stats.get('verified_users', 0)}")
        print(f"🆕 Recent Registrations (30 days): {stats.get('recent_registrations', 0)}")
        print(f"🔄 Recent Logins (30 days): {stats.get('recent_logins', 0)}")

        print("\n   Users by Role:")
        for role, count in stats.get('users_by_role', {}).items():
            print(f"      🏷️  {role}: {count} users")

    # All roles
    print_subsection("All Roles")
    roles = get_all_roles()
    if "error" in roles:
        print(f"❌ Error getting roles: {roles['error']}")
    else:
        if not roles:
            print("⚠️  No roles found in database")
        else:
            for role in roles:
                print(f"🏷️  Role: {role['name']} ({role['display_name']})")
                print(f"      ID: {role['id']}")
                print(f"      Description: {role.get('description', 'No description')}")
                print(f"      Priority: {role.get('priority', 'No priority')}")
                print(f"      Users: {role.get('user_count', 0)}")
                print(f"      Permissions: {', '.join(role.get('permissions', [])) or 'No permissions'}")
                print()

    # Admin users
    print_subsection("Administrator Users")
    admin_users = check_admin_users()
    if "error" in admin_users:
        print(f"❌ Error getting admin users: {admin_users['error']}")
    else:
        if not admin_users:
            print("⚠️  No administrator users found!")
            print("🔧 You may need to create an admin user using create_admin_user.py")
        else:
            for admin in admin_users:
                status_icon = "✅" if admin['is_active'] and admin['is_verified'] else "⚠️"
                print(f"{status_icon} {admin['email']} (@{admin['username']})")
                print(f"      Role: {admin['role']}")
                print(f"      Active: {admin['is_active']}")
                print(f"      Verified: {admin['is_verified']}")
                print(f"      Last Login: {admin['last_login']}")
                print(f"      Created: {admin['created_at']}")
                print()

    # All users detailed
    print_subsection("All Users (Detailed)")
    users = get_all_users()
    if "error" in users:
        print(f"❌ Error getting users: {users['error']}")
    else:
        if not users:
            print("⚠️  No users found in database")
            print("🔧 You may need to create users for testing")
        else:
            print(f"Found {len(users)} users:")
            print()

            for user in users:
                # Status icons
                active_icon = "✅" if user['is_active'] else "❌"
                verified_icon = "📧" if user['is_email_verified'] else "❌"
                role_icon = "🏷️" if user['role_name'] else "⚠️"

                print(f"👤 User ID: {user['id']}")
                print(f"   📧 Email: {user['email']}")
                print(f"   👤 Username: {user['username']}")
                print(f"   📝 Name: {user.get('first_name', '')} {user.get('last_name', '')}")
                print(f"   {active_icon} Active: {user['is_active']}")
                print(f"   {verified_icon} Verified: {user['is_email_verified']}")
                print(f"   {role_icon} Role: {user.get('role_name', 'No role')} ({user.get('role_display_name', 'N/A')})")
                print(f"   📅 Created: {user.get('created_at', 'Unknown')}")
                print(f"   🔄 Last Login: {user.get('last_login', 'Never')}")
                print(f"   🔐 Has Verification Token: {user.get('has_verification_token', False)}")
                if user.get('verification_token_expires'):
                    print(f"   ⏰ Token Expires: {user['verification_token_expires']}")
                print()

    print_separator("Database Review Complete")
    print("📋 Summary:")
    print(f"   • Total Users: {stats.get('total_users', 0) if isinstance(stats, dict) else 'Unknown'}")
    print(f"   • Active Users: {stats.get('active_users', 0) if isinstance(stats, dict) else 'Unknown'}")
    print(f"   • Admin Users: {len(admin_users) if isinstance(admin_users, list) else 'Unknown'}")
    print(f"   • Total Tables: {len(table_info) if isinstance(table_info, dict) else 'Unknown'}")

    if isinstance(users, list) and len(users) == 0:
        print("\n⚠️  IMPORTANT: No users found!")
        print("🔧 To create test users, run:")
        print("   python create_admin_user.py")
        print("   python create_superadmin.py")

    if isinstance(admin_users, list) and len(admin_users) == 0:
        print("\n⚠️  IMPORTANT: No admin users found!")
        print("🔧 To create an admin user, run:")
        print("   python create_admin_user.py")

if __name__ == "__main__":
    main()
