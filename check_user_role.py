#!/usr/bin/env python3

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from decouple import config

# Load environment variables
DB_USER = config('DB_USER', default='postgres')
DB_PASSWORD = config('DB_PASSWORD', default='')
DB_HOST = config('DB_HOST', default='149.102.159.118')
DB_PORT = config('DB_PORT', default=9876, cast=int)
DB_NAME = config('DB_NAME', default='postgres')

# Create database URL
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def check_user_role():
    try:
        # Create engine and session
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Query to find Stanley Martin's role
        query = text("""
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.username,
                u.email,
                r.name as role_name,
                r.display_name as role_display_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE (u.first_name ILIKE '%Stanley%' AND u.last_name ILIKE '%Martin%')
               OR u.username ILIKE '%Stanley%Martin%'
               OR u.email ILIKE '%stanley%martin%'
        """)
        
        result = session.execute(query).fetchall()
        
        if result:
            print(f"Found {len(result)} user(s) matching 'Stanley Martin':")
            for row in result:
                print(f"  ID: {row.id}")
                print(f"  Name: {row.first_name} {row.last_name}")
                print(f"  Username: {row.username}")
                print(f"  Email: {row.email}")
                print(f"  Role: {row.role_display_name} ({row.role_name})")
                
                # Check if role is Administrator
                is_admin = row.role_name == 'admin' or row.role_display_name == 'Administrator'
                print(f"  Is Administrator: {'✅ YES' if is_admin else '❌ NO'}")
                print("-" * 50)
        else:
            print("❌ No user found with name 'Stanley Martin'")
            
        session.close()
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")

if __name__ == "__main__":
    check_user_role()