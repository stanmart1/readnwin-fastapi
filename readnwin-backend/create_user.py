#!/usr/bin/env python3
import sys
sys.path.insert(0, '/Users/techclub/Documents/python-projects/readnwin-fastapi/readnwin-backend')

from sqlalchemy.orm import Session
from core.database import SessionLocal
from core.security import get_password_hash
from models.user import User
from models.role import Role

db = SessionLocal()
try:
    # Check if user exists
    existing = db.query(User).filter(User.email == "user@readnwin.com").first()
    if existing:
        print(f"❌ User already exists with ID: {existing.id}")
    else:
        # Get or create user role
        user_role = db.query(Role).filter(Role.name == "user").first()
        if not user_role:
            user_role = Role(name="user", display_name="User", description="Regular user")
            db.add(user_role)
            db.commit()
            db.refresh(user_role)
        
        # Create user
        new_user = User(
            email="user@readnwin.com",
            username="user_readnwin",
            password_hash=get_password_hash("User123"),
            first_name="User",
            last_name="ReadnWin",
            role_id=user_role.id,
            is_active=True,
            is_email_verified=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print(f"✅ User created successfully!")
        print(f"   ID: {new_user.id}")
        print(f"   Email: {new_user.email}")
        print(f"   Username: {new_user.username}")
        
except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")
finally:
    db.close()
