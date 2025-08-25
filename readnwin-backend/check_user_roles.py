#!/usr/bin/env python3
"""
Check user roles relationship in old database
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

def check_user_roles():
    """Check user roles relationship"""
    old_session = OldSession()
    try:
        # Check user_roles table structure
        result = old_session.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_roles' 
            ORDER BY ordinal_position
        """))
        
        columns = result.fetchall()
        print("📋 User_roles table structure:")
        for col in columns:
            print(f"  - {col[0]}: {col[1]}")
        
        # Get sample user roles data
        print("\n📊 Sample user_roles data:")
        result = old_session.execute(text("SELECT * FROM user_roles LIMIT 10"))
        user_roles = result.fetchall()
        column_names = result.keys()
        
        for i, ur in enumerate(user_roles):
            ur_dict = dict(zip(column_names, ur))
            print(f"  User {ur_dict.get('user_id')} -> Role {ur_dict.get('role_id')}")
        
        # Get user count by role
        print("\n📊 Users by role:")
        result = old_session.execute(text("""
            SELECT r.name, r.display_name, COUNT(ur.user_id) as user_count
            FROM roles r
            LEFT JOIN user_roles ur ON r.id = ur.role_id
            GROUP BY r.id, r.name, r.display_name
            ORDER BY user_count DESC
        """))
        
        role_counts = result.fetchall()
        for role in role_counts:
            print(f"  - {role[1]} ({role[0]}): {role[2]} users")
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking user roles: {e}")
        return False
    finally:
        old_session.close()

def main():
    print("🔍 Checking user roles relationship...")
    check_user_roles()

if __name__ == "__main__":
    main()