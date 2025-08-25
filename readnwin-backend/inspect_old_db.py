#!/usr/bin/env python3
"""
Inspect the structure of the old database users table
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

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

def inspect_users_table():
    """Inspect the users table structure"""
    old_session = OldSession()
    try:
        # Get column information
        result = old_session.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        """))
        
        columns = result.fetchall()
        print("📋 Users table structure:")
        for col in columns:
            print(f"  - {col[0]}: {col[1]} (nullable: {col[2]}, default: {col[3]})")
        
        # Get sample data
        print("\n📊 Sample users data:")
        result = old_session.execute(text("SELECT * FROM users LIMIT 3"))
        sample_users = result.fetchall()
        column_names = result.keys()
        
        for i, user in enumerate(sample_users):
            print(f"\nUser {i+1}:")
            for j, col_name in enumerate(column_names):
                print(f"  {col_name}: {user[j]}")
        
        return column_names
        
    except Exception as e:
        print(f"❌ Error inspecting users table: {e}")
        return []
    finally:
        old_session.close()

def inspect_roles_table():
    """Inspect the roles table structure"""
    old_session = OldSession()
    try:
        # Get all roles
        result = old_session.execute(text("SELECT * FROM roles"))
        roles = result.fetchall()
        column_names = result.keys()
        
        print("\n📋 All roles in old database:")
        for role in roles:
            role_dict = dict(zip(column_names, role))
            print(f"  - ID: {role_dict.get('id')}, Name: {role_dict.get('name')}, Display: {role_dict.get('display_name')}")
        
    except Exception as e:
        print(f"❌ Error inspecting roles table: {e}")
    finally:
        old_session.close()

def main():
    print("🔍 Inspecting old database structure...")
    user_columns = inspect_users_table()
    inspect_roles_table()
    
    if user_columns:
        print(f"\n✅ Found {len(user_columns)} columns in users table")
    else:
        print("\n❌ Could not inspect users table")

if __name__ == "__main__":
    main()