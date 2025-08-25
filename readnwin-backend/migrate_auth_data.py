#!/usr/bin/env python3
"""
Migrate auth data from old database to new database
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from core.database import engine as new_engine, get_db
from models.user import User
from models.role import Role
from core.security import get_password_hash
from datetime import datetime

# Old database connection details
OLD_DB_PASSWORD = "6c8u2MsYqlbQxL5IxftjrV7QQnlLymdsmzMtTeIe4Ur1od7RR9CdODh3VfQ4ka2f"
OLD_DB_USER = "postgres"
OLD_DB_NAME = "postgres"
OLD_DB_PORT = 5432
OLD_DB_HOST = "149.102.159.118"

# Create old database connection
old_db_url = f"postgresql://{OLD_DB_USER}:{OLD_DB_PASSWORD}@{OLD_DB_HOST}:{OLD_DB_PORT}/{OLD_DB_NAME}"
old_engine = create_engine(old_db_url)
OldSession = sessionmaker(bind=old_engine)

# New database session
NewSession = sessionmaker(bind=new_engine)

def get_old_users():
    """Fetch users from old database with their roles"""
    old_session = OldSession()
    try:
        # Get users with their primary role (highest priority role)
        query = """
        SELECT DISTINCT ON (u.id) 
               u.id, u.email, u.username, u.password_hash, u.first_name, u.last_name,
               u.status, u.email_verified, u.created_at, u.updated_at, u.last_login,
               r.id as role_id, r.name as role_name
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
        LEFT JOIN roles r ON ur.role_id = r.id
        ORDER BY u.id, r.id ASC
        """
        
        result = old_session.execute(text(query))
        users = result.fetchall()
        print(f"✅ Found {len(users)} users with roles")
        return users, result.keys()
        
    except Exception as e:
        print(f"❌ Error fetching users: {e}")
        return [], []
    finally:
        old_session.close()

def get_old_roles():
    """Fetch roles from old database"""
    old_session = OldSession()
    try:
        queries = [
            """
            SELECT id, name, display_name, description, priority
            FROM roles
            """,
            """
            SELECT id, name, description
            FROM roles
            """,
            """
            SELECT id, name
            FROM role
            """,
        ]
        
        for query in queries:
            try:
                result = old_session.execute(text(query))
                roles = result.fetchall()
                print(f"✅ Found {len(roles)} roles using query: {query[:50]}...")
                return roles, result.keys()
            except Exception as e:
                print(f"❌ Role query failed: {str(e)[:100]}...")
                continue
        
        print("❌ No roles table found")
        return [], []
        
    except Exception as e:
        print(f"❌ Error fetching roles: {e}")
        return [], []
    finally:
        old_session.close()

def migrate_roles(old_roles, old_columns):
    """Migrate roles to new database"""
    new_session = NewSession()
    migrated_count = 0
    
    try:
        for old_role in old_roles:
            role_dict = dict(zip(old_columns, old_role))
            
            # Check if role already exists
            existing_role = new_session.query(Role).filter(Role.name == role_dict.get('name')).first()
            if existing_role:
                print(f"⚠️  Role '{role_dict.get('name')}' already exists, skipping...")
                continue
            
            # Create new role
            new_role = Role(
                name=role_dict.get('name'),
                display_name=role_dict.get('display_name', role_dict.get('name', '').title()),
                description=role_dict.get('description', f"Migrated role: {role_dict.get('name')}"),
                priority=role_dict.get('priority', 10)
            )
            
            new_session.add(new_role)
            migrated_count += 1
            print(f"✅ Migrated role: {role_dict.get('name')}")
        
        new_session.commit()
        print(f"🎉 Successfully migrated {migrated_count} roles")
        
    except Exception as e:
        print(f"❌ Error migrating roles: {e}")
        new_session.rollback()
    finally:
        new_session.close()

def migrate_users(old_users, old_columns):
    """Migrate users to new database"""
    new_session = NewSession()
    migrated_count = 0
    
    try:
        # Get role mapping from new database
        new_roles = {role.name: role.id for role in new_session.query(Role).all()}
        default_role_id = new_roles.get('user') or new_roles.get('reader')  # Default to 'user' or 'reader' role
        
        for old_user in old_users:
            user_dict = dict(zip(old_columns, old_user))
            
            # Check if user already exists
            existing_user = new_session.query(User).filter(User.email == user_dict.get('email')).first()
            if existing_user:
                print(f"⚠️  User '{user_dict.get('email')}' already exists, skipping...")
                continue
            
            # Handle password hash
            password_hash = user_dict.get('password_hash')
            if not password_hash:
                # Generate a temporary password hash if none exists
                password_hash = get_password_hash('temp_password_123')
                print(f"⚠️  No password found for {user_dict.get('email')}, using temporary password")
            
            # Map role from old database to new database
            old_role_name = user_dict.get('role_name')
            role_id = default_role_id
            if old_role_name and old_role_name in new_roles:
                role_id = new_roles[old_role_name]
            elif old_role_name:
                print(f"⚠️  Role '{old_role_name}' not found in new database, using default role")
            
            # Convert status to is_active (active = True, inactive/banned = False)
            is_active = user_dict.get('status', 'active').lower() == 'active'
            
            # Create new user
            new_user = User(
                email=user_dict.get('email'),
                username=user_dict.get('username') or user_dict.get('email').split('@')[0],
                password_hash=password_hash,
                first_name=user_dict.get('first_name'),
                last_name=user_dict.get('last_name'),
                is_active=is_active,
                role_id=role_id,
                last_login=user_dict.get('last_login')
            )
            
            # Set created_at manually after creation if provided
            if user_dict.get('created_at'):
                new_user.created_at = user_dict.get('created_at')
            
            new_session.add(new_user)
            migrated_count += 1
            role_name = old_role_name or 'default'
            print(f"✅ Migrated user: {user_dict.get('email')} (role: {role_name})")
        
        new_session.commit()
        print(f"🎉 Successfully migrated {migrated_count} users")
        
    except Exception as e:
        print(f"❌ Error migrating users: {e}")
        new_session.rollback()
    finally:
        new_session.close()

def test_connections():
    """Test both database connections"""
    print("🔍 Testing database connections...")
    
    # Test old database
    try:
        old_session = OldSession()
        old_session.execute(text("SELECT 1"))
        old_session.close()
        print("✅ Old database connection successful")
    except Exception as e:
        print(f"❌ Old database connection failed: {e}")
        return False
    
    # Test new database
    try:
        new_session = NewSession()
        new_session.execute(text("SELECT 1"))
        new_session.close()
        print("✅ New database connection successful")
    except Exception as e:
        print(f"❌ New database connection failed: {e}")
        return False
    
    return True

def list_old_tables():
    """List all tables in old database"""
    old_session = OldSession()
    try:
        result = old_session.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """))
        tables = [row[0] for row in result.fetchall()]
        print(f"📋 Tables in old database: {', '.join(tables)}")
        return tables
    except Exception as e:
        print(f"❌ Error listing tables: {e}")
        return []
    finally:
        old_session.close()

def main():
    """Main migration function"""
    print("🚀 Starting auth data migration...")
    
    # Test connections
    if not test_connections():
        print("❌ Database connection test failed. Exiting...")
        return
    
    # List tables in old database
    tables = list_old_tables()
    
    # Migrate roles first
    print("\n📋 Migrating roles...")
    old_roles, role_columns = get_old_roles()
    if old_roles:
        migrate_roles(old_roles, role_columns)
    else:
        print("⚠️  No roles found to migrate")
    
    # Migrate users
    print("\n👥 Migrating users...")
    old_users, user_columns = get_old_users()
    if old_users:
        migrate_users(old_users, user_columns)
    else:
        print("⚠️  No users found to migrate")
    
    print("\n🎉 Migration completed!")

if __name__ == "__main__":
    main()